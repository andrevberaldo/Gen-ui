# Guia de Início Rápido - A2UI

Neste guia, você aprenderá a configurar e executar um exemplo completo de A2UI em menos de 5 minutos.

## Pré-requisitos

Antes de começar, certifique-se de ter:

- **Node.js 18+** com [Corepack](https://nodejs.org/api/corepack.html) ativado
- **uv** - Gerenciador de pacotes Python
- **Chave API do Gemini** - Obtenha em [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### ⚠️ Usuários macOS Homebrew

Se você instalou gerenciadores de pacotes standalone anteriormente, desative-os antes de instalar o Corepack:

```bash
brew unlink yarn pnpm
brew install corepack
corepack enable
```

## Opção 1: Demo do Localizador de Restaurantes 🍜

A forma mais rápida de ver A2UI em ação com um agente Gemini e um renderizador Lit.

### Passos

1. **Clone o repositório:**
```bash
git clone https://github.com/a2ui-project/a2ui.git
cd a2ui
```

2. **Configure sua chave API:**
```bash
export GEMINI_API_KEY="sua_chave_api_do_gemini"
```

3. **Ative o Corepack e instale dependências:**
```bash
corepack enable
yarn install
```

4. **Navegue até o cliente Lit e execute a demo:**
```bash
cd samples/client/lit
yarn demo:restaurant
```

5. **Acesse a aplicação:**
Abra seu navegador em `http://localhost:5173`

A demo abrirá uma interface de chat onde você pode solicitar restaurantes. O agente Gemini gerará UIs ricas usando A2UI!

## Opção 2: Usar com Seu Framework Favorito ⚛️

Se você deseja usar A2UI com um framework ou harness específico:

```bash
npx create-ag-ui-app@latest
```

O CLI do AG-UI permitirá que você escolha seu framework (Google Chat, ADK, LangGraph, CrewAI, Slack, Teams, etc.) e então poderá integrar A2UI.

Para instruções passo a passo, veja o [Guia A2UI com Qualquer Framework](guias/arquitetura.md).

## Opção 3: Explore Visualmente 🎨

Sem necessidade de instalação, explore A2UI com ferramentas online:

### A2UI Theater
Passe por cenários pré-construídos de streaming de A2UI em renderers Lit, React e Angular:
→ [A2UI Theater](https://a2ui-composer.ag-ui.com/theater)

### A2UI Composer
Gere JSON de A2UI a partir de um editor visual e cole em prompts de agentes:
→ [A2UI Composer](https://a2ui-project.github.io/composer/)

## Próximos Passos

Depois de executar um exemplo, explore:

1. **Entenda o Protocolo**: Leia o [Protocolo v1.0](documentacao/protocolo-v1.0.md)
2. **Crie Componentes Personalizados**: Veja [Funções Personalizadas](documentacao/funcoes-personalizadas.md)
3. **Implemente um Catálogo**: Siga o [Guia de Implementação](documentacao/guia-implementacao.md)
4. **Explore Exemplos**: Confira [Exemplos de Código](referencia/exemplos.md)

## Solução de Problemas

### A porta 5173 já está em uso
```bash
# Use uma porta diferente
PORT=5174 yarn demo:restaurant
```

### Erro: "GEMINI_API_KEY não definida"
Certifique-se de que você executou:
```bash
export GEMINI_API_KEY="sua_chave_aqui"
```

### Problema de dependências
Se encontrar problemas ao instalar, tente:
```bash
yarn install --no-optional
```

## Recursos Adicionais

- 📖 [Documentação Completa](index.md)
- 🔍 [Referência de Componentes](referencia/componentes.md)
- 🎬 [Demonstrações Online](https://a2ui-composer.ag-ui.com/theater)
- 💬 [Discussões no GitHub](https://github.com/a2ui-project/a2ui/discussions)

---

Está preso? Abra uma issue em [github.com/a2ui-project/a2ui/issues](https://github.com/a2ui-project/a2ui/issues) ou junte-se à conversa em discussões!
