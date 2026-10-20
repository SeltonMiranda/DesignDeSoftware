import { Package } from "../../domain/package.js"

export interface PackageRepository {
    save(pack: Package): Promise<void>;
    findById(id: string): Promise<Package | null>;
    findAll(): Promise<Package[]>
}