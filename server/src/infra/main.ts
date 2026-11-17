import express from 'express';
import type { Request, Response } from 'express';
import { AppDataSource } from './data.source.js';
import { routes } from './adapters/in/http/routes/routes.js';

await AppDataSource.initialize();

const app = express();
app.use(express.json());
app.use(routes);

app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Sistema de entregas internas — UFPR' });
});

const porta = Number(process.env.SERVER_PORT ?? 3000);
app.listen(porta, () => {
    console.log(`Servidor rodando na porta ${porta}`);
});
