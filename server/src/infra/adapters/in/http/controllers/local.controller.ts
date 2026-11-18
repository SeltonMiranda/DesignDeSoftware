import type { Request, Response } from 'express';
import type { ListarLocaisUseCase } from '#application/ports/in/listar.locais.use-case.js';

export class LocalController {
    constructor(private readonly listarUseCase: ListarLocaisUseCase) {}

    listar = async (_req: Request, res: Response): Promise<void> => {
        try {
            const locais = await this.listarUseCase.execute();
            res.json(locais.map((l) => ({ id: l.id, campus: l.campus, predio: l.predio, sala: l.sala })));
        } catch (erro) {
            console.error('Erro ao listar locais:', erro);
            res.status(500).json({ erro: 'Não foi possível listar os locais.' });
        }
    };
}
