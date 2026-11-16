import { Router } from 'express';
import { AppDataSource } from '#infra/data.source.js';
import { PackageController } from '#infra/adapters/in/http/controllers/package.controller.js';
import { SolicitarEntregaService } from '#application/services/solicitar.entrega.service.js';
import { ConsultarEncomendaService } from '#application/services/consultar.encomenda.service.js';
import { PgPackageRepository } from '#infra/adapters/out/pg.package.repository.js';
import { ConsoleNotificador } from '#infra/adapters/out/console.notificador.js';
import { PackageSchema } from '#infra/database/package.entity.js';

export const routes = Router();

const encomendaRepository = new PgPackageRepository(AppDataSource.getRepository(PackageSchema));
const solicitarUseCase = new SolicitarEntregaService(encomendaRepository, new ConsoleNotificador());
const consultarUseCase = new ConsultarEncomendaService(encomendaRepository);
const encomendaController = new PackageController(solicitarUseCase, consultarUseCase);

routes.post('/encomendas', encomendaController.solicitar);
routes.get('/encomendas/:codigo', encomendaController.consultar);
