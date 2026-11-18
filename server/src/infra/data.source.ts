import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { LocalSchema } from './database/local.entity.js';
import { PackageSchema } from './database/package.entity.js';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [LocalSchema, PackageSchema],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: true,
});
