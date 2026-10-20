import { Router } from "express";
import { AppDataSource } from "./data.source.js";

import { PackageController } from "../adapters/in/web/PackageController.js";
import { SolicitarEntregaService } from "../application/SolicitarEntregaService.js";
import { PostgresPackageRepository } from "../adapters/db/PostgresPackageRepository.js";
import { PostgresPackage } from "../adapters/db/PostgresPackage.js";

export const routes = Router();

const encomendaRepository = new PostgresPackageRepository(
    AppDataSource.getRepository(PostgresPackage)
);

const solicitarUseCase = new SolicitarEntregaService(encomendaRepository);
const encomendaController = new PackageController(solicitarUseCase);

routes.post('/encomendas', encomendaController.solicitar);