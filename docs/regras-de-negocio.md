# Regras de negócio

Regras do **sistema de gestão de entregas internas do campus**. Cada regra indica o requisito a que se refere (ver [`requisitos.md`](requisitos.md)). Valores marcados com **[parametrizável]** são configuráveis e não ficam fixos no código.

**Usuário único.** O sistema não tem tipos de usuário: qualquer pessoa pode executar qualquer operação em qualquer encomenda. Não há entidade de usuário no domínio, nem verificação de permissão, e nenhuma operação guarda quem a executou. Nomes de pessoas (responsável pela entrega, quem recebeu) são dados informados como texto na operação.

**Dois históricos.** O sistema mantém dois históricos com finalidades diferentes: o **histórico de movimentação** (seção 4), que acompanha cada encomenda evento a evento, e o **histórico de auditoria** (seção 5), que guarda um único registro de fechamento por encomenda, só quando ela é entregue ou cancelada.

## 1. Solicitação e dados da encomenda

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN01 | Todos os campos do cadastro são obrigatórios: nome e local do remetente, nome e local do destinatário, peso, conteúdo e prioridade. O e-mail para notificação é opcional. | RF01 |
| RN02 | O peso deve ser maior que zero e não pode passar do limite máximo (30 kg). | RF01 |
| RN03 | O conteúdo só pode ser "documento" ou "volume". | RF01 |
| RN04 | O local de origem deve ser diferente do local de destino. | RF01 |
| RN05 | O código de rastreamento é gerado pelo sistema, nunca informado pelo usuário. | RF01 |
| RN06 | O código de rastreamento é único e não muda depois de gerado. | RF01 |
| RN07 | O código tem o formato sigla do campus de origem + 8 caracteres alfanuméricos aleatórios (ex.: `POL-7K3QX9AB`). Não é sequencial, para evitar colisão em cadastros simultâneos. | RF01 |

## 2. Prioridade e fila de coleta

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN08 | Os valores possíveis de prioridade são baixa, média, alta. A ordem de coleta é: alta > média > baixa. | RF01, RF06 |
| RN09 | Na fila de coleta, encomendas de mesma prioridade são atendidas da mais antiga para a mais recente. | RF06 |
| RN10 | A prioridade só pode ser alterada enquanto a encomenda estiver em "Aguardando coleta". | RF09 |

## 3. Situação e transições

Situações possíveis: **Aguardando coleta** (inicial), **Em trânsito**, **Entregue** e **Cancelada**. "Entregue" e "Cancelada" são situações finais.

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN11 | Só são permitidas as transições: Aguardando coleta → Em trânsito; Em trânsito → Entregue; Aguardando coleta → Cancelada. Qualquer outra transição é rejeitada e não altera a encomenda. | RF04, RF08 |
| RN12 | "Entregue" e "Cancelada" são situações finais: nenhuma transição, edição ou ocorrência é aceita depois delas. | RF04 |
| RN13 | Ao passar para "Em trânsito", é obrigatório informar o nome do responsável pela entrega. Ele fica guardado na encomenda. | RF04 |
| RN14 | Ao passar para "Entregue", é obrigatório informar o nome de quem recebeu. Ele fica guardado na encomenda. | RF04 |

## 4. Histórico de movimentação

