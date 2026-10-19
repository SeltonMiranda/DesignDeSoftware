# Requisitos

Este documento apresenta a descrição detalhada dos requisitos funcionais e não funcionais do **sistema de gestão de entregas internas do campus**. As regras de negócio que complementam estes requisitos estão em [`regras-de-negocio.md`](regras-de-negocio.md).

## Contexto e suposições

O sistema será desenvolvido pelo departamento de informática da UFPR. O escopo inicial é o campus Politécnico. A evolução prevista é: todos os campi da UFPR e, no futuro, as demais universidades federais. Por isso o sistema precisa ser de fácil implementação, manutenção e testabilidade, e precisa ser disponível durante o horário de funcionamento dos campi.

- Horário de funcionamento: segunda a sexta, 7h às 22h.
- Volume: cerca de 500 solicitações por dia por campus.

## Usuário do sistema

O sistema tem **um único usuário geral**: qualquer pessoa que acesse a aplicação pode executar qualquer operação. Isso tem três consequências:

- **Não existe entidade de usuário no domínio**, nem login, nem papéis, nem verificação de permissão.
- **Nenhuma operação registra quem a executou.** Os nomes de pessoas que o sistema guarda (remetente, destinatário, responsável pela entrega, quem recebeu) são dados informados como texto na própria operação.
- A **notificação por e-mail** usa o endereço informado no cadastro da encomenda, e não uma conta de usuário.

## Requisitos funcionais

Escopo: **Essencial** = necessário para o sistema funcionar. **Desejável** = pode ficar para uma segunda entrega.

| ID | Descrição |
| :-: | :- |
| RF01 | O sistema deve permitir o cadastro de uma solicitação de encomenda com: nome do remetente, local do remetente (campus, prédio e sala), nome do destinatário, local do destinatário (campus, prédio e sala), peso (em kg), conteúdo (documento ou volume), prioridade (baixa, média, alta ou urgente) e, opcionalmente, um e-mail para notificação (RF12). Ao cadastrar, o sistema deve gerar o código de rastreamento e definir a situação inicial como "Aguardando coleta". | 
| RF02 | O sistema deve permitir consultar uma encomenda pelo código de rastreamento, mostrando: situação atual ("Aguardando coleta", "Em trânsito", "Entregue" ou "Cancelada"), data e hora da última atualização, prioridade, origem, destino, responsável pela entrega (quando já informado), nome de quem recebeu (quando entregue) e o histórico de movimentação. | 
| RF03 | O sistema deve manter, para cada encomenda, o **histórico de movimentação**: uma sequência de eventos que acompanha a encomenda desde o cadastro. Cada evento tem os campos: código da encomenda, sequência, tipo, data e hora, situação anterior, situação resultante e descrição (os campos e seus valores estão detalhados na seção 4 das regras de negócio). Os eventos são mostrados do mais recente para o mais antigo e não podem ser editados nem apagados. | 
| RF04 | O sistema deve permitir a atualização da situação de uma encomenda, apenas pelas transições permitidas: "Aguardando coleta" → "Em trânsito" (informando o responsável pela entrega) e "Em trânsito" → "Entregue" (informando o nome de quem recebeu). Transições inválidas devem ser rejeitadas com mensagem de erro. | 
| RF05 | O sistema deve permitir listar as encomendas, mostrando código, situação, prioridade e data de criação, com filtros combináveis por prioridade, situação e intervalo de datas (início e fim, sobre a data de criação). A listagem deve ser paginada. |
| RF06 | O sistema deve mostrar a **fila de coleta**: encomendas em "Aguardando coleta", ordenadas por prioridade (urgente primeiro) e, em caso de empate, da mais antiga para a mais recente. A fila pode ser filtrada pelo campus de origem. |
| RF07 | O sistema deve manter o **histórico de auditoria**: um registro para cada encomenda finalizada ("Entregue" ou "Cancelada"), criado **somente** no momento da finalização. Cada registro tem os campos: código da encomenda, situação final, data de criação, data e hora da finalização, responsável pela entrega, nome de quem recebeu, motivo do cancelamento e uma cópia dos dados principais da encomenda (remetente, destinatário, origem, destino e prioridade); os campos e suas condições estão detalhados na seção 5 das regras de negócio. O histórico pode ser consultado em uma listagem paginada e não pode ser editado nem apagado. |
| RF08 | O sistema deve permitir cancelar uma encomenda que ainda esteja em "Aguardando coleta", com motivo obrigatório. A situação passa a "Cancelada". | Essencial |
| RF09 | O sistema deve permitir editar uma encomenda enquanto ela estiver em "Aguardando coleta" (destinatário, local de destino, peso, conteúdo e prioridade). Cada edição deve gerar um evento no histórico de movimentação. |
| RF10 | O sistema deve permitir registrar uma ocorrência (por exemplo, destinatário ausente) em encomendas "Aguardando coleta" ou "Em trânsito", sem alterar a situação. A ocorrência fica registrada no histórico de movimentação. | 
| RF11 | O sistema deve manter o cadastro de campi, prédios e salas, que alimenta os locais de origem e destino. Novos campi e locais devem ser incluídos por carga de dados/configuração. Inicialmente, apenas o campus Politécnico. |
| RF12 | O sistema deve notificar por e-mail, a cada mudança de situação, o endereço informado no cadastro. Se nenhum e-mail foi informado, não há notificação. Uma falha no envio não impede nem desfaz a atualização. |

