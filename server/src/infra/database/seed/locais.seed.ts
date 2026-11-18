import type { DataSource } from 'typeorm';
import { LocalSchema } from '#infra/database/local.entity.js';

/** Dados de exemplo; ids fixos para que as requisições de teste sejam reproduzíveis. */
export const LOCAIS_INICIAIS: readonly LocalSchema[] = [
    { id: 1, campus: 'Politécnico', predio: 'Departamento de Informática', sala: 'Secretaria' },
    { id: 2, campus: 'Politécnico', predio: 'Departamento de Informática', sala: 'Laboratório C3SL' },
    { id: 3, campus: 'Politécnico', predio: 'Departamento de Informática', sala: 'Sala 101' },
    { id: 4, campus: 'Politécnico', predio: 'Biblioteca de Ciência e Tecnologia', sala: 'Balcão de Atendimento' },
    { id: 5, campus: 'Politécnico', predio: 'Administração', sala: 'Protocolo' },
    { id: 6, campus: 'Politécnico', predio: 'Administração', sala: 'Secretaria Geral' },
    { id: 7, campus: 'Politécnico', predio: 'Engenharia Civil', sala: 'Secretaria' },
    { id: 8, campus: 'Agrárias', predio: 'Administração', sala: 'Secretaria' },
];

/**
 * Insere os locais iniciais na tabela `locais`. É idempotente: linhas que já
 * existem (mesmo id ou mesma combinação campus/prédio/sala) são mantidas.
 */
export async function semearLocais(dataSource: DataSource): Promise<void> {
    await dataSource
        .createQueryBuilder()
        .insert()
        .into(LocalSchema)
        .values([...LOCAIS_INICIAIS])
        .orIgnore()
        .execute();
}
