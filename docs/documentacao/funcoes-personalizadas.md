# Funções Personalizadas em A2UI

Guia completo para definir e usar funções personalizadas em A2UI v1.0.

## Visão Geral

Funções personalizadas permitem que agentes e renderizadores comuniquem comportamentos complexos além de renderização simples de componentes.

Existem dois tipos de funções em A2UI v1.0:

1. **Funções do Renderizador**: Executadas no lado do cliente
2. **Funções do Agente**: Executadas no lado do agente

## Estrutura de Função

### Definição de Função no Catálogo

```json
{
  "catalogs": {
    "default": {
      "functions": {
        "validateEmail": {
          "description": "Valida um endereço de email",
          "parameters": {
            "email": {
              "type": "string",
              "description": "Email a validar"
            }
          },
          "returns": {
            "type": "boolean",
            "description": "true se válido, false caso contrário"
          }
        }
      }
    }
  }
}
```

### Campos Obrigatórios

- **description**: Descrição em linguagem natural (ajuda LLMs)
- **parameters**: Objeto com definição de parâmetros
- **returns** (opcional): Tipo de retorno esperado

### Definição de Parâmetros

```json
{
  "parameters": {
    "name": {
      "type": "string",
      "description": "Nome do parâmetro"
    },
    "age": {
      "type": "number",
      "description": "Idade"
    },
    "tags": {
      "type": "array",
      "description": "Lista de tags",
      "items": {
        "type": "string"
      }
    }
  }
}
```

## Funções do Renderizador

Funções executadas no lado do cliente (navegador, Flutter, etc.).

### Exemplo: Validação de Email

**Catálogo**:
```json
{
  "functions": {
    "validateEmail": {
      "description": "Valida um endereço de email",
      "parameters": {
        "email": {"type": "string"}
      },
      "returns": {"type": "boolean"}
    }
  }
}
```

**Implementação em JavaScript**:
```javascript
class RendererFunctions {
  validateEmail(params) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(params.email);
  }
}
```

**Agente Chamando**:
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

**Renderizador Responde**:
```json
{
  "rendererFunctionResponse": {
    "functionName": "validateEmail",
    "result": true
  }
}
```

## Funções do Agente

Funções executadas no lado do agente.

### Exemplo: Buscar no Banco de Dados

**Catálogo**:
```json
{
  "functions": {
    "searchRestaurants": {
      "description": "Busca restaurantes no banco de dados",
      "parameters": {
        "cuisine": {"type": "string"},
        "location": {"type": "string"},
        "maxDistance": {"type": "number"}
      },
      "returns": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": {"type": "string"},
            "name": {"type": "string"},
            "rating": {"type": "number"}
          }
        }
      }
    }
  }
}
```

**Implementação em Python**:
```python
class AgentFunctions:
    def search_restaurants(self, params):
        cuisine = params.get('cuisine')
        location = params.get('location')
        
        # Lógica de busca
        results = database.query(
            cuisine=cuisine,
            location=location
        )
        return results
```

**Renderizador Chamando**:
```json
{
  "callAgentFunction": {
    "functionName": "searchRestaurants",
    "parameters": {
      "cuisine": "Indianos",
      "location": "São Paulo"
    }
  }
}
```

**Agente Responde**:
```json
{
  "agentFunctionResponse": {
    "functionName": "searchRestaurants",
    "result": [
      {"id": 1, "name": "Taj Mahal", "rating": 4.8},
      {"id": 2, "name": "Curry House", "rating": 4.5}
    ]
  }
}
```

## Tipos Suportados

### Tipos Primitivos

- **string**: Texto
- **number**: Números (inteiro ou float)
- **boolean**: true/false
- **null**: Valor nulo

### Tipos Complexos

- **array**: Lista de valores
- **object**: Objeto estruturado
- **union**: Um de vários tipos

### Exemplo de Tipos Complexos

```json
{
  "parameters": {
    "user": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "email": {"type": "string"},
        "age": {"type": "number"}
      }
    },
    "tags": {
      "type": "array",
      "items": {"type": "string"}
    },
    "status": {
      "type": "union",
      "types": [
        {"type": "literal", "value": "active"},
        {"type": "literal", "value": "inactive"}
      ]
    }
  }
}
```

## Fluxo Completo: Exemplo Prático

### Cenário: Sistema de Reserva de Restaurante

#### 1. Usuário Digita Email

```
"Quero reservar uma mesa com meu email verificado"
```

#### 2. Agente Solicita Validação

