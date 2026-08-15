# A2UI Fullstack Post Manager

Um exemplo completo de uma aplicação fullstack usando **A2UI Protocol**, **Langchain Deep Agent**, **React** com **Material UI**, e integração com **JSONPlaceholder API**.

## 🎯 O que é Este Projeto?

Este projeto demonstra como implementar um sistema completo onde:

1. **Frontend React** renderiza componentes A2UI dinamicamente
2. **Agente Langchain** gera mensagens A2UI baseado em interações do usuário
3. **Catálogo A2UI** define componentes e funções permitidos
4. **Funções do Renderer** validam dados com lógica no client-side
5. **Funções do Agente** integram com APIs (JSONPlaceholder)

## 📁 Estrutura do Projeto

```
.
├── catalog.json                 # Catálogo A2UI com componentes e funções
├── agent/
│   ├── agent.js                 # Agente Langchain (Deep Agent)
│   └── tools.js                 # Ferramentas do agente (SearchPosts, UpdatePost, etc)
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Componente principal
│   │   ├── main.jsx             # Entry point
│   │   ├── components/
│   │   │   └── A2UIRenderer.jsx # Renderizador A2UI → Componentes React
│   │   ├── hooks/
│   │   │   └── useA2UI.js       # Hook para gerenciar estado A2UI
│   │   └── services/
│   │       └── renderer-functions.js # Funções do renderer (validações)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/
│   ├── server.js                # Servidor Express
│   ├── .env.example
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Chave OpenAI API (para o agente)

### 1. Setup Backend

```bash
cd backend
cp .env.example .env
# Edite .env e adicione sua OPENAI_API_KEY

npm install
npm run dev  # Inicia em http://localhost:3001
```

### 2. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev  # Inicia em http://localhost:5173
```

Acesse http://localhost:5173 no navegador.

## 📋 Catálogo (catalog.json)

Define os componentes e funções permitidas:

### Componentes
- `text` - Exibir texto
- `button` - Botões clicáveis
- `card` - Cards com conteúdo
- `text-input` - Campos de entrada
- `loading` - Indicador de carregamento
- `alert` - Alertas/notificações
- `list` - Listas de items
- `container` - Contêineres para layout

### Funções do Agente
- `searchPosts` - Buscar posts por ID
- `updatePost` - Atualizar post (mock)
- `validateEmail` - Validar email
- `validatePostTitle` - Validar título

## 🤖 Agente Langchain (agent/)

O agente é configurado como um **Deep Agent** com ferramentas:

### Tools Disponíveis

#### SearchPostsTool
```javascript
// Busca um post no JSONPlaceholder
await agent.invoke({
  input: "Busque o post com ID 1"
});

// Retorna A2UI com card mostrando o post
```

#### UpdatePostTool
```javascript
// Atualiza um post (mock)
// Valida automaticamente título (5-100 chars) e corpo (10+ chars)
```

#### ValidateEmailTool & ValidatePostTitleTool
```javascript
// Validação de entrada no lado do agente
```

## 🎨 Renderer React (frontend/src/)

### A2UIRenderer.jsx
Renderiza componentes A2UI para Material UI:

```jsx
<A2UIRenderer 
  component={{
    type: "button",
    properties: { label: "Clique-me", onClick: {...} }
  }}
  data={{ post: {...} }}
  onAction={(action) => console.log(action)}
/>
```

### useA2UI.js
Hook que gerencia o estado A2UI:

```javascript
const {
  surfaces,           // Superfícies criadas
  activeData,         // Dados por superfície
  processA2UIMessage, // Processa mensagens A2UI
  updateComponents,
  createSurface,
  deleteSurface,
  registerRendererFunction
} = useA2UI();
```

### Renderer Functions (services/renderer-functions.js)
Funções executadas no browser com validação:

```javascript
// Validação de email
validateEmail({ email: "user@example.com" })
// → { isValid: true, message: "Email válido ✓" }

// Validação de título
validatePostTitle({ title: "Meu Post" })
// → { isValid: true, issues: [] }

// Validação de corpo
validatePostBody({ body: "Conteúdo do post..." })
// → { isValid: true, issues: [] }
```

