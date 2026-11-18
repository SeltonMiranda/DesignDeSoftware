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
    │   ├── services/
    │   └── ports/
    │       ├── in/
    │       └── out/
    ├── domain/
    └── infra/
        ├── adapters/
        │   ├── in/http/
        │   └── out/
        └── database/
            └── seed/
```

## Pastas

| Pasta | Função | Pode depender de |
|-------|--------|------------------|
| `src/domain/` | Entidades e regras de negócio. Sem framework. | nada |
| `src/application/services/` | Casos de uso: orquestram o domínio e usam as portas. | `domain`, `ports` |
| `src/application/ports/in/` | Interfaces de **entrada**: o que o mundo externo pode pedir ao sistema. | `domain` |
| `src/application/ports/out/` | Interfaces de **saída**: o que o núcleo precisa do mundo externo. | `domain` |
| `src/infra/adapters/in/http/` | Adaptadores de entrada HTTP: controllers Express e rotas (`routes.ts`, raiz de composição). Os controllers dependem apenas das interfaces de `ports/in`. | `ports/in`, `domain` |
| `src/infra/adapters/out/` | Adaptadores de saída: `TypeOrmPackageRepository`, `TypeOrmLocalRepository`, `ConsoleNotificador`, `UuidCodigoGerador`, `RelogioSistema`, `ConsoleLogger`. | `ports/out`, `domain`, `database` |
| `src/infra/database/` | Entidades TypeORM (`PackageSchema`, `LocalSchema`), mappers domínio ↔ tabela e `seed/locais.seed.ts`, que insere os locais iniciais por código. | `domain`, TypeORM |
| `src/infra/data.source.ts`, `main.ts` | Conexão com o banco, semeadura dos locais e inicialização do Express. | tudo |

## Locais

`Local` (campus, prédio, sala) é uma entidade de domínio com tabela própria (`locais`). Os dados são inseridos na subida do servidor por `semearLocais` (idempotente) e listados em `GET /locais`. O cadastro de encomenda recebe `localRemetenteId` e `localDestinatarioId`; o caso de uso busca cada local pela porta `ILocalRepository` e rejeita ids inexistentes (HTTP 400). A tabela `encomendas` referencia `locais` por chave estrangeira.

## Diagramas

Em [`diagramas/`](diagramas/): classes, pacotes, sequência (cadastro e consulta) e comunicação (cadastro), alinhados ao código atual.

# Proposta Arquitetural

## Organização arquitetural

A solução combina quatro estilos. Cada um aparece em pontos concretos do código:

| Estilo | Como aparece na solução |
|:-|:-|
| **Cliente-servidor** | O servidor (`server/`) expõe uma API REST em JSON, sem estado e sem sessão. O cliente (React, previsto em `client/`) e ferramentas como Bruno ou `curl` falam com ele apenas por HTTP. Nenhuma regra de negócio fica no cliente. |
| **Monólito** | Um único artefato implantável (uma imagem Docker, `server/Dockerfile`) e um único banco PostgreSQL (ADR-0001). Os casos de uso chamam uns aos outros e ao banco dentro do mesmo processo, sem rede entre módulos. Por ser sem estado, pode ser replicado atrás de um balanceador. |
| **Arquitetura hexagonal (portas e adaptadores), organizada em três camadas** | `domain` (regras), `application` (casos de uso e portas) e `infra` (adaptadores e montagem). A dependência aponta sempre para o domínio: `infra → application → domain`. A direção é imposta por convenção e revisão de código, não pelo compilador (ver ADR-0002). |
| **Controller fino na apresentação (não é MVC completo)** | A camada de apresentação é o adaptador HTTP: `PackageController` e `LocalController` recebem a requisição, chamam uma porta de entrada e traduzem o resultado ou o erro em status HTTP. Não há *view* no servidor, pois a representação é o JSON e a interface é do cliente React. O *model* é o domínio, que não conhece HTTP. |

A arquitetura é um **monólito organizado internamente por portas e adaptadores**, não um "monólito modular" no sentido de módulos de negócio isolados. Hoje há um único contexto (encomendas), com `Local` como cadastro de apoio. A separação por módulos será avaliada quando surgirem auditoria e listagens (ADR-0001, seção 6).

## Principais componentes e responsabilidades

| Componente | Localização | Responsabilidade |
|:-|:-|:-|
| Entidades e regras de domínio | `domain/` | `Package`, `Volume`, `Local` e erros de domínio. Validam dados e protegem as invariantes (RN01–RN04, RN06, RN15). |
| Portas de entrada | `application/ports/in/` | Contratos do que o sistema oferece: `SolicitarEntregaUseCase`, `ConsultarEncomendaUseCase`, `ListarLocaisUseCase`. |
| Casos de uso | `application/services/` | Orquestram uma operação: buscam locais, criam a encomenda, gravam e disparam a notificação. Não conhecem HTTP nem banco. |
| Portas de saída | `application/ports/out/` | Contratos do que o núcleo precisa do mundo externo: repositórios, notificador, gerador de código, relógio e logger. |
| Adaptadores de entrada | `infra/adapters/in/http/` | Controllers Express e rotas. Traduzem HTTP em chamadas às portas de entrada e erros de domínio em status HTTP. |
| Adaptadores de saída | `infra/adapters/out/` | `TypeOrmPackageRepository`, `TypeOrmLocalRepository`, `ConsoleNotificador`, `UuidCodigoGerador`, `RelogioSistema`, `ConsoleLogger`. |
| Persistência | `infra/database/` | Entidades TypeORM (`PackageSchema`, `LocalSchema`), mappers domínio ↔ tabela e seed dos locais. |
| Montagem | `infra/adapters/in/http/routes/routes.ts`, `infra/main.ts`, `infra/data.source.ts` | Raiz de composição: instancia adaptadores, injeta nos casos de uso e nos controllers, abre a conexão e semeia os locais. |

## Dependências entre componentes

```
Cliente ──HTTP/JSON──▶ adapters/in/http ──▶ ports/in ◀── services ──▶ ports/out ◀── adapters/out ──▶ PostgreSQL / console
                                                            │                           │
                                                            └────────▶ domain ◀─────────┘ (via database/mappers)
