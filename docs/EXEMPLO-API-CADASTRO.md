# Demonstração da fatia vertical: cadastrar e consultar encomenda

> Documento de apoio à implementação do caso de uso do Henrique. Não substitui os diagramas definitivos e os requisitos do grupo.

## Requisitos implementados nesta fatia

- RF01 / RN01–RN06: cadastrar com dados obrigatórios, peso de 0 a 30 kg (limite inferior exclusivo), origem e destino diferentes, prioridade e código gerado pelo servidor.
- RF02: consulta por código; RF03 / RN15: movimentação inicial `AGUARDANDO_COLETA`, persistida juntamente com a encomenda.
- Integração substituível: `INotificador` + `ConsoleNotificador`, com disparo após persistência, sem aguardar envio.
- Fluxo alternativo: cadastro inválido retorna HTTP 400; código inexistente retorna HTTP 404.

## Testar com PostgreSQL disponível

Siga `docs/BUILD.md` para preparar `.env`, instalar dependências e subir o servidor. Na raiz do repositório:

```bash
curl -i -X POST http://localhost:3000/encomendas \
  -H 'Content-Type: application/json' \
  -d '{
    "nomeRemetente": "Ana Silva",
    "localRemetente": {"campus":"Politécnico","predio":"Bloco A","sala":"101"},
    "nomeDestinatario": "João Souza",
    "localDestinatario": {"campus":"Politécnico","predio":"Bloco B","sala":"202"},
    "emailDestinatario": "joao@ufpr.br",
    "pesoKg": 2.5,
    "conteudo": "documento",
    "descricao": "Documentos de matrícula",
    "prioridade": "alta"
  }'
```

A resposta esperada é HTTP 201 com `codigoRastreio` e `situacao: AGUARDANDO_COLETA`. A mensagem `[NOTIFICAÇÃO SIMULADA]` aparece no terminal. Em seguida:

```bash
curl -i http://localhost:3000/encomendas/POL-CODIGO_GERADO
```

Substitua pelo código retornado no POST. O GET deve devolver a encomenda e o histórico inicial. Cadastros inválidos devem retornar HTTP 400. Consultas inexistentes devem retornar HTTP 404.

## Limitações do recorte

- O caso de uso menciona autenticação como pré-condição, mas a decisão vigente do grupo é um **usuário geral sem login obrigatório**. Não foi implementada autenticação.
- O exemplo do diagrama omite campos que o RF01 torna obrigatórios (nome, local detalhado, peso, tipo e e-mail); o modelo precisa ser atualizado antes da defesa.
- O código atual usa `Package`, `SolicitarEntregaService` e `PackageController`, enquanto os UML do Henrique usam `Solicitacao`, `SolicitacaoService` e `SolicitacaoController`. São papéis equivalentes, mas **os nomes precisam ser harmonizados nos diagramas ou no código**.
- O histórico inicial é persistido como JSONB na mesma linha da encomenda, suficiente para a fatia de cadastro. Antes de implementar mudanças de estado, avaliar uma tabela própria de movimentações para atender à imutabilidade/auditoria a longo prazo.
- Este recorte ainda não implementa atualizações de estado, auditoria de finalização, filtros, paginação ou envio real de e-mails. Isso não deve ser confundido com os dez RFs integralmente implementados.
