import type { ListarLocaisUseCase } from '#application/ports/in/listar.locais.use-case.js';
import type { ILocalRepository } from '#application/ports/out/local.repository.js';
import type { Local } from '#domain/local.js';

export class ListarLocaisService implements ListarLocaisUseCase {
    constructor(private readonly localRepository: ILocalRepository) {}

    execute(): Promise<Local[]> {
        return this.localRepository.findAll();
    }
}
