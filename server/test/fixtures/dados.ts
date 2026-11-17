import type { DadosEncomenda } from '../../src/domain/package.js';

export const dadosValidos: DadosEncomenda = {
    nomeRemetente: 'Ana Silva',
    localRemetente: { campus: 'Politécnico', predio: 'Bloco A', sala: '101' },
    nomeDestinatario: 'João Souza',
    localDestinatario: { campus: 'Politécnico', predio: 'Bloco B', sala: '202' },
    emailDestinatario: 'joao@ufpr.br',
    pesoKg: 2.5,
    conteudo: 'documento',
    prioridade: 'alta',
    descricao: 'Documentos de matrícula',
};
