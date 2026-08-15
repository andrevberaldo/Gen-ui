# Guia de Evolução: v0.9 → v1.0

Migração de A2UI v0.9 para v1.0 e as principais mudanças do protocolo.

## Visão Geral das Mudanças

A2UI v1.0 introduz várias melhorias importantes enquanto mantém compatibilidade parcial com v0.9.

| Aspecto | v0.9 | v1.0 |
|--------|------|------|
| **Chamadas de Função** | Unidirecional (renderer apenas) | Bidirecional |
| **Instanciação** | Separada (createSurface depois updateComponents) | Unificada (embutida em createSurface) |
| **Catálogos** | Object simples | JSON Schema support |
| **Validação** | Básica | Rigorosa |
| **Contexto** | Limitado | Expandido |

## Principais Mudanças Técnicas

### 1. Funções Bidirecionais

#### v0.9: Apenas Renderizador Chama Funções

```json
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [
      {
        "id": "input",
        "type": "text-input",
        "properties": {
          "onBlur": {
            "name": "validateEmail"
          }
        }
      }
    ]
  }
}
```

O renderizador executa:
```javascript
// Lado do renderizador
const result = await validateEmail(inputValue);
```

#### v1.0: Agente e Renderizador Chamam Funções

Agente chama função no renderizador:
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

Renderizador chama função no agente:
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

### 2. Instanciação em Mensagem Única

#### v0.9: Processo em Duas Etapas

```json
// Mensagem 1: Criar superfície
{
  "createSurface": {
    "surfaceId": "main"
  }
}

// Mensagem 2: Adicionar componentes
{
  "updateComponents": {
    "surfaceId": "main",
    "components": [...]
  }
}

// Mensagem 3: Adicionar dados
{
  "updateDataModel": {
    "surfaceId": "main",
    "path": "/user",
    "value": "João"
  }
}
```

#### v1.0: Processo Unificado

```json
{
  "createSurface": {
    "surfaceId": "main",
    "components": [
      {
        "id": "greeting",
        "type": "text",
        "properties": {
          "content": "${/user}"
        }
      }
    ],
    "dataModel": {
      "user": "João"
    }
  }
}
```

Mais eficiente, especialmente para agentes com streaming!

### 3. Definições de Catálogo Aprimoradas

#### v0.9: Catálogo Simples

```json
{
  "components": {
    "button": {
      "properties": {
        "label": "string"
      }
    }
  }
}
```

#### v1.0: Suporte a JSON Schema

```json
{
  "components": {
    "button": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "$id": "button.schema.json",
      "description": "Um botão clicável",
      "type": "object",
      "properties": {
        "label": {
          "type": "string",
          "minLength": 1,
          "description": "Texto do botão"
        },
        "disabled": {
          "type": "boolean",
          "description": "Desabilitar botão"
        }
      },
      "required": ["label"]
    }
  }
}
```

### 4. Identidades e Contexto Reservado

#### v0.9: Sem Reservas

```json
{
  "id": "@item",
  "type": "text"
}
```

#### v1.0: Namespace `@` Reservado

Identificadores especiais para contexto:

- `@index`: Índice na lista
- `@item`: Item atual
- `@parent`: Contexto pai
- `@root`: Raiz do contexto

```json
{
  "id": "my-item",  // OK
  "type": "text"
}

// Nomes permitidos:
{
  "itemTemplate": {
    "id": "item-${@index}",  // OK
    "properties": {
      "title": "${@item/name}"  // OK
    }
  }
}
```

### 5. Remoção de Propriedades de Tema

#### v0.9: Tema Rígido

```json
{
  "components": [{
    "id": "card",
    "type": "card",
    "properties": {
      "backgroundColor": "#ffffff",
      "borderColor": "#cccccc",
      "primaryColor": "#0066cc"
    }
  }]
}
```

#### v1.0: Sem Cores Rígidas

```json
{
  "components": [{
    "id": "card",
    "type": "card",
    "properties": {
      "variant": "elevated"
    }
  }]
}
```

O renderizador aplica seu próprio tema (Light/Dark mode, marca, etc.)!

## Guia de Migração

### Passo 1: Atualize o Catálogo

Adicione descrições e JSON Schema:

```json
// v0.9
{
  "button": {
    "properties": {
      "label": "string"
    }
  }
}

// v1.0
{
  "button": {
    "description": "Um botão clicável",
    "type": "object",
    "properties": {
      "label": {
        "type": "string",
        "description": "Texto do botão"
      }
    }
  }
}
```

### Passo 2: Combine Mensagens de Inicialização

