import { Package } from "#domain/package.js";
import { SolicitarEntregaUseCase } from "#application/ports/in/solicitar.entrega.use-case.js";
import { IPackageRepository } from "#application/ports/out/package.repository.js";

export class SolicitarEntregaService implements SolicitarEntregaUseCase {
    constructor(
        private readonly encomendaRepository: IPackageRepository
    ) {}

    execute(): void {
        this.encomendaRepository.save(new Package('1', 'selton'));
        console.log("implementar!");
    }
}