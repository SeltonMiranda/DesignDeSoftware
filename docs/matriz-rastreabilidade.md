# Matriz de rastreabilidade — Gestão de entregas internas do campus

> **Status:** proposta de documentação para validação pelo grupo.  
> **Escopo:** campus Politécnico da UFPR.  
> **Base consultada:** `docs/requisitos.md`, `docs/regras-de-negocio.md`, `docs/arquitetura.md`, `docs/atores.md` e código presente na branch `main` em 13/11/2026 (último commit identificado no repositório original: `2edd096`, de 07/11/2026).  
> **Importante:** os fluxos e casos de teste abaixo são **propostos**, não indicam funcionalidades implementadas nem substituem os diagramas em elaboração.

## 1. Objetivo

Relacionar as necessidades do sistema com as regras de negócio, os fluxos previstos, os cenários de verificação e as decisões de projeto. Esta matriz adapta a abordagem utilizada pelo grupo no trabalho anterior de Engenharia de Requisitos, mas direciona a rastreabilidade à coerência entre requisitos, arquitetura, diagramas, código e testes, conforme a proposta do trabalho final de Design de Software.

## 2. Requisitos funcionais e verificações

| RF | Funcionalidade | Regras de negócio relacionadas | Fluxo ou operação a demonstrar (proposta) | Critério de aceitação ou teste (proposto) | Estado verificado em `main` |
| :--: | --- | --- | --- | --- | --- |
| RF01 | Cadastrar encomenda | RN01–RN05, RN11–RN12, RN15 | Cadastrar solicitação, gerar código e situação inicial | Dados válidos geram encomenda única, `AGUARDANDO_COLETA` e movimentação inicial; peso inválido e origem igual ao destino são rejeitados | **Incompleto**: existe esqueleto do caso de uso com dados fixos |
| RF02 | Consultar encomenda por código | RN12, RN14, RN17 | Recuperar encomenda e dados atuais | Código existente retorna situação, prioridade e última atualização; código inexistente resulta em erro apropriado | **Não identificado como funcional** |
| RF03 | Histórico de movimentação | RN11–RN16 | Consultar sequência de situações da encomenda | Há um registro inicial e um por transição válida; registros aparecem em ordem decrescente e não são editáveis | **Não identificado como funcional** |
| RF04 | Atualizar situação | RN09–RN10, RN15–RN16 | Iniciar transporte; concluir entrega | Apenas transições permitidas são executadas; tentativa de nova transição em situação final é rejeitada | **Não identificado como funcional** |
| RF05 | Listar e filtrar encomendas | RN23–RN25 | Listagem por situação, prioridade e datas | Filtros combináveis, intervalo válido e paginação de 10 itens | **Não identificado como funcional** |
| RF06 | Ordenar lista de coleta | RN06–RN07 | Consultar itens por prioridade | Prioridade alta precede média e baixa; em empate prevalece cadastro mais antigo | **Não identificado como funcional** |
| RF07 | Histórico de auditoria | RN18–RN22, RN25 | Consultar resultados das encomendas encerradas | Encomenda em andamento não aparece; cada finalização gera exatamente um registro imutável | **Não identificado como funcional** |
| RF08 | Cancelar encomenda | RN09–RN10, RN16, RN18–RN19 | Cancelar antes da coleta, com motivo | Cancelamento antes da coleta é aceito; cancelamento sem motivo ou após início do transporte é rejeitado | **Não identificado como funcional** |
| RF09 | Editar encomenda | RN08, RN10, RN17 | Alterar campos permitidos antes da coleta | Edição válida atualiza `updatedAt`, sem adicionar movimentação; edição após finalização é rejeitada | **Não identificado como funcional** |
| RF10 | Notificar por e-mail | RN26–RN27 | Notificar após mudança de situação | Falha do notificador não desfaz a alteração; a dependência pode ser substituída por adaptador de teste | **Não identificado como funcional** |

**Legenda:** “Não identificado como funcional” significa que a versão consultada não demonstrou a operação completa. Não é afirmação sobre trabalho local dos integrantes, outras branches ou alterações posteriores.

## 3. Requisitos não funcionais, ASRs e evidências

| Fonte atual | Relação arquitetural | Evidência ou verificação sugerida | Situação |
| --- | --- | --- | --- |
| RNF01 — disponibilidade | ASR03; escolha de implantação monolítica e facilidade operacional | Explicar as premissas da meta e o plano de verificação/recuperação; não alegar disponibilidade medida sem monitoramento | Documentação existente; evidência prática pendente |
| RNF02 — modificabilidade | ASR01; domínio independente de frameworks e bancos | Inspecionar imports e demonstrar substituição de adaptador sem alterar regras de negócio | Estrutura de pastas iniciada; demonstração pendente |
| RNF03 — testabilidade | ASR02; testes isolados do domínio | Executar testes unitários de validação e transições sem banco e sem Express | Testes não identificados na versão consultada |
| RNF04 — integridade dos históricos | Responsabilidades de domínio e persistência; relacionar à consistência da finalização | Rejeitar alteração/remoção de históricos e verificar gravação transacional na finalização | Implementação e demonstração pendentes |
| RNF05 — consulta em até 2 s no percentil 95 | Desempenho de consulta, indexação e acesso ao banco; não associado explicitamente aos quatro ASRs atuais | Teste de carga com volume, ambiente, método e resultados registrados | Evidência pendente |