```json
{
  "updateComponents": {
    "surfaceId": "booking",
    "components": [
      {
        "id": "email-input",
        "type": "text-input",
        "properties": {
          "label": "Email",
          "placeholder": "seu@email.com",
          "onChange": {
            "name": "validateEmail",
            "callRenderer": true
          }
        }
      }
    ]
  }
}
```

#### 3. Usuário Digita Email

Renderizador Envia:
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

#### 4. Renderizador Valida

```json
{
  "rendererFunctionResponse": {
    "functionName": "validateEmail",
    "result": true
  }
}
```

#### 5. Agente Processa Confirmação

```json
{
  "updateComponents": {
    "surfaceId": "booking",
    "components": [
      {
        "id": "email-status",
        "type": "text",
        "properties": {
          "content": "✓ Email válido",
          "style": "success"
        }
      }
    ]
  }
}
```

#### 6. Usuário Solicita Reserva

Renderizador:
```json
{
  "callAgentFunction": {
    "functionName": "makeReservation",
    "parameters": {
      "email": "user@example.com",
      "restaurant_id": 1,
      "date": "2025-08-20",
      "time": "19:30",
      "guests": 2
    }
  }
}
```

#### 7. Agente Processa

```json
{
  "agentFunctionResponse": {
    "functionName": "makeReservation",
    "result": {
      "confirmation_id": "RES-12345",
      "status": "confirmed"
    }
  }
}
```

#### 8. Renderizador Mostra Confirmação

```json
{
  "updateComponents": {
    "surfaceId": "booking",
    "components": [
      {
        "id": "confirmation",
        "type": "card",
        "properties": {
          "title": "Reserva Confirmada! ✓",
          "content": "Confirmação: RES-12345"
        }
      }
    ]
  }
}
```

## Tratamento de Erros

### Estrutura de Erro

```json
{
  "rendererFunctionResponse": {
    "functionName": "validateEmail",
    "error": {
      "code": "INVALID_EMAIL",
      "message": "Email inválido"
    }
  }
}
```

### Exemplo: Falha na Busca

```json
{
  "agentFunctionResponse": {
    "functionName": "searchRestaurants",
    "error": {
      "code": "DATABASE_ERROR",
      "message": "Falha ao conectar ao banco de dados"
    }
  }
}
```

## Boas Práticas

### Para Agentes

1. **Sempre Validar**: Validar parâmetros antes de chamar
2. **Fornecer Contexto**: Passar informações suficientes nas chamadas
3. **Tratar Erros**: Lidar com respostas de erro graciosamente
4. **Documentar**: Descrever claramente cada função no catálogo

### Para Renderizadores

1. **Implementar Completamente**: Implementar todas as funções do catálogo
2. **Validar Tipos**: Verificar tipos de parâmetros
3. **Fornecer Feedback**: Retornar erros claros em caso de falha
4. **Otimizar**: Executar funções eficientemente (sem bloqueios)

## Exemplo Avançado: Integração com APIs

### Catálogo

```json
{
  "functions": {
    "fetchWeather": {
      "description": "Obtém previsão do tempo para uma localização",
      "parameters": {
        "location": {"type": "string"},
        "units": {
          "type": "string",
          "enum": ["celsius", "fahrenheit"]
        }
      },
      "returns": {
        "type": "object",
        "properties": {
          "temp": {"type": "number"},
          "condition": {"type": "string"},
          "humidity": {"type": "number"}
        }
      }
    }
  }
}
```

### Implementação (Python com API externa)

```python
import requests

class AgentFunctions:
    def fetch_weather(self, params):
        location = params.get('location')
        units = params.get('units', 'celsius')
        
        try:
            response = requests.get(
                f'https://api.weather.service/forecast',
                params={'location': location, 'units': units}
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            return {
                'error': {
                    'code': 'API_ERROR',
                    'message': str(e)
                }
            }
```

### Uso no Agente

```json
{
  "callAgentFunction": {
    "functionName": "fetchWeather",
    "parameters": {
      "location": "São Paulo",
      "units": "celsius"
    }
  }
}
```

## Recursos Adicionais

- 📖 [Protocolo v1.0](protocolo-v1.0.md)
- 🛠️ [Guia de Implementação](guia-implementacao.md)
- 💻 [Exemplos de Código](../referencia/exemplos.md)

---

Tem dúvidas sobre funções personalizadas? Junte-se à conversa em [Discussões](https://github.com/a2ui-project/a2ui/discussions)!
