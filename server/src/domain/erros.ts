/** Erros de domínio: não dependem de HTTP nem de banco de dados. */
export class DadosInvalidosError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DadosInvalidosError';
    }
}

/** Local informado não existe no cadastro de locais. É um tipo de dado inválido do pedido. */
export class LocalNaoEncontradoError extends DadosInvalidosError {
    constructor(message: string) {
        super(message);
        this.name = 'LocalNaoEncontradoError';
    }
}
