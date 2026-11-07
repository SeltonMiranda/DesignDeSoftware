import { Router } from "express";

import { AppDataSource } from "#infra/data.source.js";
import { PackageController } from "#infra/adapters/in/http/controllers/package.controller.js";
import { SolicitarEntregaService } from "#application/solicitar.entrega.service.js";
import { PgPackageRepository } from "#infra/adapters/out/pg.package.repository.js";
import { PackageSchema } from "#infra/database/package.entity.js";


export const routes = Router();

const encomendaRepository = new PgPackageRepository(
    AppDataSource.getRepository(PackageSchema)
);

const solicitarUseCase = new SolicitarEntregaService(encomendaRepository);
const encomendaController = new PackageController(solicitarUseCase);

routes.post('/encomendas', encomendaController.solicitar);