O **histórico de movimentação** acompanha uma encomenda do cadastro até o fim, evento a evento. Existe desde o cadastro, cresce a cada acontecimento relevante e é a base da consulta de acompanhamento (RF02).

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN15 | Cada evento tem exatamente os campos da seção 4.1. | RF02, RF03 |
| RN16 | A data e a hora do evento são geradas pelo servidor, nunca informadas pelo usuário. O armazenamento é em UTC e a exibição usa o fuso `America/Sao_Paulo`. | RF02, RF03 |
| RN17 | Eventos nunca são editados nem apagados. Um erro deve ser corrigido por meio de um novo evento do tipo ocorrência, preservando o evento original. | RF03, RNF06 |
| RN18 | Os eventos são exibidos do mais recente para o mais antigo, pela sequência (do maior número para o menor). | RF02, RF03 |
| RN19 | Toda mudança de situação, inclusive o cadastro, gera exatamente um evento de movimentação, gravado na mesma transação da mudança. Não pode existir mudança de situação sem evento, nem evento de mudança de situação sem a correspondente mudança. | RF03, RF04, RNF03 |
| RN20 | A sequência começa em 1 no cadastro e aumenta de 1 em 1 a cada novo evento da mesma encomenda, sem repetições nem lacunas. É gerada pelo sistema e define a ordem dos eventos. | RF03 |
| RN21 | A descrição é preenchida conforme o tipo do evento (seção 4.2) e tem no máximo 255 caracteres. Textos digitados pelo usuário (motivo e ocorrência) acima desse limite são rejeitados. | RF03 |

### 4.1. Campos do evento de movimentação

| Campo | Tipo | Obrigatório | Regra |
| :- | :- | :-: | :- |
| código da encomenda | texto | Sim | Código de rastreamento da encomenda a que o evento pertence. |
| sequência | inteiro | Sim | Gerada pelo sistema (RN20). A dupla código da encomenda + sequência é única. |
| tipo | `CADASTRO`, `INICIO_TRANSPORTE`, `ENTREGA`, `CANCELAMENTO`, `ALTERACAO` ou `OCORRENCIA` | Sim | Ver seção 4.2. |
| data e hora | instante (UTC) | Sim | Gerada pelo servidor (RN16). |
| situação anterior | situação | Só nos tipos que mudam a situação | Preenchida em `INICIO_TRANSPORTE`, `ENTREGA` e `CANCELAMENTO`. Vazia em `CADASTRO`, `ALTERACAO` e `OCORRENCIA`. |
| situação resultante | situação | Sim | Situação da encomenda depois do evento. Em `ALTERACAO` e `OCORRENCIA` é a situação atual, que não muda. |
| descrição | texto, até 255 caracteres | Conforme o tipo | Ver seção 4.2. |

### 4.2. Tipos de evento

| Tipo | Quando é gerado | Situação anterior → resultante | Descrição | Exemplo de descrição |
| :- | :- | :-: | :- | :- |
| `CADASTRO` | Ao cadastrar a encomenda. | — → Aguardando coleta | Fixa, preenchida pelo sistema. | `Solicitação cadastrada` |
| `INICIO_TRANSPORTE` | Ao passar para "Em trânsito". | Aguardando coleta → Em trânsito | Obrigatória: nome do responsável pela entrega. | `Responsável pela entrega: João Silva` |
| `ENTREGA` | Ao passar para "Entregue". | Em trânsito → Entregue | Obrigatória: nome de quem recebeu. | `Recebido por: Prof. Carlos Lima` |
| `CANCELAMENTO` | Ao cancelar. | Aguardando coleta → Cancelada | Obrigatória: motivo informado. | `Motivo: pedido feito em duplicidade` |
| `ALTERACAO` | Ao aceitar uma edição. | situação atual (não muda) | Obrigatória: nomes dos campos alterados, gerada pelo sistema. Os valores anteriores não são guardados. | `Campos alterados: destino, prioridade` |
| `OCORRENCIA` | Ao registrar uma ocorrência. | situação atual (não muda) | Obrigatória: texto informado. | `Destinatário ausente, nova tentativa à tarde` |

### 4.3. Exemplo de histórico de movimentação

Encomenda `POL-7K3QX9AB`, exibida do mais recente para o mais antigo:

| sequência | tipo | data e hora | situação anterior | situação resultante | descrição |
| :-: | :- | :- | :- | :- | :- |
| 4 | `ENTREGA` | 15/10/2026 16:10 | Em trânsito | Entregue | Recebido por: Prof. Carlos Lima |
| 3 | `OCORRENCIA` | 15/10/2026 14:30 | — | Em trânsito | Destinatário ausente, nova tentativa à tarde |
| 2 | `INICIO_TRANSPORTE` | 15/10/2026 13:45 | Aguardando coleta | Em trânsito | Responsável pela entrega: João Silva |
| 1 | `CADASTRO` | 15/10/2026 09:02 | — | Aguardando coleta | Solicitação cadastrada |

