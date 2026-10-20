import { Package } from "../domain/package.js";
import { SolicitarEntregaUseCase } from "../ports/in/SolicitarEntregaUseCase.js";
import { PackageRepository } from "../ports/out/PackageRepository.js";

export class SolicitarEntregaService implements SolicitarEntregaUseCase {
    constructor(
        private readonly encomendaRepository: PackageRepository
    ) {}

    execute(): void {
        this.encomendaRepository.save(new Package('1', 'selton'));
        console.log("implementar!");
    }
}