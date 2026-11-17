import type { DadosEncomenda, Situacao } from '#domain/package.js';

export interface ResultadoCadastro {
    codigoRastreio: string;
    situacao: Situacao;
    criadoEm: Date;
}

export interface SolicitarEntregaUseCase {
    execute(dados: DadosEncomenda): Promise<ResultadoCadastro>;
}
