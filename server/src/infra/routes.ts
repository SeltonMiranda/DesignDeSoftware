import { Router } from "express";
import { AppDataSource } from "./data.source.js";

import { PackageController } from "../adapters/in/web/package.controller.js";
import { SolicitarEntregaService } from "../application/solicitar.entrega.service.js";
import { PgPackageRepository } from "../adapters/out/pg.package.repository.js";
import { PackageSchema } from "./database/package.entity.js";

export const routes = Router();

const encomendaRepository = new PgPackageRepository(
    AppDataSource.getRepository(PackageSchema)
);

const solicitarUseCase = new SolicitarEntregaService(encomendaRepository);
const encomendaController = new PackageController(solicitarUseCase);

routes.post('/encomendas', encomendaController.solicitar);