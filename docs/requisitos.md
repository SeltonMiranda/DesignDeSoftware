# Requisitos

Este documento apresenta a descrição detalhada dos requisitos funcionais e não funcionais do **sistema de gestão de entregas internas do campus**. As regras de negócio que complementam estes requisitos estão em [`regras-de-negocio.md`](regras-de-negocio.md).

## Contexto

O sistema será desenvolvido pelo departamento de informática, laboratório C3SL, da UFPR, sob orientação de **2 professores e com uma equipe inicial de 5 alunos**. O escopo inicial contempla as entregas internas do campus Politécnico, mas a evolução prevista é abranger todos os campi da UFPR. Em razão da **contínua expansão do sistema e rotatividade da equipe**, exige-se **alta testabilidade**, pois se torna custoso entregas mal-sucedidas provenientes de erros da aplicação, **facilidade de manutenção e implantação**. Dessa forma, para **garantir suporte a eventuais mudanças tecnológicas** durante seu ciclo de vida, o **domínio da aplicação deve ser desacoplado** de frameworks e ferramentas externas, assegurando a **independência das regras de negócio**.
Mais detalhes do escopo:

- Horário de funcionamento: segunda a sexta, das 7h às 22h.
- Volume de carga: média de 300 requisições por dia (~20 requisições/h).
- Carga de pico: Estimado em 50 a 60 requisições/h durante horários de maior fluxo.

## Requisitos funcionais

| ID | Descrição |
|:-:|:- |
| RF01 | O sistema deve permitir o cadastro de uma solicitação de encomenda com: nome do remetente, local do remetente (campus, prédio e sala), nome do destinatário, local do destinatário (campus, prédio e sala), peso (em kg), conteúdo (documento ou volume), prioridade (baixa, média ou alta) e e-mail do destinatário para notificação. Ao cadastrar, o sistema deve gerar o código de rastreamento e definir a situação inicial como "Aguardando coleta". | 
| RF02 | O sistema deve permitir consultar uma encomenda pelo código de rastreamento, mostrando: situação atual ("Aguardando coleta", "Em trânsito", "Entregue" ou "Cancelada"), data e hora da última atualização, prioridade, origem, destino, responsável pela entrega (quando já informado), nome de quem recebeu (quando entregue) e o histórico de movimentação. | 
| RF03 | O sistema deve manter, para cada encomenda, o **histórico de movimentação**: uma sequência de eventos que acompanha a encomenda desde o cadastro. Cada evento tem os campos: código da encomenda, sequência, tipo, data e hora, situação anterior, situação resultante e descrição. Os eventos são mostrados do mais recente para o mais antigo e não podem ser editados nem apagados. | 
| RF04 | O sistema deve permitir a atualização da situação de uma encomenda, apenas pelas transições permitidas: "Aguardando coleta" → "Em trânsito" (informando o responsável pela entrega) e "Em trânsito" → "Entregue" (informando o nome de quem recebeu). Transições inválidas devem ser rejeitadas com mensagem de erro. | 
| RF05 | O sistema deve permitir listar as encomendas, mostrando código, situação, prioridade e data de criação, com filtros combináveis por prioridade, situação e intervalo de datas (início e fim, sobre a data de criação). A listagem deve ser paginada. |
| RF06 | O sistema deve mostrar a **fila de coleta**: encomendas em "Aguardando coleta", ordenadas por prioridade (urgente primeiro) e, em caso de empate, da mais antiga para a mais recente. A fila pode ser filtrada pelo campus de origem. |
| RF07 | O sistema deve manter o **histórico de auditoria**: um registro para cada encomenda finalizada ("Entregue" ou "Cancelada"), criado **somente** no momento da finalização. Cada registro tem os campos: código da encomenda, situação final, data de criação, data e hora da finalização, responsável pela entrega, nome de quem recebeu, motivo do cancelamento e uma cópia dos dados principais da encomenda (remetente, destinatário, origem, destino e prioridade). O histórico pode ser consultado em uma listagem paginada e não pode ser editado nem apagado. |
| RF08 | O sistema deve permitir cancelar uma encomenda que ainda esteja em "Aguardando coleta", com motivo obrigatório. A situação passa a "Cancelada". | Essencial |
| RF09 | O sistema deve permitir editar uma encomenda enquanto ela estiver em "Aguardando coleta" (destinatário, local de destino, peso, conteúdo e prioridade). Cada edição deve gerar um evento no histórico de movimentação. |
| RF10 | O sistema deve permitir registrar uma ocorrência (por exemplo, destinatário ausente) em encomendas "Aguardando coleta" ou "Em trânsito", sem alterar a situação. A ocorrência fica registrada no histórico de movimentação. | 
| RF11 | O sistema deve manter o cadastro de prédios e salas, que alimenta os locais de origem e destino. Novos locais devem ser incluídos por carga de dados/configuração. |
| RF12 | O sistema deve notificar por e-mail, a cada mudança de situação, o endereço informado no cadastro. Uma falha no envio não impede nem desfaz a atualização. |

## Requisitos não funcionais

| ID | Descrição |
| :-: | :- |
| RNF01 | O sistema deve estar disponível 99% do tempo durante o horário de funcionamento dos campi, o que equivale a cerca de 3 h de indisponibilidade tolerada por mês. Fora desse horário, a meta é de 95%. Manutenções e migrações devem ocorrer fora do horário de funcionamento. | 
| RNF02 | Trocar ou adicionar uma tecnologia externa (banco de dados, serviço de e-mail) deve exigir alterações **apenas** na camada de infraestrutura. Regras de negócio e casos de uso não podem depender de frameworks nem de serviços externos. | 
| RNF03 | As regras de negócio (transições, validações, prioridade, geração dos históricos) devem poder ser testadas por teste unitário, sem banco, rede nem framework. 
| RNF04 | Os eventos de movimentação e os registros de auditoria não podem ser alterados nem apagados pelas funções da aplicação. Correções são feitas com um novo evento.
| RNF05 | A consulta por código de rastreamento deve responder em até 2s em 95% porcento das requisições.
| RNF06 | Caso dois usuários atualizem o estado de uma encomenda de "Aguardando Coleta" para "Em trânsito", exatamente um deve atualizar, para o outro será enviada uma mensagem de erro.  