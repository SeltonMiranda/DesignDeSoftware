import express from 'express';
import { Request, Response } from 'express';
import { AppDataSource } from './infra/data.source.js';

import { routes } from './infra/routes.js';

await AppDataSource.initialize();

const app = express();
app.use(express.json());

app.use(routes);

app.get('/', (req: Request, res: Response) => {
    res.send({ message: "Hello FROM TYPESCRIPT"});
})


app.listen(process.env.SERVER_PORT, () => {
    console.log(`Servidor rodando na porta ${process.env.SERVER_PORT}`);
})

console.log('hello world');