## 🔄 Fluxo Completo

### 1. Usuário Busca Post
```
Usuario digita "1" → Frontend envia query ao agente
```

### 2. Agente Processa
```
Agente recebe: "Busque o post com ID 1"
→ Executa SearchPostsTool
→ Fetch do JSONPlaceholder
→ Gera A2UI com card do post
```

### 3. Frontend Renderiza
```
Recebe A2UI: { createSurface, updateComponents, updateDataModel }
→ processA2UIMessage()
→ Renderiza componentes React com Material UI
```

### 4. Usuário Interage
```
Clica em "Editar Post"
→ onAction({ name: "openEditForm", context: { postId: 1 } })
→ Frontend chama agente novamente
→ Agente gera formulário de edição
```

### 5. Validação Renderer
```
Usuário digita título
→ Renderer chama validatePostTitle()
→ Valida: min 5 chars, max 100, caracteres válidos
→ Mostra mensagem de validação
```

## 📝 Exemplo de Mensagem A2UI

```json
{
  "createSurface": {
    "surfaceId": "post-1",
    "displayName": "Post #1"
  },
  "updateDataModel": {
    "surfaceId": "post-1",
    "path": "/post",
    "value": {
      "id": 1,
      "title": "sunt aut facere repellat...",
      "body": "quia et suscipit...",
      "author": "Leanne Graham"
    }
  },
  "updateComponents": {
    "surfaceId": "post-1",
    "components": [
      {
        "id": "post-title",
        "type": "text",
        "properties": {
          "content": "${/post/title}",
          "variant": "h3"
        }
      },
      {
        "id": "edit-btn",
        "type": "button",
        "properties": {
          "label": "Editar Post",
          "onClick": {
            "name": "openEditForm",
            "context": { "postId": 1 }
          }
        }
      }
    ]
  }
}
```

## 🔗 Integração de APIs

### JSONPlaceholder
- **GET** `/posts/{id}` - Buscar post
- **GET** `/users/{id}` - Buscar usuário
- **PUT** `/posts/{id}` - Atualizar post (mock)

Suporta 100 posts fictícios para testes.

## 🛡️ Validações

### Lado do Renderer (Browser)
- Email: regex pattern `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Título: 5-100 caracteres, caracteres válidos
- Corpo: min 10 caracteres, max 1000

### Lado do Agente (Server)
- Mesmas validações antes de chamar API
- Tratamento de erros
- Geração de componentes A2UI com mensagens de erro

## 🧪 Testando Localmente

### Buscar um post
1. Abra http://localhost:5173
2. Digite `1` no campo de busca
3. Clique "Buscar"
4. Veja o card do post aparecer

### Editar post
1. Clique no botão "Editar Post"
2. Agente gera formulário de edição
3. Preencha título e corpo
4. Sistema valida em tempo real no cliente

## 🚦 Variáveis de Ambiente

### Backend (.env)
```
OPENAI_API_KEY=sk-...  # Sua chave OpenAI
PORT=3001              # Porta do servidor
```

## 📚 Referências

- [A2UI Protocol v1.0](../../docs/documentacao/protocolo-v1.0.md)
- [Arquitetura A2UI](../../docs/guias/arquitetura.md)
- [Langchain Documentation](https://js.langchain.com/)
- [Material UI](https://mui.com/)
- [JSONPlaceholder](https://jsonplaceholder.typicode.com/)

## 🎓 O que Você Aprende

1. ✅ Como implementar um **renderizador A2UI em React**
2. ✅ Como criar um **agente Langchain com ferramentas**
3. ✅ Como **validar dados no renderer** (client-side)
4. ✅ Como **integrar APIs** com o agente
5. ✅ Como **estruturar um catálogo** A2UI
6. ✅ Como fazer **comunicação bidirecional agente ↔ renderer**

## 🤝 Contribuindo

Este é um exemplo educacional. Sinta-se livre para:
- Adicionar novos componentes A2UI
- Expandir as ferramentas do agente
- Melhorar as validações
- Adicionar mais integrações de API

## 📄 Licença

Apache 2.0

---

**Made with ❤️ using A2UI Protocol**