```

- `domain` não depende de nada.
- `application` depende de `domain` e das suas próprias portas.
- `infra` depende de `application` e `domain`. Só `routes.ts` conhece, ao mesmo tempo, serviços e adaptadores concretos.
- Os controllers dependem das **interfaces** de `ports/in`, não das classes de `services`.

O diagrama de pacotes está em [`diagramas/pacotes.puml`](diagramas/pacotes.puml) e o de classes em [`diagramas/classes.puml`](diagramas/classes.puml).

## Interfaces relevantes

| Interface | Tipo | Operações | Implementação atual |
|:-|:-|:-|:-|
| `SolicitarEntregaUseCase` | entrada | `execute(comando): ResultadoCadastro` | `SolicitarEntregaService` |
| `ConsultarEncomendaUseCase` | entrada | `execute(codigo): Package \| null` | `ConsultarEncomendaService` |
| `ListarLocaisUseCase` | entrada | `execute(): Local[]` | `ListarLocaisService` |
| `IPackageRepository` | saída | `save`, `findById`, `findAll` | `TypeOrmPackageRepository` |
| `ILocalRepository` | saída | `findById`, `findAll` | `TypeOrmLocalRepository` |
| `INotificador` | saída | `notificar(notificacao)` | `ConsoleNotificador` (imprime no terminal) |
| `ICodigoGerador` | saída | `gerar()` | `UuidCodigoGerador` (formato `POL-XXXXXXXXXXXX`) |
| `IRelogio` | saída | `agora()` | `RelogioSistema` |
| `ILogger` | saída | `erro(mensagem, causa)` | `ConsoleLogger` |

## Mecanismos de comunicação

- **Cliente ↔ servidor:** HTTP síncrono, REST, corpo em JSON (Express 5). Sucesso é indicado por 2xx e erro por `{ "erro": "mensagem" }` com 400, 404 ou 500.
- **Entre componentes do servidor:** chamadas de método no mesmo processo, sempre via interface.
- **Notificação:** disparada **depois** de gravar e **sem `await`** (`queueMicrotask` em `SolicitarEntregaService`). A resposta HTTP não espera o envio, e a falha é apenas registrada em `ILogger` (RN27, ADR-0003). Não há fila nem *retry*.
- **Servidor ↔ banco:** conexão TCP do TypeORM com o PostgreSQL, configurada por `DATABASE_URL`.

## Persistência

PostgreSQL acessado por TypeORM. As entidades de persistência são distintas das de domínio, e os mappers fazem a conversão.

| Tabela | Colunas principais |
|:-|:-|
| `locais` | `id` (PK, inteiro), `campus`, `predio`, `sala`; restrição única em (`campus`, `predio`, `sala`). Populada por `semearLocais` ao iniciar o servidor (idempotente, `ON CONFLICT DO NOTHING`). |
| `encomendas` | `id` (código de rastreio, PK), `nomeRemetente`, `localRemetenteId` (FK → `locais`), `nomeDestinatario`, `localDestinatarioId` (FK → `locais`), `emailDestinatario`, `descricao`, `conteudo`, `pesoKg`, `prioridade`, `situacao`, `createdAt`, `updatedAt` e `movimentacoes` (JSONB). |

- O histórico de movimentação é gravado como JSONB na mesma linha da encomenda. Isso garante atomicidade no cadastro, mas uma tabela própria será mais adequada quando houver mudanças de situação e auditoria (RF04, RF07, RNF04).
- O esquema é criado por `synchronize` (`DB_SYNCHRONIZE=true`), adequado ao protótipo. Em produção, usar migrações.

## Integrações externas

| Integração | Estado | Observação |
|:-|:-|:-|
| PostgreSQL | Real | Container `postgres:18-alpine` no `docker-compose.yml`, com *healthcheck*. O servidor só inicia depois dele. |
| Notificação por e-mail | **Simulada** | `ConsoleNotificador` imprime `[NOTIFICAÇÃO SIMULADA]` no terminal. O envio real será um novo adaptador de `INotificador` (ver a seção final). |

## Decisões de comunicação

| Decisão | Motivo |
|:-|:-|
| API REST síncrona em JSON | Operações simples e de baixo volume (~300 req/dia, pico de 60 req/h); fácil de testar com Bruno ou `curl`. |
| Servidor sem estado | Permite replicar o servidor atrás de um balanceador (RNF01) sem sessão compartilhada. |
| Notificação assíncrona no mesmo processo | Falha ou lentidão do provedor não afeta o cadastro (RN27); evita fila e *worker* para o volume atual. |
| Sem autenticação | Decisão do grupo: usuário único e sem perfis. |
| Erros de domínio traduzidos só no controller | O domínio lança `DadosInvalidosError` (inclui `LocalNaoEncontradoError`) e o controller converte em HTTP 400, mantendo o domínio livre de HTTP. |
| Sem mensageria nem chamadas entre serviços | Um único processo, sem custo de rede ou consistência eventual. |

## Documentação da API

Base: `http://localhost:${SERVER_PORT}` (padrão 3000). Corpo e respostas em `application/json`.

