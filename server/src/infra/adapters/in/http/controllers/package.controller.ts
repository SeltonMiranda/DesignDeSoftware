import { Request, Response } from "express";

import { SolicitarEntregaUseCase } from "#application/ports/in/solicitar.entrega.use-case.js";

export class PackageController {
    constructor(
        private readonly solicitarUseCase: SolicitarEntregaUseCase,
    ) {}

    solicitar = (req: Request, res: Response): void  => {
        this.solicitarUseCase.execute();
    };
}
