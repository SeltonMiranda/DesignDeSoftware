import type { Conteudo, Prioridade, Situacao } from '#domain/package.js';

/** Dados de entrada do caso de uso. Origem e destino são ids de locais já cadastrados. */
export interface SolicitarEntregaComando {
    nomeRemetente: string;
    localRemetenteId: number;
    nomeDestinatario: string;
    localDestinatarioId: number;
    emailDestinatario: string;
    pesoKg: number;
    conteudo: Conteudo;
    prioridade: Prioridade;
    descricao?: string;
}

export interface ResultadoCadastro {
    codigoRastreio: string;
    situacao: Situacao;
    criadoEm: Date;
}

export interface SolicitarEntregaUseCase {
    execute(comando: SolicitarEntregaComando): Promise<ResultadoCadastro>;
}
