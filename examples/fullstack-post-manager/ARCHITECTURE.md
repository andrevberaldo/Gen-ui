# Arquitetura - A2UI Fullstack Post Manager

Visão detalhada da arquitetura e fluxo de dados da aplicação.

## 🏗️ Arquitetura Geral

```
┌──────────────────────────────────────────────────────────────┐
│                      BROWSER/FRONTEND                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    React App                           │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │  App.jsx                                         │ │  │
│  │  │  - State (surfaces, activeData)                  │ │  │
│  │  │  - Handlers (handleSearch, handleAction)         │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │  useA2UI Hook                                    │ │  │
│  │  │  - processA2UIMessage()                          │ │  │
│  │  │  - updateComponents()                            │ │  │
│  │  │  - createSurface()                               │ │  │
│  │  │  - registerRendererFunction()                    │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │  A2UIRenderer.jsx                               │ │  │
│  │  │  - Renderiza componentes A2UI                    │ │  │
│  │  │  - Mapeia para Material UI                       │ │  │
│  │  │  - Resolve data binding (${/path})               │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │  Renderer Functions                             │ │  │
│  │  │  - validateEmail()                               │ │  │
│  │  │  - validatePostTitle()                           │ │  │
│  │  │  - validatePostBody()                            │ │  │
│  │  │  - formatDate()                                  │ │  │
│  │  │  - highlightText()                               │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  HTTP/JSON                                                  │
│  ↓                                                          │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ POST /api/agent/query
                          │ POST /api/agent/call-function
                          ↓
┌──────────────────────────────────────────────────────────────┐
│                    NODE.JS BACKEND                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Express Server (port 3001)                           │  │
│  │  - server.js                                          │  │
│  │  - Recebe queries do frontend                         │  │
│  │  - Chama runAgent()                                   │  │
│  │  - Retorna A2UI messages                              │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Langchain Agent                                      │  │
│  │  - agent.js                                           │  │
│  │  - initializeAgent()                                  │  │
│  │  - runAgent(query)                                    │  │
│  │  - generateA2UIFromResult()                           │  │
│  │  - Model: GPT-4                                       │  │
│  │  - Type: OpenAI Functions                             │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Agent Tools                                          │  │
│  │  - tools.js                                           │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ SearchPostsTool                                 │ │  │
│  │  │ - Busca post por ID                             │ │  │
│  │  │ - Retorna A2UI com card                          │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ UpdatePostTool                                  │ │  │
│  │  │ - Atualiza post                                 │ │  │
│  │  │ - Valida entrada                                │ │  │
│  │  │ - Retorna A2UI de sucesso                       │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ ValidateEmailTool                               │ │  │
│  │  │ ValidatePostTitleTool                           │ │  │
│  │  │ - Validação no agente                           │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  HTTPS                                                      │
│  ↓                                                          │
└──────────────────────────────────────────────────────────────┘
                          │
                          │ GET /posts/{id}
                          │ PUT /posts/{id}
                          │ GET /users/{id}
                          ↓
        ┌─────────────────────────────────┐
        │  JSONPlaceholder API            │
        │  https://jsonplaceholder...     │
        │                                 │
        │  - Mock REST API                │
        │  - 100 posts fictícios          │
        │  - Suporta CRUD                 │
        └─────────────────────────────────┘
```

## 📊 Fluxo de Dados

### 1. Requisição do Usuário

```
Usuário digita "5" e clica "Buscar"
         ↓
   Frontend recebe evento
         ↓
  Faz requisição HTTP
         ↓
POST /api/agent/query
{
  "query": "Busque o post com ID 5"
}
```

### 2. Processamento no Backend

```
Express recebe POST
         ↓
Extrai { query }
         ↓
Chama runAgent(query)
         ↓
Langchain Agent processa
         ↓
Analisa intenção do query
         ↓
Seleciona tool apropriada
         ↓
SearchPostsTool.invoke()
         ↓
Busca em JSONPlaceholder
         ↓
Retorna resultado
         ↓
Agent gera A2UI message
         ↓
Retorna para Frontend
```

### 3. Renderização no Frontend

```
Frontend recebe A2UI
         ↓
processA2UIMessage()
         ↓
createSurface("post-5")
updateDataModel("/post", {...})
updateComponents([...])
         ↓
Hook atualiza estado
         ↓
React re-renderiza
         ↓
A2UIRenderer mapeia componentes
         ↓
Material UI renderiza
         ↓
Usuário vê resultado visual
```

## 🔀 Mapeamento de Componentes

