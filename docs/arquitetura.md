# Requisitos arquiteturalmente significativos (ASR's)

| ID | Fonte | Justificativa |
| :-: | :- | :- |
| ASR01 | [RNF02](requisitos.md#requisitos-não-funcionais) | Este requisito impõe uma restrição sobre o fluxo de dependências. Ele proíbe que o código das regras de negócio e entidades do domínio conheçam detalhes de infraestrutura.
| ASR02 | [RNF03](requisitos.md#requisitos-não-funcionais) | Este requisito determina que a lógica do sistema não pode depender de ferramentas externas para ser validada. Ele retira qualquer forma de testar uma regra de negócio que exija subir um servidor, conectar a um banco de dados real ou inicializar frameworks complexos.
| ASR03 | [RNF01](requisitos.md#requisitos-não-funcionais) | Este requisito exige que o sistema seja robusto o suficiente para não sair do ar por qualquer motivo e permita atualizações rápidas e pontuais fora do horário de pico.
| ASR04 | Contexto | A equipe é pequena, sendo constituída de 2 professores e 5 alunos.

Os dois primeiros ASRs justificam a organização interna como uma arquitetura hexagonal, já o terceiro ASR justifica um monólito caso haja replicação de servidores junto com um balanceador de carga. O último ASR justifica a não utização de microsserviços. Implantação local simples, transações num banco só, validação de transições perto do
domínio, testes unitários sem banco, integração de notificação substituível, redução de complexidade para uma equipe pequena.

# Arquitetura

O sistema segue Cliente-Servidor, com comunicação via API REST e monólito tradicional organizado em arquitetura hexagonal (arquitetura limpa). 

```
server
└── src/
    ├── application/
    │   ├──services/
    │   └── ports/
    │       ├── in/
    │       └── out/
    ├── domain/
    └── infra/
        └── adapters/
            ├── in/
            └── out/
```

## Pastas

| Pasta | Função | Pode depender de |
|-------|--------|------------------|
| `src/domain/` | Entidades e regras de negócio. Sem framework. | nada |
| `src/application/services/` | Casos de uso: orquestram o domínio e usam as portas. | `domain`, `ports` |
| `src/application/ports/in/` | Interfaces de **entrada**: o que o mundo externo pode pedir ao sistema. | `domain` |
| `src/application/ports/out/` | Interfaces de **saída**: o que o núcleo precisa do mundo externo. | `domain` |
| `src/infra/adapters/in/web/` | Adaptadores de entrada HTTP: controllers Express que traduzem requisições em chamadas aos casos de uso. | `ports/in` |
| `src/infra/adapters/out/db/` | Adaptadores de saída para o PostgreSQL: entidades TypeORM e implementações dos repositórios. | `ports/out`, `domain`, TypeORM |
| `src/infra/` | Configuração e montagem: conexão com o banco . | tudo |
| `src/infra/main.ts` | Ponto de entrada: inicia o banco e o servidor Express. | `adapters` |
