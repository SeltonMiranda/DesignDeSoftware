import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PackageSchema } from './database/package.entity.js';


export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [PackageSchema],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: true,
});