## 5. Histórico de auditoria

O **histórico de auditoria** guarda o resultado final de cada encomenda encerrada: **um registro por encomenda, criado somente quando ela é entregue ou cancelada**. Enquanto a encomenda está em andamento, ela não aparece nesse histórico. 

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN22 | O registro de auditoria é criado somente quando a encomenda passa para "Entregue" ou "Cancelada", e nunca antes. Cadastro, início do transporte, edição e ocorrência não criam registro de auditoria. | RF07 |
| RN23 | Existe no máximo um registro de auditoria por encomenda, e exatamente um para cada encomenda finalizada. Ele é gravado na mesma transação da transição final e do evento de movimentação correspondente. | RF07, RNF03 |
| RN24 | Cada registro tem exatamente os campos da seção 5.1. Os dados copiados da encomenda são os valores no momento da finalização, já incluindo eventuais edições. | RF07 |
| RN25 | O registro de auditoria nunca é editado nem apagado. Como a encomenda finalizada não aceita mais alterações (RN12), o registro nunca fica diferente da encomenda. | RF07, RNF06 |
| RN26 | Em registro de encomenda entregue, o responsável pela entrega e o nome de quem recebeu são obrigatórios e o motivo do cancelamento fica vazio. Em registro de encomenda cancelada, o motivo é obrigatório e o responsável pela entrega e o nome de quem recebeu ficam vazios (o cancelamento só é aceito antes da coleta). | RF07, RF08 |
| RN27 | O histórico de auditoria é consultado em uma listagem paginada (RN37), da finalização mais recente para a mais antiga. | RF07 |

### 5.1. Campos do registro de auditoria

| Campo | Tipo | Obrigatório | Regra |
| :- | :- | :-: | :- |
| código da encomenda | texto | Sim | Código de rastreamento. Único no histórico de auditoria (um registro por encomenda). |
| situação final | `ENTREGUE` ou `CANCELADA` | Sim | Situação em que a encomenda terminou. |
| data de criação | instante (UTC) | Sim | Cópia da data e hora do cadastro da encomenda. |
| data e hora da finalização | instante (UTC) | Sim | Gerada pelo servidor no momento da entrega ou do cancelamento. |
| responsável pela entrega | texto | Só se `ENTREGUE` | Nome informado ao iniciar o transporte (RN13). Vazio se `CANCELADA`. |
| nome de quem recebeu | texto | Só se `ENTREGUE` | Nome informado na entrega (RN14). Vazio se `CANCELADA`. |
| motivo do cancelamento | texto, até 255 caracteres | Só se `CANCELADA` | Motivo informado no cancelamento (RN29). Vazio se `ENTREGUE`. |
| remetente | texto | Sim | Cópia da encomenda na finalização. |
| destinatário | texto | Sim | Cópia da encomenda na finalização. |
| origem | campus, prédio e sala | Sim | Cópia da encomenda na finalização. |
| destino | campus, prédio e sala | Sim | Cópia da encomenda na finalização. |
| prioridade | baixa, média, alta ou urgente | Sim | Cópia da encomenda na finalização. |

### 5.2. Exemplo de registros de auditoria

| código | situação final | data de criação | finalização | responsável pela entrega | quem recebeu | motivo do cancelamento |
| :- | :- | :- | :- | :- | :- | :- |
| `POL-7K3QX9AB` | `ENTREGUE` | 15/10/2026 09:02 | 15/10/2026 16:10 | João Silva | Prof. Carlos Lima | — |
| `POL-4MZ8D2KT` | `CANCELADA` | 15/10/2026 10:20 | 15/10/2026 10:45 | — | — | Pedido feito em duplicidade |

### 5.3. Diferença entre os dois históricos

