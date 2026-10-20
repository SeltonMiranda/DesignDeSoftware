import { Package } from "../../domain/package.js";
import { PackageSchema } from "./package.entity.js";

export class PackageMapper {
    static toDomain(row: PackageSchema): Package {
        return new Package(row.id, row.owner, row.createdAt);
    }

    static toPersistence(pack: Package): PackageSchema {
        const row = new PackageSchema();
        row.id = pack.id;
        row.owner = pack.owner;
        row.createdAt = pack.createdAt;
        return row;
    }
}