import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SolicitarEntregaService } from '../../src/application/services/solicitar.entrega.service.js';
import { ConsultarEncomendaService } from '../../src/application/services/consultar.encomenda.service.js';
import { ListarLocaisService } from '../../src/application/services/listar.locais.service.js';
import type { IPackageRepository } from '../../src/application/ports/out/package.repository.js';
import type { ILocalRepository } from '../../src/application/ports/out/local.repository.js';
import type { INotificador, Notificacao } from '../../src/application/ports/out/notificador.js';
import type { ILogger } from '../../src/application/ports/out/logger.js';
import type { Local } from '../../src/domain/local.js';
import type { Package } from '../../src/domain/package.js';
import { DadosInvalidosError, LocalNaoEncontradoError } from '../../src/domain/erros.js';
import { comandoValido, localA, localB } from '../fixtures/dados.js';

class RepositorioMemoria implements IPackageRepository {
    readonly salvos = new Map<string, Package>();
    async save(pack: Package): Promise<void> { this.salvos.set(pack.id, pack); }
    async findById(id: string): Promise<Package | null> { return this.salvos.get(id) ?? null; }
    async findAll(): Promise<Package[]> { return [...this.salvos.values()]; }
}

class LocaisMemoria implements ILocalRepository {
    constructor(private readonly locais: Local[] = [localA, localB]) {}
    async findById(id: number): Promise<Local | null> { return this.locais.find((l) => l.id === id) ?? null; }
    async findAll(): Promise<Local[]> { return [...this.locais]; }
}

class NotificadorMemoria implements INotificador {
    notificacoes: Notificacao[] = [];
    notificar(dados: Notificacao): void { this.notificacoes.push(dados); }
}

class LoggerMemoria implements ILogger {
    erros: string[] = [];
    erro(mensagem: string): void { this.erros.push(mensagem); }
}

function casoDeUso(repositorio: IPackageRepository, notificador: INotificador, logger: ILogger = new LoggerMemoria()) {
    return new SolicitarEntregaService(
        repositorio,
        new LocaisMemoria(),
        notificador,
        { gerar: () => 'POL-TESTE123' },
        { agora: () => new Date('2026-11-15T15:00:00.000Z') },
        logger,
    );
}

const proximoCiclo = () => new Promise<void>((resolve) => setImmediate(resolve));

test('cadastro válido chama repositório e notifica após gravação', async () => {
    const repo = new RepositorioMemoria();
    const notif = new NotificadorMemoria();
    const resultado = await casoDeUso(repo, notif).execute(comandoValido);
    assert.equal(resultado.codigoRastreio, 'POL-TESTE123');
    assert.equal(resultado.criadoEm.toISOString(), '2026-11-15T15:00:00.000Z');
    const salva = repo.salvos.get(resultado.codigoRastreio);
    assert.equal(salva?.situacao, 'AGUARDANDO_COLETA');
    assert.equal(salva?.localRemetente.id, 1);
    assert.equal(salva?.localDestinatario.id, 2);
    await proximoCiclo();
    assert.deepEqual(notif.notificacoes, [{
        destino: 'joao@ufpr.br', codigoRastreio: 'POL-TESTE123', situacao: 'AGUARDANDO_COLETA',
    }]);
});

test('cadastro inválido não persiste e não notifica', async () => {
    const repo = new RepositorioMemoria();
    const notif = new NotificadorMemoria();
    await assert.rejects(casoDeUso(repo, notif).execute({ ...comandoValido, pesoKg: 31 }), /Peso deve/);
    assert.equal(repo.salvos.size, 0);
    assert.equal(notif.notificacoes.length, 0);
});

test('local inexistente é rejeitado sem persistir nem notificar', async () => {
    const repo = new RepositorioMemoria();
    const notif = new NotificadorMemoria();
    await assert.rejects(
        casoDeUso(repo, notif).execute({ ...comandoValido, localDestinatarioId: 99 }),
        LocalNaoEncontradoError,
    );
    assert.equal(repo.salvos.size, 0);
    await proximoCiclo();
    assert.equal(notif.notificacoes.length, 0);
});

test('id de local ausente ou inválido é erro de dados (400)', async () => {
    const caso = casoDeUso(new RepositorioMemoria(), new NotificadorMemoria());
    await assert.rejects(caso.execute({ ...comandoValido, localRemetenteId: undefined as unknown as number }), DadosInvalidosError);
    await assert.rejects(caso.execute({ ...comandoValido, localRemetenteId: 1.5 }), DadosInvalidosError);
    await assert.rejects(caso.execute(undefined as unknown as typeof comandoValido), DadosInvalidosError);
});

test('origem e destino iguais são rejeitados', async () => {
    const repo = new RepositorioMemoria();
    await assert.rejects(
        casoDeUso(repo, new NotificadorMemoria()).execute({ ...comandoValido, localDestinatarioId: 1 }),
        /Origem e destino/,
    );
    assert.equal(repo.salvos.size, 0);
});

test('falha do banco impede envio da notificação', async () => {
    const notif = new NotificadorMemoria();
    const repo: IPackageRepository = {
        save: async () => { throw new Error('Banco indisponível'); },
        findById: async () => null,
        findAll: async () => [],
    };
    await assert.rejects(casoDeUso(repo, notif).execute(comandoValido), /Banco indisponível/);
    await proximoCiclo();
    assert.equal(notif.notificacoes.length, 0);
});

test('falha na notificação não desfaz cadastro e é registrada no logger', async () => {
    const repo = new RepositorioMemoria();
    const logger = new LoggerMemoria();
    const notif: INotificador = { notificar: () => Promise.reject(new Error('Falha simulada')) };
    const resultado = await casoDeUso(repo, notif, logger).execute(comandoValido);
    await proximoCiclo();
    assert.ok(repo.salvos.has(resultado.codigoRastreio));
    assert.equal(logger.erros.length, 1);
});

test('notificador que lança erro síncrono também não desfaz cadastro', async () => {
    const repo = new RepositorioMemoria();
    const logger = new LoggerMemoria();
    const notif: INotificador = { notificar: () => { throw new Error('Falha síncrona'); } };
    const resultado = await casoDeUso(repo, notif, logger).execute(comandoValido);
    await proximoCiclo();
    assert.ok(repo.salvos.has(resultado.codigoRastreio));
    assert.equal(logger.erros.length, 1);
});

test('consulta devolve encomenda por código e null para código inexistente', async () => {
    const repo = new RepositorioMemoria();
    await casoDeUso(repo, new NotificadorMemoria()).execute(comandoValido);
    const consulta = new ConsultarEncomendaService(repo);
    assert.equal((await consulta.execute('POL-TESTE123'))?.nomeDestinatario, 'João Souza');
    assert.equal(await consulta.execute('POL-NAOEXISTE'), null);
    assert.equal(await consulta.execute('   '), null);
});

test('listar locais devolve os locais do repositório', async () => {
    const locais = await new ListarLocaisService(new LocaisMemoria()).execute();
    assert.deepEqual(locais.map((l) => l.id), [1, 2]);
});
