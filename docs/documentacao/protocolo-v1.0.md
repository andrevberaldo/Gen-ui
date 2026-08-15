# Protocolo A2UI v1.0 - Especificação Completa

## Visão Geral

O Protocolo A2UI v1.0 é uma especificação para um protocolo de UI baseado em JSON que permite comunicação unidirecional entre agentes e renderizadores.

**Versão**: 1.0  
**Status**: Candidate  
**Data de Criação**: 20 de novembro de 2024  
**Última Atualização**: 8 de junho de 2025

## Introdução

O Protocolo A2UI é projetado para renderizar dinamicamente interfaces de usuário a partir de um fluxo de objetos JSON enviados por um agente.

A comunicação ocorre através de um fluxo de objetos JSON. O renderizador analisa cada objeto como uma mensagem distinta e constrói ou atualiza a UI incrementalmente.

O protocolo agente-renderizador define quatro tipos de mensagem principais:

### Tipos de Mensagem

#### `createSurface`
Sinaliza ao renderizador criar uma nova superfície e começar a renderizá-la.

```json
{
  "createSurface": {
    "surfaceId": "main",
    "displayName": "Interface Principal",
    "catalog": "default"
  }
}
```

#### `updateComponents`
Fornece uma lista de definições de componentes para serem adicionadas ou atualizadas em uma superfície específica.

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "button-1",
        "type": "button",
        "properties": {
          "label": "Clique-me"
        }
      }
    ]
  }
}
```

#### `updateDataModel`
Fornece novos dados a serem inseridos ou substituídos no modelo de dados de uma superfície.

```json
{
  "updateDataModel": {
    "surfaceId": "main",
    "path": "/user/name",
    "value": "João Silva"
  }
}
```

#### `deleteSurface`
Remove explicitamente uma superfície e seu conteúdo da UI.

```json
{
  "deleteSurface": {
    "surfaceId": "main"
  }
}
```

## Estrutura de Mensagens

### Envelope Genérico

```json
{
  "createSurface": {...} | null,
  "updateComponents": {...} | null,
  "updateDataModel": {...} | null,
  "deleteSurface": {...} | null,
  "callRendererFunction": {...} | null,
  "callAgentFunction": {...} | null
}
```

Cada mensagem é um objeto JSON com uma ou mais propriedades acima.

### Superfícies

Uma superfície é um espaço isolado onde componentes são renderizados.

```json
{
  "surfaceId": "string (obrigatório)",
  "displayName": "string (opcional)",
  "catalog": "string (opcional, padrão: 'default')"
}
```

### Componentes

Um componente descreve um elemento de UI renderizável.

```json
{
  "id": "string (obrigatório)",
  "type": "string (obrigatório)",
  "properties": {
    "key": "value ou ${/path/para/dado}"
  },
  "children": [...]
}
```

#### Propriedades Especiais

- **Ligação de Dados**: Propriedades podem referenciar dados usando `${/path}`
- **Context**: Propriedades podem acessar contexto com `${@index}`, `${@item}`, etc.

### Modelo de Dados

Estrutura JSON que armazena valores para ligação dinâmica.

```json
{
  "surfaceId": "string",
  "path": "string (JSON Pointer)",
  "value": "any"
}
```

## Validação e Catálogos

O renderizador valida mensagens contra um catálogo de componentes permitidos.

### Estrutura de Catálogo

```json
{
  "catalogs": {
    "default": {
      "components": {
        "button": {
          "description": "Um botão clicável",
          "properties": {
            "label": {
              "type": "string",
              "description": "Texto do botão"
            },
            "disabled": {
              "type": "boolean",
              "description": "Desabilitar botão"
            }
          }
        }
      },
      "functions": {
        "submitForm": {
          "description": "Enviar formulário",
          "parameters": {
            "data": {"type": "object"}
          }
        }
      }
    }
  }
}
```

## Ações

Quando um usuário interage com um componente, o renderizador envia uma ação.

```json
{
  "action": {
    "name": "string",
    "context": {
      "key": "value"
    },
    "timestamp": "ISO 8601 string (opcional)"
  }
}
```

## Funções Personalizadas

A2UI v1.0 introduz suporte para funções bidirecionais.

### callRendererFunction
Agente solicita ao renderizador executar uma função.

```json
{
  "callRendererFunction": {
    "functionName": "validateEmail",
    "parameters": {
      "email": "user@example.com"
    }
  }
}
```

### callAgentFunction
Renderizador solicita ao agente executar uma função.

```json
{
  "callAgentFunction": {
    "functionName": "searchDatabase",
    "parameters": {
      "query": "pizza"
    }
  }
}
```

### Respostas

```json
{
  "rendererFunctionResponse": {
    "functionName": "validateEmail",
    "result": true
  }
}
```

```json
{
  "agentFunctionResponse": {
    "functionName": "searchDatabase",
    "result": [...]
  }
}
```

## Fluxo Completo de Exemplo

### 1. Criar Superfície

Agente envia:
```json
{
  "createSurface": {
    "surfaceId": "search-results",
    "displayName": "Resultados da Busca"
  }
}
```

### 2. Atualizar Dados

Agente envia:
```json
{
  "updateDataModel": {
    "surfaceId": "search-results",
    "path": "/query",
    "value": "restaurantes indianos"
  },
  "updateDataModel": {
    "surfaceId": "search-results",
    "path": "/results",
    "value": [
      {"id": 1, "name": "Taj Mahal", "rating": 4.8},
      {"id": 2, "name": "Curry House", "rating": 4.5}
    ]
  }
}
```

### 3. Adicionar Componentes

Agente envia:
```json
{
  "updateComponents": {
    "surfaceId": "search-results",
    "components": [
      {
        "id": "title",
        "type": "text",
        "properties": {
          "content": "Resultados: ${/query}"
        }
      },
      {
        "id": "results-list",
        "type": "list",
        "properties": {
          "items": "${/results}",
          "itemTemplate": {
            "type": "card",
            "properties": {
              "title": "${@item/name}",
              "subtitle": "${@item/rating} ⭐"
            }
          }
        }
      }
    ]
  }
}
```

### 4. Usuário Interage

Renderizador envia:
```json
{
  "action": {
    "name": "selectResult",
    "context": {"id": 1},
    "timestamp": "2025-08-15T10:30:00Z"
  }
}
```

### 5. Atualizar UI

Agente responde:
```json
{
  "updateComponents": {
    "surfaceId": "search-results",
    "components": [
      {
        "id": "selected-card",
        "type": "card",
        "properties": {
          "title": "Taj Mahal - Selecionado"
        }
      }
    ]
  }
}
```

## Regras de Validação

### Identificadores
- Devem ser únicos dentro de uma superfície
- Devem seguir Unicode UAX #31
- Caracteres especiais reservados: `@` (contexto de sistema)

### Caminhos de Dados
Usam JSON Pointer format:
- `/user/name` → `data.user.name`
- `/items/0/name` → `data.items[0].name`

### Tipos de Dados Suportados
- `string`
- `number`
- `boolean`
- `array`
- `object`
- `null`

## Diferenças de v0.9 para v1.0

### Principais Mudanças

1. **Chamadas de Função Bidirecionais**
   - v0.9: Apenas renderizador pode chamar funções
   - v1.0: Ambos agente e renderizador podem chamar funções

2. **Instanciação em Mensagem Única**
   - v1.0 permite passar componentes e dados em `createSurface`

3. **Catálogos Aprimorados**
   - Suporte a JSON Schema metadata
   - Definições de função como object maps

4. **Segurança Aprimorada**
   - Validação de tipos mais rigorosa
   - Isolamento de contexto melhorado

## Contratos de Transporte

Enquanto A2UI é agnóstico a transporte, ele define contratos que qualquer transporte deve cumprir:

1. **Entrega Confiável**: Mensagens entregues em ordem
2. **Delimitação**: Cada mensagem claramente demarcada
3. **Metadados**: Suporte para associar metadados
4. **Bidirecionalidade**: Canais Agente→Renderizador e Renderizador→Agente

### Transporte A2A (Agent-to-Agent)

```
Mensagem A2UI → A2A Wrapper → Transporte → A2A Unwrap → Renderizador
```

### Transporte AG-UI

```
AG-UI SDK → A2UI JSON → Renderizador
```

## Boas Práticas

### Agente

1. **Enviar Incrementalmente**: Não envie todos os componentes de uma vez
2. **Usar Ligação de Dados**: Prefira `${/path}` ao hardcoding
3. **Validar contra Catálogo**: Verificar disponibilidade antes de usar
4. **Tratar Erros**: Responder a falhas de renderização

### Renderizador

1. **Validar Sempre**: Verificar contra catálogo antes de renderizar
2. **Atualizar Incrementalmente**: Não re-renderizar tudo
3. **Manter Estado**: Rastrear atual estado de UI e dados
4. **Reportar Erros**: Informar agente de problemas

## Exemplo Completo: Aplicativo de Tarefas

### 1. Inicializar

Agente:
```json
{
  "createSurface": {
    "surfaceId": "tasks",
    "displayName": "Minha Lista de Tarefas"
  }
}
```

### 2. Carregar Dados

Agente:
```json
{
  "updateDataModel": {
    "surfaceId": "tasks",
    "path": "/items",
    "value": [
      {"id": 1, "title": "Comprar leite", "done": false},
      {"id": 2, "title": "Fazer exercício", "done": true},
      {"id": 3, "title": "Estudar A2UI", "done": false}
    ]
  }
}
```

### 3. Renderizar

Agente:
```json
{
  "updateComponents": {
    "surfaceId": "tasks",
    "components": [
      {
        "id": "list",
        "type": "list",
        "properties": {
          "items": "${/items}",
          "itemTemplate": {
            "type": "checkbox",
            "properties": {
              "label": "${@item/title}",
              "checked": "${@item/done}",
              "onChange": {
                "name": "toggleTask",
                "context": {"id": "${@item/id}"}
              }
            }
          }
        }
      }
    ]
  }
}
```

### 4. Usuário Marca Tarefa

Renderizador:
```json
{
  "action": {
    "name": "toggleTask",
    "context": {"id": 3}
  }
}
```

### 5. Agente Atualiza

Agente:
```json
{
  "updateDataModel": {
    "surfaceId": "tasks",
    "path": "/items/2/done",
    "value": true
  }
}
```

Renderizador atualiza apenas o terceiro item, sem re-renderizar tudo!

## Recursos Adicionais

- 📖 [Guia de Funções Personalizadas](funcoes-personalizadas.md)
- 🔍 [Guia de Implementação](guia-implementacao.md)
- 📚 [Comparação v0.9 vs v1.0](guia-evolucao.md)

---

Para dúvidas ou feedback sobre a especificação, abra uma [issue](https://github.com/a2ui-project/a2ui/issues) ou [discussão](https://github.com/a2ui-project/a2ui/discussions)!
