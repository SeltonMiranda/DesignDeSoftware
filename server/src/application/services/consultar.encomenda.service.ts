import type { ConsultarEncomendaUseCase } from '#application/ports/in/consultar.encomenda.use-case.js';
import type { IPackageRepository } from '#application/ports/out/package.repository.js';
import type { Package } from '#domain/package.js';

export class ConsultarEncomendaService implements ConsultarEncomendaUseCase {
    constructor(private readonly packageRepository: IPackageRepository) {}

    async execute(codigo: string): Promise<Package | null> {
        if (typeof codigo !== 'string' || codigo.trim().length === 0) {
            return null;
        }
        return this.packageRepository.findById(codigo.trim());
    }
}
