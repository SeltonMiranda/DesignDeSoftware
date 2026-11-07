# Regras de negócio

## 1. Solicitação e dados da encomenda

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN01 | Todos os campos do cadastro são obrigatórios: nome e local do remetente, nome e local do destinatário, peso, conteúdo e prioridade e email para notificação | RF01 |
| RN02 | O peso deve ser maior que zero e não pode passar do limite máximo (30 kg). | RF01 |
| RN03 | O conteúdo só pode ser "documento" ou "volume". | RF01 |
| RN04 | O local de origem deve ser diferente do local de destino. | RF01 |
| RN05 | O código de rastreamento é gerado pelo sistema, nunca informado pelo usuário. | RF01 |

## 2. Prioridade e lista de coleta

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN06 | Os valores possíveis de prioridade são baixa, média, alta. A ordem de coleta é: alta > média > baixa. | RF01, RF06 |
| RN07 | Na lista de coleta, encomendas de mesma prioridade são atendidas da mais antiga para a mais recente. | RF06 |
| RN08 | A prioridade só pode ser alterada enquanto a encomenda estiver em "Aguardando coleta". | RF09 |

## 3. Situação e transições

Situações possíveis: **Aguardando coleta** (inicial), **Em trânsito**, **Entregue** e **Cancelada**. "Entregue" e "Cancelada" são situações finais.

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN09 | Só são permitidas as transições: Aguardando coleta → Em trânsito, Em trânsito → Entregue, Aguardando coleta → Cancelada. Qualquer outra transição é rejeitada e não altera a encomenda. | RF04, RF08 |
| RN10 | "Entregue" e "Cancelada" são situações finais: nenhuma transição ou edição é aceita depois delas. | RF04 |

## 4. Histórico de movimentação

O **histórico de movimentação** registra somente as mudanças de situação da encomenda. Cada registro representa uma das quatro situações: **Aguardando coleta**, **Em trânsito**, **Entregue** ou **Cancelada**. Edições dos dados da encomenda apenas atualizam a data e hora da última atualização da encomenda.

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN11 | O histórico contém somente um registro para cada situação assumida pela encomenda: o registro inicial de "Aguardando coleta" e os registros das transições para "Em trânsito", "Entregue" ou "Cancelada". | RF02, RF03 |
| RN12 | A data e a hora de cada mudança de situação são geradas pelo servidor, nunca informadas pelo usuário. | RF02, RF03 |
| RN13 | Os registros do histórico de movimentação nunca são editados nem apagados. | RF03, RNF04 |
| RN14 | Os registros são exibidos do mais recente para o mais antigo. | RF02, RF03 |
| RN15 | O cadastro gera exatamente um registro inicial com a situação "Aguardando coleta". Cada mudança válida de situação gera exatamente um novo registro. | RF03, RF04, RNF03 |
| RN16 | Cada registro contém a situação resultante e a data e hora em que ela foi assumida. O motivo do cancelamento é armazenado somente no registro cuja situação é "Cancelada". | RF03, RF08 |
| RN17 | Toda edição aceita dos dados da encomenda atualiza a data e hora da última atualização (`updatedAt`), gerada pelo servidor. A edição não cria nem altera registros no histórico de movimentação. Uma edição sem mudanças é rejeitada e não atualiza essa data. | RF02, RF09 |

### 4.1. Campos do registro de movimentação

| Campo | Tipo | Obrigatório | Regra |
| :- | :- | :-: | :- |
| código da encomenda | texto | Sim | Código de rastreamento da encomenda a que o registro pertence. |
| situação | `AGUARDANDO_COLETA`, `EM_TRANSITO`, `ENTREGUE` ou `CANCELADA` | Sim | Situação assumida pela encomenda nesse registro. |
| data e hora | instante | Sim | Momento em que a situação foi assumida, gerado pelo servidor. |
| motivo do cancelamento | texto, até 255 caracteres | Somente se a situação for `CANCELADA` | Motivo informado ao cancelar. Nos demais registros, fica vazio. |

### 4.2. Registros do histórico