### `GET /`
Verificação de funcionamento. Resposta `200`: `{ "message": "Sistema de entregas internas — UFPR" }`.

### `GET /locais`
Lista os locais cadastrados, em ordem de `id`, para o cliente escolher origem e destino.

Resposta `200`:
```json
[ { "id": 1, "campus": "Politécnico", "predio": "Departamento de Informática", "sala": "Secretaria" } ]
```

### `POST /encomendas` (RF01)
Cadastra uma encomenda. O código de rastreio e a data são gerados pelo servidor, e a situação inicial é `AGUARDANDO_COLETA`.

| Campo | Tipo | Regra |
|:-|:-|:-|
| `nomeRemetente`, `nomeDestinatario` | texto | obrigatórios |
| `localRemetenteId`, `localDestinatarioId` | inteiro | ids existentes em `GET /locais`; devem ser diferentes (RN04, RN28) |
| `emailDestinatario` | texto | obrigatório, formato de e-mail |
| `pesoKg` | número | maior que 0 e até 30 (RN02) |
| `conteudo` | `documento` \| `volume` | RN03 |
| `prioridade` | `baixa` \| `media` \| `alta` | RN06 |
| `descricao` | texto | opcional; se omitida, usa o valor de `conteudo` |

Exemplo:
```json
{
  "nomeRemetente": "Ana Silva", "localRemetenteId": 1,
  "nomeDestinatario": "João Souza", "localDestinatarioId": 5,
  "emailDestinatario": "joao@ufpr.br", "pesoKg": 2.5,
  "conteudo": "documento", "prioridade": "alta",
  "descricao": "Documentos de matrícula"
}
```

| Status | Quando | Corpo |
|:-:|:-|:-|
| `201` | cadastro realizado | `{ "codigoRastreio": "POL-…", "situacao": "AGUARDANDO_COLETA", "criadoEm": "2026-11-17T…Z" }` |
| `400` | dado inválido, id de local inválido ou inexistente, origem igual ao destino | `{ "erro": "mensagem" }` |
| `500` | falha inesperada (ex.: banco indisponível) | `{ "erro": "Não foi possível cadastrar a encomenda." }` |

