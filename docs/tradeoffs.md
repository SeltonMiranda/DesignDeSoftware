# Alternativas e Trade-Offs

## Alternativa A: Monólito simples organizado em camadas
Esta abordagem organiza o sistema nas em camadas lógicas (Apresentação, Serviço e Persistência, etc), onde os frameworks web e ferramentas do banco de dados ligam-se diretamente na lógica de negócio e nos modelos de dados.

### Benefícios
- Baixa complexidade inicial. A curva de aprendizado é rápida, ideal para o início rápido do desenvolvimento.
- Implantação simples: Um único container para deploy e transações gerenciadas em um único banco de dados relacional.

### Custos
- Acoplamento tecnológico. As regras de negócio ficam presas às bibliotecas, frameworks e estruturas de banco de dados escolhidos.
- Baixa testabilidade isolada. Testar as regras de negócio exige subir contextos de framework ou conectar a bancos de dados reais, tornando os testes lentos e complexos.
- Dificulta futuras trocas de tecnologia devido ao alto acoplamento com as regras de negócio.

## Alternativa B: Microsserviços
Esta alternativa divide o sistema em serviços independentes e distribuídos via rede.

### Benefícios
- Isolamento de falhas. A queda de um serviço não impede que outros continuem.
- Escalabilidade granular. Capacidade de escalar serviços específicos de forma independente caso a demanda exija.

### Custos
- Complexidade de infraestrutura. Exige orquestração de rede, gerenciamento de múltiplos repositórios, rastreamento distribuído e complexidade de ciclo de entregas inviável para um volume de requisições de ~300 requisições/dia.
- Custo operacional elevado: O overhead de gerenciar um ambiente distribuído é incompatível com a capacidade de uma equipe pequena de 5 alunos e 2 professores.

## Alternativa C: Monólito Simples em arquitetura hexagonal
Esta alternativa mantém a simplicidade estrutural de um monolito tradicional (deploy unificado, transações em um único banco, sem a complexidade de microsserviços), mas aplica os princípios da Arquitetura Hexagonal (Ports & Adapters) para isolar o núcleo da aplicação.

### Benefícios
- Independência tecnológica. O domínio de negócio é puro e não conhece detalhes de infraestrutura, frameworks ou banco de dados.
- Testabilidade simples. Permite testes unitários sem necessidade de banco de dados ou ferramentas externas.
- Modificabilidade. Suporta a troca de tecnologias sem alterar as regras de negócio ao longo do ciclo de vida do sistema.
- Implantação e operação simplificadas. Mantém a simplicidade de deploy de um monolito e suporta replicação simples com balanceador de carga para alta disponibilidade.

### Custos
- Disciplina arquitetural. Exige rigor inicial da equipe para respeitar o fluxo de dependências.
- Mais classes e interfaces 
- Mais indireção

## Decisão Final Relacionada aos ASRs
A escolha do Monolito Simples em Arquitetura Hexagonal foi validada diretamente pelos ASRs levantados para o projeto:

- Atendimento a ASR01 e ASR02: O sistema restringe que o código de domínio conheça detalhes de infraestrutura e elimina a dependência de ferramentas externas para validação de regras de negócio, garantindo testes unitários rápidos e puros sem banco de dados.

- Atendimento a ASR03: A estrutura de monolito tradicional assegura robustez, atualizações rápidas fora do horário de pico e a possibilidade de replicação simples de servidores com balanceamento de carga para garantir disponibilidade.

- Atendimento a ASR04: O contexto da equipe (5 alunos e 2 professores) torna inviável a complexidade de microsserviços, descartando a Alternativa B. Ao mesmo tempo, o monolito hexagonal remove os custos da Alternativa A ao garantir transações locais simples, validações próximas ao domínio e facilidade de implantação local, reduzindo o acoplamento de tecnologias.