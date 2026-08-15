# A2UI - Protocolo de Interface para Agentes

![A2UI](../assets/a2ui_logo.png)

Bem-vindo à documentação completa do **A2UI (Agent-to-UI)** traduzida para português!

## 📋 O que é A2UI?

**A2UI** é um protocolo de código aberto e um conjunto de bibliotecas que permite que agentes "falem UI". Agentes enviam um formato JSON declarativo descrevendo a **intenção** da interface de usuário. O aplicativo cliente então renderiza isso usando sua própria biblioteca de componentes nativos (Flutter, Angular, Lit, etc.).

Essa abordagem garante que as interfaces de usuário geradas por agentes sejam:
- **Seguras como dados** - São declarativas, não executáveis
- **Expressivas como código** - Permitem criação de UIs complexas e ricas

## 🎯 Por que A2UI?

A inteligência artificial generativa é excelente em criar texto e código, mas agentes frequentemente têm dificuldade em apresentar interfaces ricas e interativas aos usuários, especialmente quando esses agentes são remotos ou executam através de limites de confiança.

A2UI resolve esses desafios através de:

- **Segurança em Primeiro Lugar**: Formato declarativo de dados, não código executável
- **Amigável para LLMs**: Fácil para agentes gerarem progressivamente
- **Agnóstico a Framework**: Funciona com Flutter, Angular, Lit, React, etc.
- **Flexibilidade**: Suporta componentes personalizados e registros abertos

## 🚀 Começar Rápido

```bash
# Clone o repositório
git clone https://github.com/a2ui-project/a2ui.git
cd a2ui

# Configure sua chave API do Gemini
export GEMINI_API_KEY="sua_chave_api"

# Instale dependências e execute a demo
corepack enable
yarn install
cd samples/client/lit
yarn demo:restaurant
```

Para instruções mais detalhadas, veja o [Guia de Início Rápido](quickstart.md).

## 📚 Conteúdo da Documentação

### Para Iniciantes
- [O que é A2UI?](guias/o-que-e-a2ui.md) - Uma introdução clara ao protocolo
- [Conceitos Principais](guias/conceitos-principais.md) - Entenda os componentes principais
- [Arquitetura](guias/arquitetura.md) - Como A2UI funciona internamente

### Para Desenvolvedores
- [Protocolo v1.0](documentacao/protocolo-v1.0.md) - Especificação completa
- [Guia de Implementação](documentacao/guia-implementacao.md) - Como implementar um catálogo
- [Funções Personalizadas](documentacao/funcoes-personalizadas.md) - Adicione comportamentos customizados
- [Referência de Componentes](referencia/componentes.md) - Lista de todos os componentes

### Para Arquitetos
- [Guia de Evolução v0.9 → v1.0](documentacao/guia-evolucao.md) - Diferenças e caminhos de migração

## 💡 Casos de Uso

- **Coleta Dinâmica de Dados**: Um agente gera um formulário sob medida baseado no contexto da conversa
- **Sub-Agentes Remotos**: Um orquestrador delega uma tarefa a um agente especializado remoto que retorna uma UI
- **Fluxos Adaptativos**: Agentes corporativos que geram dashboards sob demanda

## 📊 Status

!!! note "Status do Projeto"
    - **Versão Estável**: v0.9.1
    - **Versão Candidata**: v1.0
    - **Status**: Prévia pública em estágio inicial

Esperamos mudanças enquanto colaboramos com a comunidade e integramos feedback.

## 🔗 Links Importantes

- **Repositório Original**: [github.com/a2ui-project/a2ui](https://github.com/a2ui-project/a2ui)
- **Demonstrações**: [A2UI Theater](https://a2ui-composer.ag-ui.com/theater)
- **Editor Visual**: [A2UI Composer](https://a2ui-project.github.io/composer/)
- **Especificação**: [a2ui.org](https://a2ui.org)

## 📄 Licença

A2UI é um projeto licenciado sob **Apache 2.0**. Cremos que o futuro da UI é agnóstico, e queremos trabalhar com você para ajudar a construí-lo.

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [Como Contribuir](contributing.md) para detalhes.

---

**Última atualização**: 15 de agosto de 2026