### `GET /encomendas/:codigo` (RF02, RF03)
Consulta por código de rastreio.

| Status | Quando | Corpo |
|:-:|:-|:-|
| `200` | encontrada | `codigoRastreio`, `nomeRemetente`, `localRemetente`, `nomeDestinatario`, `localDestinatario`, `emailDestinatario`, `descricao`, `conteudo`, `pesoKg`, `prioridade`, `situacao`, `criadoEm`, `atualizadoEm` e `historicoMovimentacao` (do mais recente para o mais antigo). Os locais vêm como `{ id, campus, predio, sala }`. |
| `404` | código inexistente | `{ "erro": "Encomenda não encontrada." }` |
| `500` | falha inesperada | `{ "erro": "Não foi possível consultar a encomenda." }` |

Exemplos prontos para `curl` estão em [`EXEMPLO-API-CADASTRO.md`](EXEMPLO-API-CADASTRO.md). Atualização de situação, edição, cancelamento, listagem com filtros e auditoria (RF04–RF09) ainda não estão implementadas.

# Modelo de domínio e responsabilidades

## Principais conceitos do domínio

| Conceito | Tipo no código | Papel |
|:-|:-|:-|
| **Encomenda** (`Package`) | classe, raiz do agregado | Item a ser transportado, com remetente, destinatário, prioridade e situação. |
| **Volume** | classe, parte da encomenda | Descrição, tipo de conteúdo e peso do que é transportado. |
| **Local** | classe, cadastro referenciado pela encomenda | Ponto do campus (campus, prédio, sala), usado como origem e destino. |
| **Movimentação** | tipo de valor (`Movimentacao`), dentro da encomenda | Registro de uma situação assumida e do instante em que ocorreu; o motivo de cancelamento só existe na situação `CANCELADA`. |
| **Situação, Prioridade, Conteúdo** | tipos enumerados | Valores permitidos para cada atributo. |
| **Erros de domínio** | `DadosInvalidosError`, `LocalNaoEncontradoError` | Violações de regra, independentes de HTTP e de banco. |

`Package` tem o nome em inglês no código por herança da primeira versão; o termo do domínio é "encomenda". Mantive o nome do código para não alterar a API interna.

## Responsabilidades por classe

| Classe | Responsabilidades | Não é responsabilidade dela |
|:-|:-|:-|
| `Package` | Validar os dados do cadastro (nomes, e-mail, prioridade, origem ≠ destino); criar o `Volume` e a movimentação inicial `AGUARDANDO_COLETA`; expor o histórico do mais recente para o mais antigo, sem permitir alterá-lo por fora (RN14, RN15); reconstruir-se a partir da persistência sem gerar novo evento. | Gerar código ou data, buscar locais, gravar, notificar. |
| `Volume` | Validar tipo de conteúdo e peso (0 < peso ≤ 30 kg); definir a descrição padrão. | Saber qualquer coisa da encomenda. |
| `Local` | Garantir id positivo e campus, prédio e sala preenchidos. | Saber onde os locais estão armazenados. |
| `SolicitarEntregaService` | Orquestrar o cadastro: obter os dois locais, obter código e instante pelas portas, chamar `Package.cadastrar`, gravar e disparar a notificação após a gravação sem propagar falhas. | Regras de validação da encomenda; HTTP; SQL. |
| `ConsultarEncomendaService` | Normalizar o código e buscar a encomenda. | Montar a resposta JSON. |
| `ListarLocaisService` | Listar os locais. | — |
| `PackageController`, `LocalController` | Traduzir HTTP em chamada ao caso de uso e o resultado ou erro em status e JSON. | Regras de negócio. |
| `TypeOrm*Repository`, mappers, schemas | Persistir e reconstruir entidades de domínio. | Decidir regras. |
| Adaptadores simples (`UuidCodigoGerador`, `RelogioSistema`, `ConsoleNotificador`, `ConsoleLogger`) | Isolar o que é externo ou não determinístico. | — |

## Justificativas GRASP

