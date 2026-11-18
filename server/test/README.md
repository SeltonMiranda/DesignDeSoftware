# Testes automatizados — cadastro de encomendas

Da pasta `server/`, execute:

```bash
npm ci
npm test
npm run typecheck
npm run build
```

Os testes de domínio e aplicação utilizam `node:test` e `tsx`, **sem PostgreSQL e sem Express**. Abrangem RF01, RF02 (consulta), RN28 (locais), RF03 (movimentação inicial), RN01–RN06, RN11–RN15 e RNF03. Os testes de API e persistência real devem ser adicionados em ambiente com PostgreSQL.

> Os testes não substituem a demonstração integrada. Antes da entrega, testar também `POST /encomendas` e `GET /encomendas/:codigo` com o banco iniciado.
