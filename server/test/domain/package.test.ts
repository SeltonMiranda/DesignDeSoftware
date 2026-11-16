import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DadosInvalidosError, Package } from '../../src/domain/package.js';
import type { DadosEncomenda } from '../../src/domain/package.js';
import { dadosValidos } from '../fixtures/dados.js';



function cadastrar(dados: DadosEncomenda = dadosValidos) {
    return Package.cadastrar(dados, 'POL-TESTE123', new Date('2026-11-15T15:00:00.000Z'));
}

test('cadastro válido gera estado inicial e exatamente uma movimentação', () => {
    const encomenda = cadastrar();
    assert.equal(encomenda.id, 'POL-TESTE123');
    assert.equal(encomenda.situacao, 'AGUARDANDO_COLETA');
    assert.equal(encomenda.prioridade, 'alta');
    assert.equal(encomenda.historicoMovimentacao.length, 1);
    assert.equal(encomenda.historicoMovimentacao[0]?.situacao, 'AGUARDANDO_COLETA');
    assert.equal(encomenda.createdAt.toISOString(), '2026-11-15T15:00:00.000Z');
});

test('aceita peso exatamente 30 kg', () => {
    assert.equal(cadastrar({ ...dadosValidos, pesoKg: 30 }).volume.pesoKg, 30);
});

for (const pesoKg of [0, -1, 30.1, Number.NaN, Number.POSITIVE_INFINITY]) {
    test(`rejeita peso inválido (${pesoKg})`, () => {
        assert.throws(() => cadastrar({ ...dadosValidos, pesoKg }), DadosInvalidosError);
    });
}

test('rejeita origem e destino iguais, independentemente de espaços e caixa', () => {
    const dados = { ...dadosValidos, localDestinatario: { campus: 'politécnico', predio: 'BLOCO A', sala: '101 ' } };
    assert.throws(() => cadastrar(dados), /Origem e destino/);
});

test('rejeita conteúdo, prioridade e e-mail inválidos', () => {
    assert.throws(() => cadastrar({ ...dadosValidos, conteudo: 'outro' as DadosEncomenda['conteudo'] }), DadosInvalidosError);
    assert.throws(() => cadastrar({ ...dadosValidos, prioridade: 'urgente' as DadosEncomenda['prioridade'] }), DadosInvalidosError);
    assert.throws(() => cadastrar({ ...dadosValidos, emailDestinatario: 'sem-arroba' }), DadosInvalidosError);
});

test('rejeita ausência de campo obrigatório', () => {
    assert.throws(() => cadastrar({ ...dadosValidos, nomeRemetente: ' ' }), DadosInvalidosError);
    assert.throws(() => cadastrar({ ...dadosValidos, localRemetente: { campus: 'Politécnico', predio: ' ', sala: '2' } }), DadosInvalidosError);
});

test('histórico exposto não altera o registro original', () => {
    const encomenda = cadastrar();
    const historico = encomenda.historicoMovimentacao;
    historico[0]!.ocorridoEm.setFullYear(2000);
    assert.equal(encomenda.historicoMovimentacao[0]!.ocorridoEm.getUTCFullYear(), 2026);
});
