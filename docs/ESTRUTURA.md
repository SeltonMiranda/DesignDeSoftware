# Estrutura do `server/`

O servidor segue **arquitetura hexagonal**: o núcleo (domínio + aplicação) não depende de Express nem de TypeORM; quem depende do núcleo são os adaptadores.

```
server/
├── src/
│   ├── domain/
│   ├── application/
│   ├── ports/
│   │   ├── in/
│   │   └── out/
│   ├── adapters/
│   │   ├── in/web/
│   │   └── db/
│   ├── infra/
│   └── main.ts
├── Dockerfile
├── package.json
├── tsconfig.json
└── .dockerignore
```

## Pastas

| Pasta | Função | Pode depender de |
|-------|--------|------------------|
| `src/domain/` | Entidades e regras de negócio (ex.: `Package`). Sem framework. | nada |
| `src/application/` | Casos de uso: orquestram o domínio e usam as portas (ex.: `SolicitarEntregaService`). | `domain`, `ports` |
| `src/ports/in/` | Interfaces de **entrada**: o que o mundo externo pode pedir ao sistema (ex.: `SolicitarEntregaUseCase`). | `domain` |
| `src/ports/out/` | Interfaces de **saída**: o que o núcleo precisa do mundo externo (ex.: `PackageRepository`). | `domain` |
| `src/adapters/in/web/` | Adaptadores de entrada HTTP: controllers Express que traduzem requisições em chamadas aos casos de uso. | `ports/in` |
| `src/adapters/db/` | Adaptadores de saída para o PostgreSQL: entidades TypeORM e implementações dos repositórios. | `ports/out`, `domain`, TypeORM |
| `src/infra/` | Configuração e montagem: conexão com o banco (`data.source.ts`) e rotas/injeção de dependências (`routes.ts`). | tudo |
| `src/main.ts` | Ponto de entrada: inicia o banco e o servidor Express. | `infra` |

## Arquivos na raiz de `server/`

| Arquivo | Função |
|---------|--------|
| `Dockerfile` | Build multi-stage da imagem do servidor. |
| `package.json` | Dependências e scripts (`dev`, `build`, `start`, `typecheck`). |
| `tsconfig.json` | Configuração do TypeScript (ESM/NodeNext, decorators para o TypeORM). |
| `.dockerignore` | Exclui `node_modules`, `dist`, `.env` e `.git` do contexto de build. |
| `BUILD.md` | Como rodar localmente e com Docker. |