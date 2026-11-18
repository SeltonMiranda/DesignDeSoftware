import type { Local } from '#domain/local.js';

export interface ListarLocaisUseCase {
    execute(): Promise<Local[]>;
}