```
A2UI Component        → Material UI Component
──────────────────────────────────────────────
text                  → Typography
button                → Button
card                  → Card + CardHeader + CardContent
text-input            → TextField
loading               → CircularProgress + Box
alert                 → Alert
list                  → List + ListItem
container             → Box (flex)
```

## 🔗 Data Binding Resolution

```
Template A2UI:
{
  "content": "${/post/title}",
  "body": "${/post/body}",
  "author": "${/post/author}"
}

Data Model (activeData):
{
  "post": {
    "title": "sunt aut facere...",
    "body": "quia et suscipit...",
    "author": "Leanne Graham"
  }
}

Resolver:
${/post/title} → data["post"]["title"] → "sunt aut facere..."
${/post/body}  → data["post"]["body"]  → "quia et suscipit..."

Result:
{
  "content": "sunt aut facere...",
  "body": "quia et suscipit...",
  "author": "Leanne Graham"
}
```

## 🔄 Loop de Ações

```
User Interaction (clique em botão)
         ↓
A2UIRenderer detecta onClick
         ↓
Dispara onAction(action)
         ↓
  App.handleAction()
         ↓
  Faz nova requisição ao agente
         ↓
POST /api/agent/query
{
  "query": "Prepare formulário de edição para post 5"
}
         ↓
Agent gera novo A2UI
         ↓
Frontend renderiza novo estado
         ↓
Ciclo se repete
```

## 🛡️ Camadas de Validação

### 1. Renderer (Client-side)

```
Usuário digita título
         ↓
onChange event dispara
         ↓
Renderer chama validatePostTitle()
         ↓
Valida: length, caracteres, pattern
         ↓
Mostra mensagem de erro/sucesso
         ↓
Não permite submit se inválido
```

### 2. Agente (Server-side)

```
Agent recebe UpdatePostTool call
         ↓
Tool valida parâmetros
         ↓
Verifica: length, type, pattern
         ↓
Se inválido: retorna erro em A2UI
         ↓
Se válido: chama API JSONPlaceholder
```

### 3. API (External)

```
JSONPlaceholder recebe PUT
         ↓
Processa e retorna sucesso/erro
         ↓
Backend captura resposta
         ↓
Gera A2UI de sucesso/erro
```

## 📱 Estado da Aplicação

### Frontend State (useA2UI)

```javascript
{
  surfaces: {
    "post-5": {
      displayName: "Post #5",
      components: [...]
    },
    "form-editor": {
      displayName: "Editor",
      components: [...]
    }
  },
  activeData: {
    "post-5": {
      post: {
        id: 5,
        title: "...",
        body: "..."
      }
    },
    "form-editor": {
      form: {
        title: "",
        body: ""
      }
    }
  }
}
```

## 🔌 Integração de APIs

### JSONPlaceholder

```
SearchPostsTool
  ├─ GET /posts/{id}
  │  └─ Retorna post
  ├─ GET /users/{userId}
  │  └─ Retorna autor
  └─ Gera A2UI com dados

UpdatePostTool
  ├─ Valida entrada
  ├─ PUT /posts/{id}
  │  └─ Retorna post atualizado
  └─ Gera A2UI de sucesso
```

## 🎯 Decisões de Arquitetura

### Por que Langchain Deep Agent?
- Permite seleção automática de tools
- Suporta cadeia de raciocínio complexa
- Gera A2UI baseado em contexto
- Extensível com novos tools

### Por que Material UI?
- Componentes profissionais prontos
- Tema claro/escuro automático
- Responsivo por padrão
- Integrado com React

### Por que Dois Componentes de Validação?
- **Renderer**: feedback instantâneo, melhor UX
- **Agente**: segurança, validação no servidor
- Ambos necessários, não redundante

### Por que Data Binding?
- Templates dinâmicos reutilizáveis
- Desacoplamento entre layout e dados
- Resolve em tempo de renderização
- Suporta contexto de lista

## 🚀 Performance

### Otimizações Implementadas

1. **Renderização Incremental**
   - Apenas componentes modificados
   - Não re-renderiza tudo

2. **Data Binding Lazy**
   - Resolvido durante renderização
   - Não resolvido antecipadamente

3. **Component Merging**
   - Merge incremental no hook
   - Reutiliza componentes por ID

4. **State Management**
   - Separado por superfície
   - Não compartilha entre superfícies

## 🔐 Segurança

### Input Validation
- Cliente: validação em tempo real
- Servidor: validação antes de API
- API: validação própria

### XSS Prevention
- React sanitiza por padrão
- Sem innerHTML direto
- Templates compilados

### CORS
- Backend permite cross-origin
- Configurável por origem

---

**Próximos:** [Exemplos de Uso](./EXAMPLES.md) | [Catálogo](./CATALOG.md)
