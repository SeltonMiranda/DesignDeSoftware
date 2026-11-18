import { Local } from '#domain/local.js';
import { LocalSchema } from '#infra/database/local.entity.js';

export class LocalMapper {
    static toDomain(row: LocalSchema): Local {
        return Local.criar(row.id, row.campus, row.predio, row.sala);
    }

    static toPersistence(local: Local): LocalSchema {
        const row = new LocalSchema();
        row.id = local.id;
        row.campus = local.campus;
        row.predio = local.predio;
        row.sala = local.sala;
        return row;
    }
}