```javascript
// v0.9
parser.parse({
  createSurface: { surfaceId: "main" }
});

parser.parse({
  updateComponents: {
    surfaceId: "main",
    components: [...]
  }
});

parser.parse({
  updateDataModel: {
    surfaceId: "main",
    path: "/user",
    value: "João"
  }
});

// v1.0
parser.parse({
  createSurface: {
    surfaceId: "main",
    components: [...],
    dataModel: {
      user: "João"
    }
  }
});
```

### Passo 3: Migre Funções

Adicione suporte a chamadas do agente:

```javascript
// v0.9: Apenas renderizador chama
const validateEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

// v1.0: Agente também chama
class FunctionRegistry {
  rendererFunctions = {
    validateEmail: (params) => {
      return /\S+@\S+\.\S+/.test(params.email);
    }
  };

  agentFunctions = {
    searchDatabase: (params) => {
      // Implementação no agente
    }
  };

  async callFunction(side, name, params) {
    if (side === 'renderer') {
      return this.rendererFunctions[name](params);
    } else {
      return this.agentFunctions[name](params);
    }
  }
}
```

### Passo 4: Atualize Identificadores

Evite usar `@` em IDs de componentes:

```javascript
// v0.9
{
  "id": "@my-component"  // Permitido
}

// v1.0
{
  "id": "my-component"  // Correto
}

// v1.0 - OK usar @ em contexto
{
  "itemTemplate": {
    "id": "item-${@index}"  // Correto
  }
}
```

### Passo 5: Remova Propriedades de Tema

```javascript
// v0.9
{
  "backgroundColor": "#ffffff",
  "textColor": "#000000"
}

// v1.0
{
  "variant": "elevated"
  // ou nenhuma propriedade de cor - deixe o renderizador decidir
}
```

## Matriz de Compatibilidade

### v0.9 → v1.0

| Recurso | v0.9 | v1.0 | Notas |
|---------|------|------|-------|
| createSurface | ✅ | ✅ | Suporta componentes e dados embutidos em v1.0 |
| updateComponents | ✅ | ✅ | Sem mudanças |
| updateDataModel | ✅ | ✅ | Sem mudanças |
| deleteSurface | ✅ | ✅ | Sem mudanças |
| callRendererFunction | ✅ | ✅ | Sem mudanças |
| callAgentFunction | ❌ | ✅ | Nova em v1.0 |
| Catálogos JSON Schema | ❌ | ✅ | Nova em v1.0 |
| Validação rigorosa | ❌ | ✅ | Aprimorada em v1.0 |

## Cronograma de Suporte

- **v0.9**: Stable (suporte por 12 meses)
- **v1.0**: Candidate (caminhar em direção à estabilidade)
- **Futura versão**: Possível deprecação de v0.9

## Exemplos Completos

### Aplicação Simples em v0.9

```json
// Mensagem 1
{
  "createSurface": {
    "surfaceId": "list"
  }
}

// Mensagem 2
{
  "updateDataModel": {
    "surfaceId": "list",
    "path": "/items",
    "value": [
      {"id": 1, "name": "Item 1"},
      {"id": 2, "name": "Item 2"}
    ]
  }
}

// Mensagem 3
{
  "updateComponents": {
    "surfaceId": "list",
    "components": [
      {
        "id": "list",
        "type": "list",
        "properties": {
          "items": "${/items}"
        }
      }
    ]
  }
}
```

### Mesma Aplicação em v1.0

```json
{
  "createSurface": {
    "surfaceId": "list",
    "components": [
      {
        "id": "list",
        "type": "list",
        "properties": {
          "items": "${/items}"
        }
      }
    ],
    "dataModel": {
      "items": [
        {"id": 1, "name": "Item 1"},
        {"id": 2, "name": "Item 2"}
      ]
    }
  }
}
```

## Perguntas Frequentes

### P: Devo migrar agora?
**R**: Se você está começando, use v1.0. Se tem código em v0.9, pode esperar até v1.0 ser estável (próximos meses).

### P: v1.0 é compatível com v0.9?
**R**: Parcialmente. v0.9 é compatível com v1.0, mas v1.0 novo recurso não funciona em v0.9.

### P: Como faço para reportar problemas de migração?
**R**: Abra uma [issue](https://github.com/a2ui-project/a2ui/issues) no GitHub!

## Recursos Adicionais

- 📖 [Protocolo v1.0 Completo](protocolo-v1.0.md)
- 🔧 [Guia de Implementação](guia-implementacao.md)
- 💬 [Discussões de Evolução](https://github.com/a2ui-project/a2ui/discussions)

---

Tem dúvidas sobre migração? Junte-se à conversa em [Discussões](https://github.com/a2ui-project/a2ui/discussions)!
