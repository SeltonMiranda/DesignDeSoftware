import { Repository } from "typeorm";

import { Package } from "../../domain/package.js";
import { PackageRepository } from "../../ports/out/PackageRepository.js";
import { PostgresPackage } from "./PostgresPackage.js";
import { PackageMapper } from "./PackageMapper.js";

export class PostgresPackageRepository implements PackageRepository {
    constructor(private readonly repo: Repository<PostgresPackage>) {}

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