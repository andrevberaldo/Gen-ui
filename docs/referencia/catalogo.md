# Catálogo de Referência A2UI

Estrutura e padrões para definição de catálogos em A2UI.

## O que é um Catálogo?

Um catálogo é um documento JSON que define:
- Quais componentes estão disponíveis
- Quais funções podem ser executadas
- As propriedades e tipos esperados

O catálogo funciona como um "contrato" entre agente e renderizador.

## Estrutura Base

```json
{
  "catalogs": {
    "default": {
      "components": { ... },
      "functions": { ... }
    }
  }
}
```

## Definição de Componentes

### Componente Mínimo

```json
{
  "button": {
    "description": "Um botão clicável"
  }
}
```

### Componente Completo

```json
{
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
      },
      "variant": {
        "type": "string",
        "enum": ["primary", "secondary", "outline", "ghost"],
        "description": "Estilo do botão"
      },
      "onPress": {
        "$ref": "#/definitions/action",
        "description": "Ação ao clicar"
      }
    },
    "required": ["label"]
  }
}
```

## Tipos de Dados Suportados

### Tipos Primitivos

```json
{
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "pattern": "^[a-zA-Z]+$"
    },
    "age": {
      "type": "number",
      "minimum": 0,
      "maximum": 150
    },
    "active": {
      "type": "boolean"
    },
    "value": {
      "type": "null"
    }
  }
}
```

### Arrays

```json
{
  "properties": {
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "minItems": 0,
      "maxItems": 10
    },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "name": {"type": "string"}
        }
      }
    }
  }
}
```

### Objetos

```json
{
  "properties": {
    "user": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "email": {"type": "string"},
        "age": {"type": "number"}
      },
      "required": ["name", "email"]
    }
  }
}
```

### Union Types

```json
{
  "properties": {
    "status": {
      "oneOf": [
        {"type": "string"},
        {"type": "number"}
      ]
    },
    "value": {
      "anyOf": [
        {"type": "string"},
        {"type": "null"}
      ]
    }
  }
}
```

## Definição de Funções

### Função Simples

```json
{
  "validateEmail": {
    "description": "Valida um endereço de email",
    "parameters": {
      "email": {
        "type": "string",
        "format": "email"
      }
    },
    "returns": {
      "type": "boolean"
    }
  }
}
```

### Função Complexa

```json
{
  "searchRestaurants": {
    "description": "Busca restaurantes com múltiplos critérios",
    "parameters": {
      "type": "object",
      "properties": {
        "cuisine": {
          "type": "string",
          "description": "Tipo de cozinha"
        },
        "location": {
          "type": "string",
          "description": "Localização"
        },
        "maxDistance": {
          "type": "number",
          "description": "Distância máxima em km"
        },
        "minRating": {
          "type": "number",
          "description": "Classificação mínima"
        }
      },
      "required": ["location"]
    },
    "returns": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "name": {"type": "string"},
          "rating": {"type": "number"},
          "distance": {"type": "number"}
        }
      }
    }
  }
}
```

## Exemplo Completo de Catálogo

