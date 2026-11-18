import { DadosInvalidosError } from '#domain/erros.js';

/** Local do campus (campus, prédio e sala) previamente cadastrado. */
export class Local {
    private constructor(
        public readonly id: number,
        public readonly campus: string,
        public readonly predio: string,
        public readonly sala: string,
    ) {}

    static criar(id: unknown, campus: unknown, predio: unknown, sala: unknown): Local {
        if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
            throw new DadosInvalidosError('Id do local deve ser um inteiro positivo.');
        }
        return new Local(id, textoLocal(campus, 'campus'), textoLocal(predio, 'predio'), textoLocal(sala, 'sala'));
    }
}

function textoLocal(value: unknown, campo: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new DadosInvalidosError(`Local.${campo} é obrigatório.`);
    }
    return value.trim();
}
