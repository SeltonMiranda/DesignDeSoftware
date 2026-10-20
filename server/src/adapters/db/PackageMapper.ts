import { Package } from "../../domain/package.js";
import { PostgresPackage } from "./PostgresPackage.js";

export class PackageMapper {
    static toDomain(row: PostgresPackage): Package {
        return new Package(row.id, row.owner, row.createdAt);
    }

    static toPersistence(pack: Package): PostgresPackage {
        const row = new PostgresPackage();
        row.id = pack.id;
        row.owner = pack.owner;
        row.createdAt = pack.createdAt;
        return row;
    }
}