import type { Repository } from 'typeorm';
import { Package } from '#domain/package.js';
import type { IPackageRepository } from '#application/ports/out/package.repository.js';
import { PackageSchema } from '#infra/database/package.entity.js';
import { PackageMapper } from '#infra/database/package.mapper.js';

export class PgPackageRepository implements IPackageRepository {
    constructor(private readonly repo: Repository<PackageSchema>) {}

    async save(pack: Package): Promise<void> {
        await this.repo.save(PackageMapper.toPersistence(pack));
    }

    async findById(id: string): Promise<Package | null> {
        const row = await this.repo.findOneBy({ id });
        return row ? PackageMapper.toDomain(row) : null;
    }

    async findAll(): Promise<Package[]> {
        const rows = await this.repo.find();
        return rows.map(PackageMapper.toDomain);
    }
}
