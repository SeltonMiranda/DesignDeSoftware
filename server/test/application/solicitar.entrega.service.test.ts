import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SolicitarEntregaService } from '../../src/application/services/solicitar.entrega.service.js';
import { ConsultarEncomendaService } from '../../src/application/services/consultar.encomenda.service.js';
import type { IPackageRepository } from '../../src/application/ports/out/package.repository.js';
import type { INotificador, Notificacao } from '../../src/application/ports/out/notificador.js';
import type { Package } from '../../src/domain/package.js';
import { dadosValidos } from '../fixtures/dados.js';

class RepositorioMemoria implements IPackageRepository {
    readonly salvos = new Map<string, Package>();
    async save(pack: Package): Promise<void> { this.salvos.set(pack.id, pack); }
    async findById(id: string): Promise<Package | null> { return this.salvos.get(id) ?? null; }
    async findAll(): Promise<Package[]> { return [...this.salvos.values()]; }
}

class NotificadorMemoria implements INotificador {
    notificacoes: Notificacao[] = [];
    notificar(dados: Notificacao): void { this.notificacoes.push(dados); }
}

function casoDeUso(repositorio: IPackageRepository, notificador: INotificador) {
    return new SolicitarEntregaService(repositorio, notificador,
        () => 'POL-TESTE123', () => new Date('2026-11-15T15:00:00.000Z'));
}

test('cadastro válido chama repositório e notifica após gravação', async () => {
    const repo = new RepositorioMemoria();
    const notif = new NotificadorMemoria();
    const resultado = await casoDeUso(repo, notif).execute(dadosValidos);
    assert.equal(resultado.codigoRastreio, 'POL-TESTE123');
    assert.equal(repo.salvos.get(resultado.codigoRastreio)?.situacao, 'AGUARDANDO_COLETA');
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.deepEqual(notif.notificacoes, [{
        destino: 'joao@ufpr.br', codigoRastreio: 'POL-TESTE123', situacao: 'AGUARDANDO_COLETA',
    }]);
});

test('cadastro inválido não persiste e não notifica', async () => {
    const repo = new RepositorioMemoria();
    const notif = new NotificadorMemoria();
    await assert.rejects(casoDeUso(repo, notif).execute({ ...dadosValidos, pesoKg: 31 }), /Peso deve/);
    assert.equal(repo.salvos.size, 0);
    assert.equal(notif.notificacoes.length, 0);
});

test('falha do banco impede envio da notificação', async () => {
    const notif = new NotificadorMemoria();
    const repo: IPackageRepository = {
        save: async () => { throw new Error('Banco indisponível'); },
        findById: async () => null,
        findAll: async () => [],
    };
    await assert.rejects(casoDeUso(repo, notif).execute(dadosValidos), /Banco indisponível/);
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(notif.notificacoes.length, 0);
});

test('falha na notificação não desfaz cadastro', async () => {
    const repo = new RepositorioMemoria();
    const notif: INotificador = { notificar: () => Promise.reject(new Error('Falha simulada')) };
    const erroOriginal = console.error;
    console.error = () => {};
    try {
        const resultado = await casoDeUso(repo, notif).execute(dadosValidos);
        await new Promise<void>((resolve) => setImmediate(resolve));
        assert.ok(repo.salvos.has(resultado.codigoRastreio));
    } finally { console.error = erroOriginal; }
});

test('consulta devolve encomenda por código e null para código inexistente', async () => {
    const repo = new RepositorioMemoria();
    await casoDeUso(repo, new NotificadorMemoria()).execute(dadosValidos);
    const consulta = new ConsultarEncomendaService(repo);
    assert.equal((await consulta.execute('POL-TESTE123'))?.nomeDestinatario, 'João Souza');
    assert.equal(await consulta.execute('POL-NAOEXISTE'), null);
});
