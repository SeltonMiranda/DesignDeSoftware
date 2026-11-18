# ADR-0003: Notificação por e-mail isolada por porta e disparada de forma assíncrona após a gravação

- **Status:** Aceita

## 1. Contexto

A cada mudança de situação de uma encomenda, o sistema notifica por e-mail o endereço informado no cadastro (RF10, RN26). O envio depende de um serviço externo (servidor SMTP da universidade ou outro provedor), cuja disponibilidade e latência **não controlamos**. No cadastro, o e-mail é enviado para a situação inicial "Aguardando coleta" (interpretação adotada: o cadastro é a primeira situação assumida).

## 2. Problema e forças envolvidas

| Força | Efeito sobre a decisão |
| :- | :- |
| RN27: a notificação é enviada **depois** da gravação; falha **nunca** desfaz a atualização | O envio não pode participar da transação do banco. |
| RNF01: 99% de disponibilidade | Uma queda do SMTP não pode derrubar cadastro nem atualização de status. |
| Latência do SMTP (segundos, ou *timeout* de dezenas de segundos) | Esperar o envio atrasaria a resposta ao usuário. |
| RNF02: trocar o serviço de e-mail só afeta a infraestrutura | O caso de uso não pode conhecer SMTP, SDK ou provedor. |
| RNF03: testar regras sem rede | É preciso substituir o notificador por um *fake* em testes. |
| Equipe pequena, ~300 req/dia | Infraestrutura adicional (broker, workers) tem custo desproporcional. |

## 3. Alternativas consideradas

**A. Envio síncrono dentro do caso de uso (aguardando o resultado).**
- Prós: simples; erro visível na hora.
- Contras: latência do SMTP na resposta; se o envio ocorrer antes do *commit*, uma falha desfaria a gravação (viola RN27); se depois, o usuário recebe erro mesmo com a operação salva.

**B. Porta de saída + disparo pós-gravação, em segundo plano, no mesmo processo (sem aguardar), com falha apenas registrada em log.**
- Prós: atende RN27 e RNF01 com o mínimo de código; resposta não depende do SMTP; o adaptador é trocável (RNF02).
- Contras: sem *retry*; notificação pode se perder se o processo cair logo após o *commit*.

**C. Padrão *outbox* + *worker* (e/ou fila de mensagens como RabbitMQ).** O evento é gravado na mesma transação da mudança de situação e processado depois por um *worker* com *retry*.
- Prós: entrega garantida *at-least-once*, com reenvio e rastreabilidade.
- Contras: nova tabela, novo processo, controle de idempotência e monitoramento; excesso para o volume e a equipe atuais.

**D. Microsserviço de notificações com banco próprio.**
- Prós: isolamento total.
- Contras: rejeitado pelos mesmos motivos da [ADR-0001](0001-monolito-com-banco-unico.md).

## 4. Decisão

Adotamos a **alternativa B**, deixando um caminho de evolução para a **C**:

1. O núcleo declara a porta de saída `INotificador.notificar(notificacao)`; o caso de uso só conhece essa interface.
2. O caso de uso **primeiro grava** (encomenda + registro de movimentação, em uma transação) e **só então** dispara a notificação **sem `await`** no fluxo principal. Qualquer erro do notificador é capturado e registrado via porta `ILogger` (`ConsoleLogger`); **nunca** é propagado nem desfaz a gravação (RN27).
3. Entrada inválida ou falha de gravação **não** disparam notificação.
4. O adaptador inicial (`ConsoleNotificador`) apenas imprime no terminal o que seria enviado. O adaptador SMTP real será um novo arquivo em `infra/adapters/out/`, trocado na montagem (`routes.ts`), sem alterar domínio nem casos de uso.
5. Se for necessário garantir entrega, o adaptador passa a **gravar em uma tabela *outbox*** e um *worker* assume o envio (alternativa C), mantendo a mesma porta.

## 5. Consequências positivas

- A indisponibilidade do SMTP **não afeta** cadastro nem mudança de situação (RN27, RNF01).
- O tempo de resposta da API não inclui o envio de e-mail.
- Trocar de provedor ou de canal (SMS, push) é um adaptador novo (RNF02).
- Testável sem rede: os testes usam notificadores *fake* e verificam que a falha de envio não desfaz o cadastro (RNF03).
- Evolução para *outbox* não exige mudar o caso de uso.

## 6. Consequências negativas, custos e riscos

- **Notificações podem ser perdidas**: se o processo cair entre o *commit* e o envio, ou se o SMTP falhar, não há reenvio automático. O registro em log é o único rastro. *Mitigação:* alertar sobre erros no log; migrar para *outbox* se a perda se mostrar relevante.
- **Sem confirmação ao usuário** de que o e-mail foi enviado; a API responde sucesso mesmo se a notificação falhar depois.
- **Trabalho em segundo plano dentro do processo da API:** envios pendentes são interrompidos em reinícios (3 implantações por semana). *Mitigação:* implantar fora do horário de pico e tratar encerramento gracioso (*graceful shutdown*).
- **Sem limitação de taxa nem fila:** em um pico muito acima do estimado, muitos envios simultâneos podem sobrecarregar o SMTP ou o processo.
- **Código que `await`-asse o notificador por engano** reintroduziria o acoplamento de latência; o contrato da porta e os testes documentam o comportamento esperado.
- **Sem registro de que a notificação foi tentada:** não há trilha de auditoria de envios (diferente da auditoria de encomendas, RF07).