| Padrão | Onde e por quê |
|:-|:-|
| **Information Expert** | `Package` e `Volume` possuem os dados que validam, então são eles que validam. O peso é checado em `Volume`; a regra "origem ≠ destino" fica em `Package`, que conhece os dois locais. |
| **Creator** | `Package.cadastrar` cria o `Volume` e a primeira `Movimentacao`, pois os contém e têm os dados para inicializá-los. |
| **Controller (GRASP)** | O controlador de caso de uso é o serviço (`SolicitarEntregaService`), que coordena a operação sem implementar regras. O controller HTTP é só um adaptador de entrada. |
| **Low Coupling** | O domínio não importa nada. Os serviços dependem de interfaces, e quem conhece o ORM é só a `infra`. |
| **High Cohesion** | Cada classe tem uma razão para mudar: regra do volume, regra da encomenda, orquestração, tradução HTTP, persistência. |
| **Polymorphism** | Cada porta de saída admite implementações intercambiáveis: repositório TypeORM ou em memória (testes), notificador de console ou e-mail. |
| **Pure Fabrication** | Serviços de caso de uso, repositórios e mappers não são conceitos do domínio. Foram criados para manter o domínio coeso e sem infraestrutura. |
| **Indirection** | As portas (`ports/in` e `ports/out`) ficam entre controller e serviço, e entre serviço e infraestrutura. |
| **Protected Variations** | A instabilidade de banco, canal de notificação, relógio e geração de código fica atrás de portas. |

## Análise de coesão e acoplamento

| Elemento | Coesão | Acoplamento | Observação |
|:-|:-|:-|:-|
| `domain/` | Alta | Muito baixo: só `Package → Volume, Local, erros` | Testável sem banco nem framework (RNF03). |
| `SolicitarEntregaService` | Alta (um caso de uso) | **Moderado**: 6 dependências, todas por interface | O número de dependências é o ponto mais alto de acoplamento do núcleo. Como todas são abstratas, trocar qualquer uma não afeta o serviço. |
| `ConsultarEncomendaService`, `ListarLocaisService` | Alta | Baixo (1 dependência) | — |
| Controllers | Alta | Baixo: dependem de uma porta e do tipo de erro | O mapeamento de `Package` para JSON está no controller. |
| Repositórios, mappers e schemas | Alta | Alto com o TypeORM, por escolha | O acoplamento fica confinado a `infra/database` e `adapters/out`. |
| `routes.ts` | Baixa, de propósito | Alto, de propósito | Raiz de composição: é o único lugar que conhece todos os adaptadores concretos. |

Pontos fracos reconhecidos:
- `Package.cadastrar` concentra todas as validações do cadastro. Quando entrarem as transições de situação (RF04), cancelamento e edição, a classe crescerá e poderá ser dividida (por exemplo, extraindo regras de transição).
- A lógica de disparo assíncrono da notificação está no serviço. Se mais casos de uso precisarem notificar (RF10 exige notificar a cada mudança), convém extraí-la para um colaborador reutilizável.
- `IPackageRepository.findAll` ainda não é usado por nenhum caso de uso e existe para a futura listagem (RF05).

## Princípios SOLID

| Princípio | Aplicação |
|:-|:-|
| **S** (responsabilidade única) | Um serviço por caso de uso; validação no domínio, tradução HTTP no controller e persistência no repositório; mappers separados das entidades. |
| **O** (aberto/fechado) | Trocar o `ConsoleNotificador` por um notificador de e-mail ou o TypeORM por outro ORM é criar um adaptador novo e alterar a montagem; serviços e domínio não são modificados. |
| **L** (substituição de Liskov) | Qualquer implementação de `IPackageRepository`, `INotificador` etc. pode ser usada no lugar de outra. Os testes usam repositório e notificador em memória no lugar dos reais, sem alterar o serviço. |
| **I** (segregação de interfaces) | Portas pequenas e específicas: `ILogger` e `IRelogio` têm uma operação cada; `ILocalRepository` é separado de `IPackageRepository`; cada caso de uso tem a sua porta de entrada, então o controller só vê o que usa. |
| **D** (inversão de dependência) | Serviços dependem de abstrações definidas na própria `application`; os adaptadores é que dependem delas. A injeção é manual, em `routes.ts`. |

# Substituição de tecnologias e integrações

> **Se uma das principais tecnologias ou integrações utilizadas precisasse ser substituída, quais partes do sistema seriam afetadas?**

Em geral, apenas a camada `infra` e o ponto de montagem (`routes.ts`). O domínio (`Package`, `Volume`, `Local`, erros) e os casos de uso (`application/services`) dependem somente de interfaces (`ports/out`) e não importam Express, TypeORM nem qualquer cliente de e-mail. As exceções são o que muda **junto com a tecnologia**: o adaptador novo, a configuração e, no caso do banco, o esquema e a migração dos dados.