| Aspecto | Histórico de movimentação | Histórico de auditoria |
| :- | :- | :- |
| Objetivo | Acompanhar a encomenda e explicar o que aconteceu com ela | Guardar o resultado final de cada encomenda encerrada |
| Quando é gravado | A cada evento: cadastro, início do transporte, entrega, cancelamento, edição e ocorrência | Uma única vez, na entrega ou no cancelamento |
| Quantidade por encomenda | Vários eventos | No máximo um registro |
| Existe para encomendas em andamento | Sim | Não |
| Conteúdo | Sequência, tipo, data e hora, situação anterior e resultante, descrição | Situação final, datas de criação e finalização, responsável pela entrega, quem recebeu, motivo do cancelamento e cópia dos dados principais |
| Editável ou apagável | Não | Não |
| Consulta | Dentro da consulta da encomenda (RF02) | Listagem própria, paginada (RF07) |

## 6. Cancelamento, edição e ocorrências

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN28 | O cancelamento só é aceito em "Aguardando coleta". | RF08 |
| RN29 | O cancelamento exige um motivo (até 255 caracteres). O motivo é registrado no evento `CANCELAMENTO` e no registro de auditoria. | RF07, RF08 |
| RN30 | A edição só é aceita em "Aguardando coleta". Os campos editáveis são: destinatário, local de destino, peso, conteúdo e prioridade. Código de rastreamento, remetente e local de origem não são editáveis. As regras de validação do cadastro (RN02 a RN04) continuam valendo após a edição. | RF09 |
| RN31 | Cada edição aceita gera um evento `ALTERACAO`, listando os nomes dos campos alterados, sem alterar a situação da encomenda. Uma edição sem nenhuma mudança é rejeitada e não gera evento. | RF03, RF09 |
| RN32 | Uma ocorrência exige texto (até 255 caracteres) e é aceita apenas em "Aguardando coleta" ou "Em trânsito". Ela gera um evento `OCORRENCIA` e não muda a situação da encomenda. | RF03, RF10 |

## 7. Concorrência e consistência (aqui precisamos pensar um pouco se inserimos essa complexidade ou não)

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN33 | Cada encomenda tem um número de versão. Uma atualização só é aplicada se a versão lida ainda for a atual. Se duas atualizações concorrentes chegarem, uma é aplicada e a outra recebe erro de conflito, devendo recarregar a encomenda. | RNF03 |
| RN34 | Cada requisição de escrita carrega um identificador único. Se a mesma requisição for reenviada (por exemplo, após falha de rede), o sistema devolve o resultado anterior sem gravar um segundo evento de movimentação, sem criar um segundo registro de auditoria e sem duplicar o efeito da operação. | RNF03 |

## 8. Consulta e listagem

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN35 | O intervalo de datas do filtro considera as data de início e fim. As datas de início e fim são inclusivas, e a data de início não pode ser posterior à data de fim. | RF05 |
| RN36 | Os filtros são combináveis: todos os critérios informados precisam ser atendidos. Sem filtros, a listagem mostra todas as encomendas. | RF05 |
| RN37 | As listagens (de encomendas e do histórico de auditoria) são paginadas, com 10 itens por página. A lista de encomendas vai da mais recente para a mais antiga. | RF05, RF07 |

## 9. Campi e locais (talvez não esteja façamos)

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN38 | O local de origem e o de destino devem existir no cadastro de campi, prédios e salas. | RF01, RF11 |
| RN39 | Campi, prédios e salas entram no sistema por carga de dados/configuração, sem alterar código. Inicialmente existe apenas o campus Politécnico. | RF11, RNF05 |

## 10. Notificações

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN40 | Toda mudança de situação dispara uma notificação por e-mail ao endereço informado no cadastro. Se nenhum e-mail foi informado, não há notificação. | RF12 |
| RN41 | A notificação é enviada depois da gravação. Se o envio falhar, a mudança de situação permanece. A falha de notificação nunca desfaz a atualização. | RF12, RNF01, RNF03 |