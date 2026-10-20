import { Repository } from "typeorm";

import { Package } from "../../domain/package.js";
import { IPackageRepository } from "../../ports/out/package.repository.js";
import { PackageSchema } from "../../infra/database/package.entity.js";
import { PackageMapper } from "../../infra/database/package.mapper.js";

export class PgPackageRepository implements IPackageRepository {
    constructor(private readonly repo: Repository<PackageSchema>) {}

    async save(pack: Package): Promise<void> {
        console.log('precisa implementar');
        await this.repo.save(PackageMapper.toPersistence(pack));
    }

    findById(id: string): Promise<Package | null> {
        return Promise.resolve(null); 
    }

    findAll(): Promise<Package[]> {
        return Promise.resolve([]);
    }
}