## Mudança 1: TypeORM → outro ORM (ex.: Prisma ou Drizzle)

**Elementos afetados**
- `infra/adapters/out/typeorm.package.repository.ts` e `typeorm.local.repository.ts`: seriam reescritos (por exemplo, `PrismaPackageRepository`) implementando as mesmas interfaces.
- `infra/database/`: entidades `PackageSchema` e `LocalSchema` (decorators TypeORM), mappers e a semeadura `locais.seed.ts`, que usa o query builder do TypeORM.
- `infra/data.source.ts` e as chamadas de `AppDataSource` em `main.ts` e `routes.ts`.
- `package.json` (dependências) e `tsconfig.json` (`experimentalDecorators`/`emitDecoratorMetadata` deixam de ser necessários).
- `routes.ts`: trocar `new TypeOrmPackageRepository(...)` pelo novo adaptador.

**Permanecem inalterados**
- `domain/` inteiro e `application/` inteiro (serviços e portas, inclusive `IPackageRepository` e `ILocalRepository`).
- Controllers HTTP e rotas (exceto a linha de montagem).
- Os testes de domínio e de aplicação, que usam repositórios em memória.
- O banco PostgreSQL e as tabelas, se o novo ORM mapear o mesmo esquema.

**Decisões arquiteturais que ajudam**
- Portas de saída (`IPackageRepository`, `ILocalRepository`) definidas pelo núcleo, sem tipos do ORM.
- Entidades de persistência separadas das entidades de domínio, com mappers: o ORM não vaza para o domínio.
- Injeção de dependências manual em um único ponto (`routes.ts`).

**Decisões que dificultam**
- O esquema é gerado por `synchronize` a partir dos decorators do TypeORM, então um novo ORM precisa reproduzir o esquema ou introduzir migrações.
- Os mappers e o seed acompanham o ORM e precisam ser reescritos.
- O histórico de movimentação está em uma coluna JSONB com formato definido pelo mapper; o novo adaptador deve manter esse formato (ou migrar os dados).
- O repositório devolve a entidade com os locais carregados (`eager`); outro ORM deve garantir o mesmo comportamento ao reconstruir `Package`.

## Mudança 2: ConsoleNotificador → envio real de e-mail (ou WhatsApp)

Hoje `ConsoleNotificador` apenas imprime a notificação no terminal. Trocar por e-mail (SMTP) ou WhatsApp é a substituição de uma integração externa.

**Elementos afetados**
- Um novo adaptador em `infra/adapters/out/` (por exemplo, `EmailNotificador` ou `WhatsAppNotificador`) implementando `INotificador`.
- `routes.ts`: uma linha, `new ConsoleNotificador()` → novo adaptador.
- Configuração e dependências (credenciais SMTP/API em `.env`, biblioteca de envio).
- Para WhatsApp: o destino da notificação passaria a ser um telefone, não um e-mail. Isso exige um campo novo no cadastro (domínio, entidade de persistência e controller) e ajustar o conteúdo de `Notificacao.destino`. É a parte que deixa de ser "só infraestrutura".

**Permanecem inalterados (no caso do e-mail)**
- `domain/` e `application/`, incluindo `SolicitarEntregaService` e a porta `INotificador`.
- Banco, repositórios, controllers e rotas.
- A regra de que a notificação é disparada **após a gravação**, sem `await`, e de que a falha é só registrada em `ILogger` (RN27): ela está no serviço, não no adaptador, e vale para qualquer canal.
- Os testes existentes, que usam notificadores falsos.

**Decisões arquiteturais que ajudam**
- `INotificador` é uma porta de saída com contrato mínimo (`notificar(notificacao)`), sem detalhe de e-mail.
- Disparo assíncrono e tolerante a falhas no serviço (ADR-0003): um provedor lento ou fora do ar não afeta o cadastro.
- Logger também é uma porta, então erros do novo adaptador são registrados sem acoplamento.

**Decisões que dificultam**
- `Notificacao.destino` é uma string livre e o cadastro guarda apenas `emailDestinatario`: o modelo assume o e-mail como canal. Trocar de canal exige alterar o modelo de dados.
- Não há *retry* nem fila (alternativa B da ADR-0003): provedores com limite de taxa ou entrega garantida, como a API do WhatsApp, pediriam o padrão *outbox*.
- O texto da mensagem não está na porta (só `situacao` e `codigoRastreio`); cada adaptador monta o seu, o que pode duplicar texto entre canais.
