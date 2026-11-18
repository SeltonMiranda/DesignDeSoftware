import type { Repository } from 'typeorm';
import type { Local } from '#domain/local.js';
import type { ILocalRepository } from '#application/ports/out/local.repository.js';
import { LocalSchema } from '#infra/database/local.entity.js';
import { LocalMapper } from '#infra/database/local.mapper.js';

/** Adaptador de saída: lê os locais cadastrados na tabela `locais` via TypeORM. */
export class TypeOrmLocalRepository implements ILocalRepository {
    constructor(private readonly repo: Repository<LocalSchema>) {}

    async findById(id: number): Promise<Local | null> {
        const row = await this.repo.findOneBy({ id });
        return row ? LocalMapper.toDomain(row) : null;
    }

    async findAll(): Promise<Local[]> {
        const rows = await this.repo.find({ order: { id: 'ASC' } });
        return rows.map(LocalMapper.toDomain);
    }
}
