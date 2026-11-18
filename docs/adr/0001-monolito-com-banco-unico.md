# ADR-0001: Monólito com banco de dados único (PostgreSQL)

- **Status:** Aceita

## 1. Contexto

O sistema de gestão de entregas internas do campus será desenvolvido pelo laboratório C3SL da UFPR, com **2 professores e 5 alunos** (rotatividade alta). O escopo inicial é o campus Politécnico; a evolução prevista é abranger todos os campi da UFPR e, depois, outras universidades federais.

- funcionamento de segunda a sexta, das 7h às 22h;
- média de ~300 requisições/dia (~20/h) e pico de 50 a 60 requisições/h;
- cerca de 3 implantações por semana;
- disponibilidade de 99% no horário de funcionamento (RNF01), cerca de 3 h de indisponibilidade tolerada por mês (15 h × ~22 dias úteis = ~330 h/mês; 1% ≈ 3,3 h).

## 2. Problema e forças envolvidas

| Força | Efeito sobre a decisão |
| :- | :- |
| Equipe pequena e com rotatividade (ASR04) | Favorece poucas peças móveis e curva de aprendizado curta. |
| Carga muito baixa (≤ 60 req/h no pico) | Não há necessidade de escala independente por componente. |
| Consistência entre dados (RN15, RN19) | Cadastro + registro de movimentação, e transição final + registro de movimentação + registro de auditoria, devem ser gravados **na mesma transação**. |
| Disponibilidade 99% e manutenção fora do horário (RNF01, ASR03) | Exige implantação simples e possibilidade de replicar o servidor. |
| 3 implantações por semana | Pipeline e rollback precisam ser triviais. |
| Crescimento futuro (todos os campi / outras universidades) | A decisão não pode impedir uma extração futura de partes do sistema. |

## 3. Alternativas consideradas

**A. Microsserviços, cada um com seu banco** (ex.: encomendas, notificações, auditoria).
- Prós: isolamento de falhas; escala e deploy independentes.
- Contras: transações distribuídas ou consistência eventual para RN19; orquestração de rede, tracing, vários pipelines; custo operacional incompatível com 7 pessoas e ~300 req/dia.

**B. Monólito com banco único, uma instância.**
- Prós: máxima simplicidade; transações ACID locais.
- Contras: servidor único é ponto único de falha, o que dificulta cumprir os 99% de RNF01 em qualquer reinício ou falha.

**C. Monólito com banco único, servidor sem estado e replicável atrás de um balanceador.**
- Prós: simplicidade de B com redundância do servidor; implantação em sequência (uma réplica por vez) sem derrubar o serviço.
- Contras: exige que o servidor não guarde estado em memória; banco continua sendo ponto único.

**D. Monólito com um banco por módulo (encomendas, auditoria etc.).**
- Prós: fronteiras fortes entre módulos.
- Contras: perde a transação única de RN19; complexidade sem benefício para o volume atual.

## 4. Decisão

Adotamos a **alternativa C**:

1. O backend é **um único artefato implantável** (monólito) em Node/TypeScript, com API REST, empacotado em **um container**.
2. Há **um único banco PostgreSQL**, num único schema, compartilhado por todos os casos de uso. Operações que envolvem mais de uma tabela (cadastro, finalização) usam **uma transação local**.
3. O servidor é **sem estado** (sem sessão nem cache local), de modo que possa ser replicado atrás de um balanceador quando a disponibilidade exigir.
4. Manutenções e migrações de banco ocorrem fora do horário de funcionamento (RNF01).

## 5. Consequências positivas

- Atomicidade de RN15/RN19 garantida pelo próprio banco, sem sagas nem compensações.
- Um repositório, um pipeline, um container: uma pessoa nova na equipe sobe o sistema com `docker compose up`.
- Depuração simples (um processo, um log, uma base).
- Latência de consulta por código de rastreamento (RNF05) dominada por uma única consulta indexada, bem abaixo de 2 s.
- Replicar o servidor melhora a disponibilidade sem mudar o código.

## 6. Consequências negativas, custos e riscos

- **O banco é ponto único de falha.** Replicar só o servidor não cobre queda do PostgreSQL. *Mitigação:* backups regulares e, se necessário, réplica de leitura/failover.
- **Acoplamento de implantação:** um defeito em qualquer parte exige novo deploy do sistema inteiro, e um erro grave afeta todas as funcionalidades. *Mitigação:* testes unitários rápidos (ADR-0002) e implantação gradual entre réplicas.
- **Escala é vertical/horizontal do conjunto**, não por componente. Para a carga estimada isso é irrelevante, mas pode ser reavaliado se o sistema passar a atender todas as universidades federais.
- **Risco de "big ball of mud"** se os módulos (encomendas, histórico, notificação) passarem a acessar as tabelas uns dos outros. *Mitigação:* respeitar as portas e adaptadores da ADR-0002; revisar esta decisão se um módulo precisar de escala ou ciclo de vida próprios.
- **Rotatividade de dados compartilhados:** todas as migrações de schema afetam todos os módulos e precisam de coordenação.