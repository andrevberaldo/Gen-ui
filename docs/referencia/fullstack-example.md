# Exemplo Fullstack Completo

Um exemplo de ponta a ponta implementando um gerenciador de posts usando **A2UI Protocol**, **Langchain Deep Agent**, **React** com **Material UI**.

## 📚 O que Você Aprenderá

Este exemplo demonstra:

✅ **Frontend React** renderizando A2UI dinamicamente  
✅ **Agente Langchain Deep Agent** gerando mensagens A2UI  
✅ **Catálogo A2UI** definindo componentes e funções  
✅ **Funções do Renderer** validando dados no cliente  
✅ **Funções do Agente** integrando com APIs  
✅ **Data Binding** com JSON Pointers  
✅ **Validação Dupla** (client + server)  

## 🗂️ Estrutura

```
examples/fullstack-post-manager/
├── README.md                    # Quick start
├── ARCHITECTURE.md              # Arquitetura e fluxo
├── CATALOG.md                   # Referência de componentes
├── EXAMPLES.md                  # Exemplos práticos passo-a-passo
├── DEEP_AGENT_GUIDE.md         # Guia Deep Agent Langchain
├── EXTENDING_TOOLS.md          # Como adicionar novas ferramentas
├── catalog.json                # Catálogo A2UI
├── agent/
│   ├── agent.js                # Deep Agent com createOpenAIFunctionsAgent
│   └── tools.js                # SearchPosts, UpdatePost, Validações
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/A2UIRenderer.jsx
│   │   ├── hooks/useA2UI.js
│   │   └── services/renderer-functions.js
│   └── package.json
└── backend/
    ├── server.js               # Express + agent integration
    └── package.json
```

## 🚀 Quick Start

### Setup Backend

```bash
cd examples/fullstack-post-manager/backend
cp .env.example .env
# Edite .env e adicione OPENAI_API_KEY

npm install
npm run dev  # Roda em http://localhost:3001
```

### Setup Frontend

```bash
cd examples/fullstack-post-manager/frontend
npm install
npm run dev  # Roda em http://localhost:5173
```

Abra http://localhost:5173 no navegador e comece a usar!

## 📋 Funcionalidades

### Buscar Posts
```
Usuário digita ID e clica Buscar
→ Agente executa SearchPostsTool
→ Frontend renderiza post com Material UI
```

### Editar Posts
```
Clica "Editar Post"
→ Renderer valida título e corpo em tempo real
→ Agente valida no servidor
→ API atualiza post
→ Sucesso renderizado
```

### Validações
- **Client**: Email, título, corpo (feedback instantâneo)
- **Server**: Mesmo validação (segurança)
- **API**: Validação própria

## 🤖 Deep Agent Langchain

O agente usa `createOpenAIFunctionsAgent`:

```javascript
// agent/agent.js
const agent = await createOpenAIFunctionsAgent({
  llm: ChatOpenAI({ model: "gpt-4-turbo-preview" }),
  tools: [SearchPostsTool, UpdatePostTool, ...],
  systemPrompt: "Gere interfaces A2UI..."
});

const executor = new AgentExecutor({
  agent,
  tools,
  maxIterations: 10,
  verbose: true
});
```

**Fluxo:**
1. Usuário envia query
2. LLM analisa e seleciona ferramenta
3. Executa tool (SearchPosts, UpdatePost, etc)
4. Tool retorna A2UI JSON
5. Frontend renderiza resultado

Veja [DEEP_AGENT_GUIDE.md](/examples/fullstack-post-manager/DEEP_AGENT_GUIDE.md) para detalhes.

## 📦 Catálogo A2UI

Define componentes:
- `text` - Exibir texto
- `button` - Botões clicáveis
- `card` - Cards com conteúdo
- `text-input` - Campos de entrada
- `loading` - Indicador de carregamento
- `alert` - Alertas
- `list` - Listas
- `container` - Layout

Define funções:
- **Agente**: searchPosts, updatePost, validateEmail, validatePostTitle
- **Renderer**: validateEmail, validatePostTitle, validatePostBody, formatDate, highlightText

Veja [CATALOG.md](/examples/fullstack-post-manager/CATALOG.md) para referência completa.

## 🎨 A2UI Renderer React

O `A2UIRenderer.jsx` mapeia componentes A2UI para Material UI:

```jsx
<A2UIRenderer 
  component={{
    type: "button",
    properties: { 
      label: "Clique-me",
      onClick: { name: "myAction", context: {} }
    }
  }}
  data={{ user: { name: "João" } }}
  onAction={handleAction}
/>
```

**Suporta:**
- Data Binding: `${/path/to/value}`
- Context em listas: `${@item}`, `${@index}`
- Material UI theming

## 🔗 Integração com APIs

### JSONPlaceholder
- GET `/posts/{id}` - Buscar post
- PUT `/posts/{id}` - Atualizar post
- GET `/users/{id}` - Buscar usuário

Mock gratuito para testes com 100 posts fictícios.

## 💾 Data Model

```javascript
{
  "post-5": {
    "post": {
      "id": 5,
      "title": "sunt aut facere...",
      "body": "quia et suscipit...",
      "author": "Chelsey Dietrich",
      "authorEmail": "user@example.com"
    }
  }
}
```

Acesso via: `${/post/title}`, `${/post/author}`, etc.

## 📚 Documentação Completa

| Arquivo | Descrição |
|---------|-----------|
| **README.md** | Overview, setup, features |
| **ARCHITECTURE.md** | Fluxo de dados, estado, performance |
| **CATALOG.md** | Componentes, funções, exemplos |
| **EXAMPLES.md** | 5 exemplos práticos passo-a-passo |
| **DEEP_AGENT_GUIDE.md** | Langchain Deep Agent em detalhes |
| **EXTENDING_TOOLS.md** | Como adicionar novas tools |

## 🎓 Próximas Etapas

### Fácil
1. Rodar o exemplo localmente
2. Buscar alguns posts
3. Editar um post
4. Ver validações em tempo real

### Intermediário
1. Adicionar uma nova tool (ex: ListPostsTool)
2. Estender validações do renderer
3. Adicionar novo componente A2UI

### Avançado
1. Integrar com banco de dados real
2. Adicionar autenticação
3. Deploy em produção
4. Performance tuning

## 🔗 Links

- [Documentação A2UI Protocol](./protocolo-v1.0.md)
- [Guias Arquitetura](../guias/arquitetura.md)
- [Langchain JS Docs](https://js.langchain.com/)
- [Material UI](https://mui.com/)

## 📂 Arquivo Local

O exemplo completo está em:

```
./examples/fullstack-post-manager/
```

Clone o repositório e navegue para lá!

## 🤝 Contribuindo

Este é um exemplo educacional. Sugestões:
- Novos componentes A2UI
- Mais ferramentas do agente
- Melhor validação
- Integração com outras APIs

---

**Criado**: 2024  
**Versão A2UI**: v1.0  
**Stack**: React 18 + Material UI 5 + Langchain v0.1.24+ + Express
