import { Router } from 'express';
import { AppDataSource } from '#infra/data.source.js';
import { PackageController } from '#infra/adapters/in/http/controllers/package.controller.js';
import { LocalController } from '#infra/adapters/in/http/controllers/local.controller.js';
import { SolicitarEntregaService } from '#application/services/solicitar.entrega.service.js';
import { ConsultarEncomendaService } from '#application/services/consultar.encomenda.service.js';
import { ListarLocaisService } from '#application/services/listar.locais.service.js';
import { TypeOrmPackageRepository } from '#infra/adapters/out/typeorm.package.repository.js';
import { TypeOrmLocalRepository } from '#infra/adapters/out/typeorm.local.repository.js';
import { ConsoleNotificador } from '#infra/adapters/out/console.notificador.js';
import { ConsoleLogger } from '#infra/adapters/out/console.logger.js';
import { RelogioSistema } from '#infra/adapters/out/relogio.sistema.js';
import { UuidCodigoGerador } from '#infra/adapters/out/uuid.codigo.gerador.js';
import { PackageSchema } from '#infra/database/package.entity.js';
import { LocalSchema } from '#infra/database/local.entity.js';

/**
 * Raiz de composição: único ponto que conhece os adaptadores concretos.
 * Trocar ORM, notificador etc. significa mudar apenas as linhas abaixo.
 */
export const routes = Router();

const packageRepository = new TypeOrmPackageRepository(AppDataSource.getRepository(PackageSchema));
const localRepository = new TypeOrmLocalRepository(AppDataSource.getRepository(LocalSchema));

const solicitarUseCase = new SolicitarEntregaService(
    packageRepository,
    localRepository,
    new ConsoleNotificador(),
    new UuidCodigoGerador(),
    new RelogioSistema(),
    new ConsoleLogger(),
);
const consultarUseCase = new ConsultarEncomendaService(packageRepository);
const listarLocaisUseCase = new ListarLocaisService(localRepository);

const packageController = new PackageController(solicitarUseCase, consultarUseCase);
const localController = new LocalController(listarLocaisUseCase);

routes.post('/encomendas', packageController.solicitar);
routes.get('/encomendas/:codigo', packageController.consultar);
routes.get('/locais', localController.listar);