**ASR04** na documentação atual está baseado no contexto de equipe pequena. Antes de tratá-lo como ASR definitivo, o grupo deve decidir se ele permanece como restrição de projeto ou se será associado a um cenário de qualidade mensurável. O enunciado solicita **três ASRs**; a documentação atual apresenta quatro itens.

## 4. Documentos e modelos que devem se conectar

| Artefato exigido | O que precisa ser rastreado | Situação observada no repositório consultado |
| --- | --- | --- |
| Diagrama de classes | Entidades de encomenda e históricos; serviços, interfaces e responsabilidades | Não encontrado na `main` do projeto original à data da revisão |
| Diagrama de sequência | Operações realmente implementadas, por exemplo cadastro ou finalização | Não encontrado na `main` do projeto original à data da revisão |
| Diagrama de comunicação | Mensagens compatíveis com o mesmo fluxo usado no diagrama de sequência | Não encontrado na `main` do projeto original à data da revisão |
| Diagrama de componentes ou pacotes | Núcleo, portas, adaptadores, HTTP, banco e notificações; dependências corretas | Não encontrado na `main` do projeto original à data da revisão |
| ADRs (mínimo 3) | Decisões justificadas pelos ASRs; alternativas e consequências | Não encontrados na `main` do projeto original à data da revisão |
| Análise de evolução (2 mudanças) | Partes afetadas/invariantes por troca de banco e serviço de notificação | Não encontrada na `main` do projeto original à data da revisão |
| Protótipo e testes | Pelo menos uma operação de escrita, uma consulta, erro, persistência e dependência externa substituível | Estrutura de aplicação iniciada; fluxo completo não demonstrado |

Os diagramas e as decisões podem ter sido desenvolvidos fora do GitHub; confirmar isso com os integrantes antes de atribuir novas tarefas. **Os arquivos de ADRs e diagramas criados neste fork são apenas espaços reservados e não representam entregas concluídas.**

## 5. Rastreabilidade mínima da fatia vertical sugerida

| Passo do fluxo | Requisitos e regras | Resultado observável | Teste necessário |
| --- | --- | --- | --- |
| 1. Cadastrar | RF01; RN01–RN05, RN15 | Código gerado, situação inicial e persistência | Cadastro válido e dados inválidos |
| 2. Consultar | RF02–RF03; RN11–RN14 | Dados persistidos e movimentação inicial | Busca existente/inexistente |
| 3. Iniciar transporte | RF04; RN09, RN15 | Situação `EM_TRANSITO` e novo registro | Transição válida/inválida |
| 4. Finalizar entrega | RF04, RF07; RN09–RN10, RN18–RN21 | Situação `ENTREGUE`, movimentação e auditoria | Finalização única e consistência transacional |
| 5. Notificar | RF10; RN26–RN27 | Tentativa de notificação após gravação | Falha simulada não desfaz entrega |

*Fatia vertical sugerida para avaliação do grupo. Não representa a divisão de trabalho já aprovada, nem exige implementar todos os RFs antes da entrega.*

## 6. Pontos a alinhar antes da versão definitiva

1. **Referências desatualizadas:** RN26 e RN27 apontam a RF12, embora notificações estejam em RF10; RN21 aponta a RNF06, inexistente; RN22 aponta a RN37, inexistente.
2. **Consistência transacional:** RN15 e RN19 associam a atomicidade das operações a RNF03, mas RNF03 atualmente descreve testabilidade. A necessidade de transação continua relevante, porém a referência precisa ser revista.
3. **Auditoria:** RN20 menciona a cópia de dados da encomenda, enquanto a seção 5.1 enumera apenas código, situação final e duas datas. Confirmar se haverá campos adicionais ou ajustar a redação da regra.
4. **Atores:** `docs/atores.md` identifica Solicitante e Operador como atores conceituais, mas o protótipo utilizará usuário geral sem autorização por papéis. Preservar essa distinção nos diagramas e casos de uso.
5. **Status:** atualizar esta matriz quando o colega responsável pelos casos de uso e diagramas compartilhar seu trabalho, mesmo que ainda não tenha feito commit.

## 7. Como manter a matriz

- Atualizar os vínculos quando RFs ou regras mudarem, preservando seus identificadores ou registrando a renumeração.
- Só alterar o estado de um RF para **implementado e testado** depois de existir evidência no código e nos testes.
- Associar os diagramas aos nomes definitivos dos casos de uso e classes, evitando criar nomenclaturas paralelas.
- Usar esta matriz como checklist de coerência na revisão final e como apoio à defesa.
