import { Local } from '../../src/domain/local.js';
import type { DadosEncomenda } from '../../src/domain/package.js';
import type { SolicitarEntregaComando } from '../../src/application/ports/in/solicitar.entrega.use-case.js';

export const localA = Local.criar(1, 'Politécnico', 'Bloco A', '101');
export const localB = Local.criar(2, 'Politécnico', 'Bloco B', '202');

export const dadosValidos: DadosEncomenda = {
    nomeRemetente: 'Ana Silva',
    localRemetente: localA,
    nomeDestinatario: 'João Souza',
    localDestinatario: localB,
    emailDestinatario: 'joao@ufpr.br',
    pesoKg: 2.5,
    conteudo: 'documento',
    prioridade: 'alta',
    descricao: 'Documentos de matrícula',
};

/** Mesmo pedido na forma que chega ao caso de uso (locais por id). */
export const comandoValido: SolicitarEntregaComando = {
    nomeRemetente: 'Ana Silva',
    localRemetenteId: 1,
    nomeDestinatario: 'João Souza',
    localDestinatarioId: 2,
    emailDestinatario: 'joao@ufpr.br',
    pesoKg: 2.5,
    conteudo: 'documento',
    prioridade: 'alta',
    descricao: 'Documentos de matrícula',
};