## Requisitos não funcionais

| ID | Descrição | Como verificar |
| :-: | :- | :- |
| RNF01 | **Disponibilidade.** O sistema deve estar disponível 99% do tempo durante o horário de funcionamento dos campi **[suposição: seg–sex, 7h–22h]**, o que equivale a cerca de 3 h de indisponibilidade tolerada por mês. Fora desse horário, a meta é de 95%. Manutenções e migrações devem ocorrer fora do horário de funcionamento. | Monitoramento externo de disponibilidade (verificação periódica) e relatório mensal |
| RNF02 | **Modificabilidade.** Trocar ou adicionar uma tecnologia externa (banco de dados, serviço de e-mail) deve exigir alterações **apenas** na camada de infraestrutura (adaptadores). Regras de negócio e casos de uso não podem depender de frameworks nem de serviços externos. | Teste automatizado de arquitetura que falha se o domínio importar framework ou infraestrutura |
| RNF03 | **Consistência.** Se duas atualizações concorrentes chegarem para a mesma encomenda, exatamente uma deve ser aplicada e a outra deve receber erro de conflito. O reenvio da mesma requisição não pode gerar evento nem registro duplicado. A mudança de situação, o evento de movimentação e, na finalização, o registro de auditoria devem ser gravados na mesma transação. | Teste de concorrência (duas atualizações simultâneas) e teste de reenvio |
| RNF04 | **Testabilidade.** As regras de negócio (transições, validações, prioridade, geração dos históricos) devem poder ser testadas por teste unitário, sem banco, rede nem framework. Cobertura mínima de 80% no domínio **[suposição]**. | Relatório de cobertura na integração contínua |
| RNF05 | **Expansão para outros campi.** Incluir um novo campus deve ser feito por configuração/dados, sem alterar código. | Teste de aceitação adicionando um segundo campus apenas por carga de dados |
| RNF06 | **Integridade dos históricos.** Os eventos de movimentação e os registros de auditoria não podem ser alterados nem apagados pelas funções da aplicação. Correções são feitas com um novo evento. | A interface do repositório dos históricos não tem operações de alterar nem apagar; teste que confirma isso |
| RNF07 | **Desempenho.** A consulta por código de rastreamento deve responder em até 2s em 95% porcento das requisições | Teste de carga simples |

## Requisitos arquiteturalmente significativos

Dos requisitos acima, três determinam a estrutura do sistema:

| Requisito | Decisão que ele provoca |
| :- | :- |
| RNF02 + RNF04 + RNF05 (modificabilidade, testabilidade, expansão) | Arquitetura hexagonal (portas e adaptadores): domínio isolado, com persistência e notificação atrás de interfaces |
| RNF03 (consistência) | Banco relacional único e transacional, máquina de estados no domínio, controle de concorrência otimista, e evento de movimentação (e registro de auditoria, na finalização) na mesma transação da mudança de situação |
| RNF01 (disponibilidade) | Monolito modular,  verificação de saúde, reinício automático, backups e manutenção fora do horário; evolução para duas instâncias se a meta subir |