| Situação | Quando é gerado | Motivo do cancelamento |
| :- | :- | :- |
| `AGUARDANDO_COLETA` | Ao cadastrar a encomenda. | — |
| `EM_TRANSITO` | Ao iniciar o transporte, após informar o responsável pela entrega. | — |
| `ENTREGUE` | Ao concluir a entrega, após informar quem recebeu. | — |
| `CANCELADA` | Ao cancelar uma encomenda ainda em "Aguardando coleta". | Obrigatório: motivo informado pelo usuário. |

### 4.3. Exemplo de histórico de movimentação

Encomenda `POL-7K3QX9AB`, exibida do mais recente para o mais antigo:

| situação | data e hora | motivo do cancelamento |
| :- | :- | :- |
| `ENTREGUE` | 15/10/2026 16:10 | — |
| `EM_TRANSITO` | 15/10/2026 13:45 | — |
| `AGUARDANDO_COLETA` | 15/10/2026 09:02 | — |

## 5. Histórico de auditoria

O **histórico de auditoria** guarda o resultado final de cada encomenda encerrada: **um registro por encomenda, criado somente quando ela é entregue ou cancelada**. Enquanto a encomenda está em andamento, ela não aparece nesse histórico. 

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN18 | O registro de auditoria é criado somente quando a encomenda passa para "Entregue" ou "Cancelada", e nunca antes. Cadastro, início do transporte e edição não criam registro de auditoria. | RF07 |
| RN19 | Existe no máximo um registro de auditoria por encomenda, e exatamente um para cada encomenda finalizada. Ele é gravado na mesma transação da transição final e do evento de movimentação correspondente. | RF07, RNF03 |
| RN20 | Cada registro tem exatamente os campos da seção 5.1. Os dados copiados da encomenda são os valores no momento da finalização, já incluindo eventuais edições. | RF07 |
| RN21 | O registro de auditoria nunca é editado nem apagado. Como a encomenda finalizada não aceita mais alterações (RN12), o registro nunca fica diferente da encomenda. | RF07, RNF06 |
| RN22 | O histórico de auditoria é consultado em uma listagem paginada (RN37), da mais recente para a mais antiga. | RF07 |

### 5.1. Campos do registro de auditoria

| Campo | Tipo | Obrigatório | Regra |
| :- | :- | :-: | :- |
| código da encomenda | texto | Sim | Código de rastreamento. Único no histórico de auditoria (um registro por encomenda). |
| situação final | `ENTREGUE` ou `CANCELADA` | Sim | Situação em que a encomenda terminou. |
| data de criação | instante (UTC) | Sim | Cópia da data e hora do cadastro da encomenda. |
| data e hora da finalização | instante (UTC) | Sim | Gerada pelo servidor no momento da entrega ou do cancelamento. |

### 5.2. Exemplo de registros de auditoria

| código | situação final | data de criação | finalização |
| :- | :- | :- | :- |
| `POL-7K3QX9AB` | `ENTREGUE` | 15/10/2026 09:02 | 15/10/2026 16:10 |
| `POL-4MZ8D2KT` | `CANCELADA` | 15/10/2026 10:20 | 15/10/2026 10:45 |


## 6. Consulta e listagem

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN23 | O intervalo de datas do filtro considera as data de início e fim. As datas de início e fim são inclusivas, e a data de início não pode ser posterior à data de fim. | RF05 |
| RN24 | Os filtros são combináveis: todos os critérios informados precisam ser atendidos. Sem filtros, a listagem mostra todas as encomendas. | RF05 |
| RN25 | As listagens (de encomendas e do histórico de auditoria) são paginadas, com 10 itens por página. A lista de encomendas vai da mais recente para a mais antiga. | RF05, RF07 |

## 7. Notificações

| ID | Regra | Requisito |
| :-: | :- | :-: |
| RN26 | Toda mudança de situação dispara uma notificação por e-mail ao endereço informado no cadastro. | RF12 |
| RN27 | A notificação é enviada depois da gravação. Se o envio falhar, a mudança de situação permanece. A falha de notificação nunca desfaz a atualização. | RF12, RNF01, RNF03 |