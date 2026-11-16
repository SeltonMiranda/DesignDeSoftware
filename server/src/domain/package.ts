/** Núcleo do domínio, sem dependência de HTTP ou banco de dados. */
export type Prioridade = 'baixa' | 'media' | 'alta';
export type Conteudo = 'documento' | 'volume';
export type Situacao = 'AGUARDANDO_COLETA' | 'EM_TRANSITO' | 'ENTREGUE' | 'CANCELADA';

export interface LocalCampus {
    campus: string;
    predio: string;
    sala: string;
}

export interface DadosEncomenda {
    nomeRemetente: string;
    localRemetente: LocalCampus;
    nomeDestinatario: string;
    localDestinatario: LocalCampus;
    emailDestinatario: string;
    pesoKg: number;
    conteudo: Conteudo;
    prioridade: Prioridade;
    descricao?: string;
}

export interface Movimentacao {
    situacao: Situacao;
    ocorridoEm: Date;
    motivoCancelamento?: string;
}

export class DadosInvalidosError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DadosInvalidosError';
    }
}

function textoObrigatorio(value: unknown, campo: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new DadosInvalidosError(`${campo} é obrigatório.`);
    }
    return value.trim();
}

function validarLocal(value: unknown, campo: string): LocalCampus {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new DadosInvalidosError(`${campo} deve informar campus, predio e sala.`);
    }
    const dados = value as Partial<LocalCampus>;
    return {
        campus: textoObrigatorio(dados.campus, `${campo}.campus`),
        predio: textoObrigatorio(dados.predio, `${campo}.predio`),
        sala: textoObrigatorio(dados.sala, `${campo}.sala`),
    };
}

function localNormalizado(local: LocalCampus): string {
    return [local.campus, local.predio, local.sala]
        .map((parte) => parte.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
        .join('|');
}

export class Volume {
    private constructor(
        public readonly descricao: string,
        public readonly tipo: Conteudo,
        public readonly pesoKg: number,
    ) {}

    static criar(descricao: unknown, tipo: unknown, pesoKg: unknown): Volume {
        if (tipo !== 'documento' && tipo !== 'volume') {
            throw new DadosInvalidosError('Conteúdo deve ser documento ou volume.');
        }
        if (typeof pesoKg !== 'number' || !Number.isFinite(pesoKg) || pesoKg <= 0 || pesoKg > 30) {
            throw new DadosInvalidosError('Peso deve ser maior que zero e de até 30 kg.');
        }
        const descricaoNormalizada = descricao === undefined
            ? tipo
            : textoObrigatorio(descricao, 'Descrição');
        return new Volume(descricaoNormalizada, tipo, pesoKg);
    }
}

/** Uma encomenda possui um Volume e um primeiro evento de movimentação no cadastro. */
export class Package {
    private constructor(
        public readonly id: string,
        public readonly nomeRemetente: string,
        public readonly localRemetente: LocalCampus,
        public readonly nomeDestinatario: string,
        public readonly localDestinatario: LocalCampus,
        public readonly emailDestinatario: string,
        public readonly volume: Volume,
        public readonly prioridade: Prioridade,
        public readonly situacao: Situacao,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        private readonly movimentacoes: readonly Movimentacao[],
    ) {}

    static cadastrar(dados: DadosEncomenda, codigo: string, instante: Date = new Date()): Package {
        if (dados === null || typeof dados !== 'object') {
            throw new DadosInvalidosError('Dados do cadastro são obrigatórios.');
        }
        const nomeRemetente = textoObrigatorio(dados.nomeRemetente, 'Nome do remetente');
        const nomeDestinatario = textoObrigatorio(dados.nomeDestinatario, 'Nome do destinatário');
        const localRemetente = validarLocal(dados.localRemetente, 'Local do remetente');
        const localDestinatario = validarLocal(dados.localDestinatario, 'Local do destinatário');
        if (localNormalizado(localRemetente) === localNormalizado(localDestinatario)) {
            throw new DadosInvalidosError('Origem e destino devem ser diferentes.');
        }
        const emailDestinatario = textoObrigatorio(dados.emailDestinatario, 'E-mail do destinatário');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDestinatario)) {
            throw new DadosInvalidosError('E-mail do destinatário é inválido.');
        }
        if (dados.prioridade !== 'baixa' && dados.prioridade !== 'media' && dados.prioridade !== 'alta') {
            throw new DadosInvalidosError('Prioridade deve ser baixa, media ou alta.');
        }
        const volume = Volume.criar(dados.descricao, dados.conteudo, dados.pesoKg);
        const id = textoObrigatorio(codigo, 'Código de rastreamento');
        const criadoEm = new Date(instante.getTime());
        if (Number.isNaN(criadoEm.getTime())) {
            throw new DadosInvalidosError('Data de cadastro inválida.');
        }
        return new Package(id, nomeRemetente, localRemetente, nomeDestinatario,
            localDestinatario, emailDestinatario, volume, dados.prioridade,
            'AGUARDANDO_COLETA', criadoEm, new Date(criadoEm),
            [{ situacao: 'AGUARDANDO_COLETA', ocorridoEm: new Date(criadoEm) }]);
    }

    /** Reconstrói a entidade a partir da persistência; não gera novo evento. */
    static restaurar(dados: {
        id: string;
        nomeRemetente: string;
        localRemetente: LocalCampus;
        nomeDestinatario: string;
        localDestinatario: LocalCampus;
        emailDestinatario: string;
        descricao: string;
        conteudo: Conteudo;
        pesoKg: number;
        prioridade: Prioridade;
        situacao: Situacao;
        createdAt: Date;
        updatedAt: Date;
        movimentacoes: readonly Movimentacao[];
    }): Package {
        const volume = Volume.criar(dados.descricao, dados.conteudo, dados.pesoKg);
        return new Package(dados.id, dados.nomeRemetente, dados.localRemetente,
            dados.nomeDestinatario, dados.localDestinatario, dados.emailDestinatario,
            volume, dados.prioridade, dados.situacao, dados.createdAt, dados.updatedAt,
            dados.movimentacoes.map((mov) => ({ ...mov, ocorridoEm: new Date(mov.ocorridoEm) })));
    }

    get historicoMovimentacao(): readonly Movimentacao[] {
        return this.movimentacoes.map((mov) => ({ ...mov, ocorridoEm: new Date(mov.ocorridoEm) }))
            .sort((a, b) => b.ocorridoEm.getTime() - a.ocorridoEm.getTime());
    }
}
