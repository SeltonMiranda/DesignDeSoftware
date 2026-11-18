import type { Local } from '#domain/local.js';

export interface ILocalRepository {
    findById(id: number): Promise<Local | null>;
    findAll(): Promise<Local[]>;
}
