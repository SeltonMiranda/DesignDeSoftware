import { Request, Response } from "express";

import { SolicitarEntregaUseCase } from "../../../ports/in/SolicitarEntregaUseCase.js";
import { PackageRepository } from "../../../ports/out/PackageRepository.js";

export class PackageController {
    constructor(
        private readonly solicitarUseCase: SolicitarEntregaUseCase,
    ) {}

    solicitar = (req: Request, res: Response): void  => {
        this.solicitarUseCase.execute();
    };
}