```json
{
  "catalogs": {
    "default": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "$id": "a2ui-default-catalog.json",
      "title": "A2UI Catálogo Padrão",
      "description": "Catálogo padrão com componentes básicos",
      "components": {
        "button": {
          "type": "object",
          "description": "Um botão clicável",
          "properties": {
            "label": {
              "type": "string",
              "description": "Texto do botão"
            },
            "disabled": {
              "type": "boolean"
            },
            "variant": {
              "type": "string",
              "enum": ["primary", "secondary", "outline"]
            },
            "onPress": {
              "type": "object",
              "properties": {
                "name": {"type": "string"},
                "context": {"type": "object"}
              }
            }
          },
          "required": ["label"]
        },
        "text": {
          "type": "object",
          "description": "Texto simples",
          "properties": {
            "content": {
              "type": "string"
            },
            "style": {
              "type": "string",
              "enum": ["heading", "body", "caption"]
            }
          }
        },
        "text-input": {
          "type": "object",
          "description": "Campo de entrada de texto",
          "properties": {
            "label": {"type": "string"},
            "placeholder": {"type": "string"},
            "value": {"type": "string"},
            "disabled": {"type": "boolean"},
            "onChange": {"type": "object"}
          }
        },
        "list": {
          "type": "object",
          "description": "Uma lista de itens",
          "properties": {
            "items": {
              "type": "array",
              "description": "Items da lista"
            },
            "itemTemplate": {
              "type": "object",
              "description": "Template para renderizar cada item"
            }
          },
          "required": ["items"]
        }
      },
      "functions": {
        "validateEmail": {
          "description": "Valida um email",
          "parameters": {
            "email": {
              "type": "string"
            }
          },
          "returns": {
            "type": "boolean"
          }
        },
        "submitForm": {
          "description": "Envia formulário",
          "parameters": {
            "data": {
              "type": "object"
            }
          },
          "returns": {
            "type": "object",
            "properties": {
              "success": {"type": "boolean"},
              "message": {"type": "string"}
            }
          }
        }
      }
    },
    "advanced": {
      "description": "Catálogo avançado com componentes extra",
      "components": {
        "datepicker": {
          "type": "object",
          "description": "Seletor de data",
          "properties": {
            "label": {"type": "string"},
            "value": {"type": "string"},
            "min": {"type": "string"},
            "max": {"type": "string"},
            "onChange": {"type": "object"}
          }
        },
        "chart": {
          "type": "object",
          "description": "Gráfico de dados",
          "properties": {
            "type": {
              "type": "string",
              "enum": ["bar", "line", "pie"]
            },
            "data": {"type": "array"},
            "options": {"type": "object"}
          }
        }
      }
    }
  }
}
```

## Boas Práticas

### 1. Descrever Tudo Claramente

```json
{
  "button": {
    "description": "Um botão clicável para ações primárias ou secundárias",
    "properties": {
      "label": {
        "type": "string",
        "description": "O texto visível no botão",
        "minLength": 1
      }
    }
  }
}
```

### 2. Usar JSON Schema Standards

```json
{
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "description": "Um endereço de email válido"
    },
    "url": {
      "type": "string",
      "format": "uri",
      "description": "Uma URL válida"
    }
  }
}
```

### 3. Especificar Validações

```json
{
  "properties": {
    "age": {
      "type": "number",
      "minimum": 0,
      "maximum": 150,
      "description": "Idade entre 0 e 150"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "pattern": "^[a-zA-Z ]+$"
    }
  }
}
```

### 4. Documentar Retornos de Função

```json
{
  "searchProducts": {
    "description": "Busca produtos no catálogo",
    "parameters": { ... },
    "returns": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "name": {"type": "string"},
          "price": {"type": "number"}
        }
      }
    }
  }
}
```

## Extensão de Catálogos

### Herança de Catálogo

```json
{
  "catalogs": {
    "default": { ... },
    "extended": {
      "extends": "default",
      "components": {
        "custom-button": { ... }
      },
      "functions": {
        "customFunction": { ... }
      }
    }
  }
}
```

## Validação de Catálogo

Ao implementar, sempre validar:

1. **Componentes existem**: Todos os tipos referenciados são válidos
2. **Propriedades são conhecidas**: Não há propriedades desconhecidas
3. **Tipos correspondem**: Os valores têm o tipo correto
4. **Valores válidos**: Respeitam restrições (min, max, enum, etc.)

## Recursos Adicionais

- 📖 [Protocolo Completo](../documentacao/protocolo-v1.0.md)
- 🛠️ [Guia de Implementação](../documentacao/guia-implementacao.md)
- 📚 [Referência de Componentes](componentes.md)

---

Tem sugestões para melhorar os catálogos? Junte-se à conversa em [Discussões](https://github.com/a2ui-project/a2ui/discussions)!
