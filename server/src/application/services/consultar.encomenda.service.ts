import type { IPackageRepository } from '#application/ports/out/package.repository.js';
import type { Package } from '#domain/package.js';

/** Consulta por código de rastreio (RF02). */
export class ConsultarEncomendaService {
    constructor(private readonly encomendaRepository: IPackageRepository) {}

    async execute(codigo: string): Promise<Package | null> {
        if (typeof codigo !== 'string' || codigo.trim().length === 0) {
            return null;
        }
        return this.encomendaRepository.findById(codigo.trim());
    }
}
