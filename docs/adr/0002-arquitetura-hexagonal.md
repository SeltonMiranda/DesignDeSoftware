# ADR-0002: Arquitetura Hexagonal (Portas e Adaptadores) para a organização interna

- **Status:** Aceita

## 1. Contexto

Definido o monólito ([ADR-0001](0001-monolito-com-banco-unico.md)), falta decidir **como organizar o código dentro dele**. O backend usa TypeScript, Express e TypeORM sobre PostgreSQL. O sistema terá vida longa e uma equipe com rotatividade; frameworks, banco e serviço de e-mail podem mudar ao longo do ciclo de vida.

## 2. Problema e forças envolvidas

| Força | Efeito sobre a decisão |
| :- | :- |
| RNF02: trocar banco ou serviço de e-mail só deve alterar a camada de infraestrutura | O núcleo não pode importar Express, TypeORM ou cliente SMTP. |
| RNF03: regras de negócio testáveis sem banco, rede ou framework | Casos de uso precisam receber suas dependências por interface. |
| Regras relevantes e interdependentes (transições RN09, históricos RN11–RN21, prioridade RN06) | Devem ficar concentradas e fáceis de achar, não espalhadas em controllers. |
| Equipe pequena e iniciante | O custo de entendimento da estrutura precisa ser baixo e a estrutura deve ser *explicável* em uma página. |
| RNF04: histórico imutável | Persistência não deve expor remoção nem edição dos registros de histórico. |

## 3. Alternativas consideradas

**A. Camadas tradicionais (Controller → Service → Repository, estilo MVC).**
- Prós: conhecida por todos; pouco código; início muito rápido.
- Contras: o service costuma depender de entidades do ORM e do framework; para testar uma regra é preciso banco ou mocks do ORM; trocar tecnologia atravessa a lógica de negócio. Contraria RNF02/RNF03.

**B. Clean Architecture / Onion completa** (entities, use cases, interface adapters e frameworks em anéis, com DTOs e presenters em cada fronteira).
- Prós: máxima separação.
- Contras: mais anéis, mais mapeamentos e mais cerimônia do que um sistema de ~10 casos de uso justifica.

**C. Arquitetura Hexagonal** (núcleo = domínio + casos de uso; portas de entrada/saída; adaptadores na borda).
- Prós: atende RNF02/RNF03 com poucas regras; a mesma ideia de dependência apontando para dentro de B, com menos anéis.
- Contras: mais interfaces e indireção que A; exige disciplina.

## 4. Decisão

Adotamos a **alternativa C**, com a regra de dependência **sempre apontando para o domínio**:

```
server/src
├── domain/                    entidades, value objects e regras; sem imports externos
├── application/
│   ├── ports/in/              o que o mundo pode pedir ao sistema (casos de uso)
│   ├── ports/out/             o que o sistema precisa do mundo (repositório, relógio, notificador…)
│   └── services/              implementam ports/in; orquestram domínio + ports/out
└── infra/
    ├── adapters/in/http/      controllers e rotas Express
    ├── adapters/out/          TypeORM (repositórios), relógio, gerador de código, notificador, logger
    ├── database/              entidades TypeORM, mappers (domínio ↔ tabela) e seed dos locais
    └── main.ts, routes.ts     montagem (raiz de composição)
```

Regras concretas:

1. `domain` não importa nada de `application` nem de `infra`; `application` só importa `domain` e suas próprias portas.
2. **Tudo que é externo ou não determinístico vira porta**: banco, relógio (RN12), geração do código de rastreamento (RN05), notificação e log.
3. As **entidades do TypeORM são distintas das entidades de domínio**; um *mapper* traduz entre elas.
4. A injeção de dependências é **manual**, em um único ponto (`routes.ts`), sem container de DI.
5. Regras de negócio são **testadas com `node:test` e fakes em memória**, sem banco (ex.: `test/application/solicitar.entrega.service.test.ts`).
6. Portas de saída são desenhadas por intenção e sem operação de remoção (`IPackageRepository` expõe `save`, `findById` e `findAll`), para que RNF04 não seja violado pela aplicação. Operações como `finalize` serão adicionadas quando as transições forem implementadas.

O caso de uso `SolicitarEntregaService` (cadastrar encomenda) é a implementação de referência desta decisão.

## 5. Consequências positivas

- O domínio e os casos de uso rodam em milissegundos nos testes, sem Docker nem banco (23 testes em < 1 s atualmente).
- Trocar PostgreSQL/TypeORM ou o canal de e-mail exige um adaptador novo e uma linha na montagem; domínio e casos de uso permanecem intactos (RNF02).
- Estrutura previsível: quem entra na equipe sabe onde cada coisa fica; revisões de código têm um critério objetivo (quem importa quem).
- Controllers finos: protocolo HTTP e regras de negócio não se misturam; um segundo canal de entrada (CLI, fila) reutilizaria os mesmos casos de uso.
- Prepara a evolução citada na [ADR-0001](0001-monolito-com-banco-unico.md): cada caso de uso já está atrás de uma porta, facilitando eventual extração.

## 6. Consequências negativas, custos e riscos

- **Mais arquivos e indireção**: o cadastro simples passou a envolver cerca de 25 arquivos (domínio, portas, serviço, adaptadores, mapeamento). Para uma pessoa acostumada a MVC, a primeira leitura é mais lenta.
- **Duplicação de modelos** (entidade de domínio × entidade TypeORM × DTO) e código de mapeamento a manter sincronizado.
- **Disciplina necessária**: nada no compilador impede um `import` indevido de `infra` dentro de `domain`. *Mitigação:* adicionar regra de lint (`no-restricted-imports` ou `dependency-cruiser`) na integração contínua e revisar PRs com o checklist da regra 1.
- **Risco de over-engineering**: criar portas para tudo, inclusive para o que nunca mudará. *Mitigação:* criar porta apenas para dependências externas, não determinísticas ou que precisem ser trocadas em testes.
- **Validação duplicada se mal distribuída**: formato HTTP (JSON válido) fica no adaptador; regras de negócio ficam só no domínio. Misturar os dois reintroduz o acoplamento que a decisão quer evitar.
- **Decorators do TypeORM** exigem `experimentalDecorators`/`emitDecoratorMetadata`; essa exigência fica confinada a `infra/database`.
