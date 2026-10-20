# Build e execução do `server/`

Servidor TypeScript (Node 24, Express 5, TypeORM, PostgreSQL).

## Pré-requisitos

| Modo | Precisa de |
|------|-----------|
| Local (desenvolvimento) | Node >= 24, npm, um PostgreSQL acessível (pode ser o do Docker) |
| Docker | Docker + Docker Compose |


## 1. Desenvolvimento local 

1. Suba apenas o banco com Docker (a partir da raiz do projeto):
   ```bash
   docker compose up -d db
   ```
   Se preferir um Postgres próprio, ajuste o `DATABASE_URL` para ele.

2. Instale as dependências e rode com recarga automática:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   O `dev` usa `tsx watch` e lê `../.env`. O servidor sobe em `http://localhost:SERVER_PORT`.

3. Verificar se está de pé:
   ```bash
   curl http://localhost:SERVER_PORT/
   ```

### Scripts (`package.json`)

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Roda `src/main.ts` com `tsx watch` (recarrega ao salvar) |
| `npm run typecheck` | Checa os tipos sem gerar arquivos |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Roda o build (`dist/main.js`); lê `../.env` se existir |

### Build e execução local do compilado

```bash
cd server
npm run build
npm start
```

## 2. Docker

A partir da **raiz do projeto**:

```bash
docker compose up --build        # banco + servidor, em primeiro plano
docker compose up --build -d     # em segundo plano
```

- Servidor: `http://localhost:${SERVER_PORT}`.
- Banco: `127.0.0.1:${DB_PORT}` (padrão 5432). Os dados ficam no volume `pgdata`.
- O servidor só inicia depois que o banco passa no healthcheck.

Comandos úteis:

```bash
docker compose logs -f server    # logs do servidor
docker compose build server      # rebuild só do servidor
docker compose down              # para tudo (mantém os dados)
docker compose down -v           # para tudo E apaga o banco
```

### Build só da imagem do servidor

```bash
docker build -t campus-server ./server