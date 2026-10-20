import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PostgresPackage } from '../adapters/db/PostgresPackage.js';


export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [PostgresPackage],
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: true,
});