# Exemplos de A2UI

Exemplos práticos de código usando A2UI.

## Exemplo 1: Formulário de Contacto Simples

```json
{
  "createSurface": {
    "surfaceId": "contact-form",
    "displayName": "Formulário de Contato",
    "components": [
      {
        "id": "title",
        "type": "text",
        "properties": {
          "content": "Entre em Contato",
          "style": "heading"
        }
      },
      {
        "id": "name-input",
        "type": "text-input",
        "properties": {
          "label": "Seu Nome",
          "placeholder": "Digite seu nome",
          "onChange": {
            "name": "updateField",
            "context": {"field": "name"}
          }
        }
      },
      {
        "id": "email-input",
        "type": "text-input",
        "properties": {
          "label": "Seu Email",
          "placeholder": "seu@email.com",
          "onChange": {
            "name": "updateField",
            "context": {"field": "email"}
          }
        }
      },
      {
        "id": "submit-btn",
        "type": "button",
        "properties": {
          "label": "Enviar",
          "variant": "primary",
          "onPress": {
            "name": "submitForm"
          }
        }
      }
    ],
    "dataModel": {
      "form": {
        "name": "",
        "email": ""
      }
    }
  }
}
```

## Exemplo 2: Lista de Tarefas

```json
{
  "createSurface": {
    "surfaceId": "todo-list",
    "displayName": "Minhas Tarefas",
    "components": [
      {
        "id": "add-task",
        "type": "container",
        "properties": {
          "layout": "row",
          "spacing": 8,
          "children": [
            {
              "id": "task-input",
              "type": "text-input",
              "properties": {
                "placeholder": "Nova tarefa...",
                "onChange": {
                  "name": "updateNewTask"
                }
              }
            },
            {
              "id": "add-btn",
              "type": "button",
              "properties": {
                "label": "Adicionar",
                "onPress": {
                  "name": "addTask"
                }
              }
            }
          ]
        }
      },
      {
        "id": "tasks-list",
        "type": "list",
        "properties": {
          "items": "${/tasks}",
          "itemTemplate": {
            "type": "card",
            "properties": {
              "title": "${@item/title}",
              "children": [
                {
                  "type": "checkbox",
                  "properties": {
                    "label": "Marcar como concluído",
                    "checked": "${@item/completed}",
                    "onChange": {
                      "name": "toggleTask",
                      "context": {
                        "taskId": "${@item/id}"
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    ],
    "dataModel": {
      "tasks": [
        {"id": 1, "title": "Comprar leite", "completed": false},
        {"id": 2, "title": "Fazer exercício", "completed": true},
        {"id": 3, "title": "Estudar A2UI", "completed": false}
      ]
    }
  }
}
```

## Exemplo 3: Dashboard com Gráfico

```json
{
  "createSurface": {
    "surfaceId": "dashboard",
    "displayName": "Dashboard de Vendas",
    "components": [
      {
        "id": "header",
        "type": "text",
        "properties": {
          "content": "Dashboard de Vendas - Agosto 2025",
          "style": "heading"
        }
      },
      {
        "id": "metrics",
        "type": "container",
        "properties": {
          "layout": "row",
          "spacing": 16,
          "children": [
            {
              "id": "revenue-card",
              "type": "card",
              "properties": {
                "title": "Receita Total",
                "children": [
                  {
                    "type": "text",
                    "properties": {
                      "content": "R$ ${/metrics/revenue}",
                      "style": "heading"
                    }
                  }
                ]
              }
            },
            {
              "id": "sales-card",
              "type": "card",
              "properties": {
                "title": "Número de Vendas",
                "children": [
                  {
                    "type": "text",
                    "properties": {
                      "content": "${/metrics/salesCount}",
                      "style": "heading"
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      {
        "id": "chart",
        "type": "chart",
        "properties": {
          "type": "line",
          "data": "${/chartData}",
          "options": {
            "title": "Vendas ao Longo do Tempo",
            "xAxis": "Data",
            "yAxis": "Vendas"
          }
        }
      }
    ],
    "dataModel": {
      "metrics": {
        "revenue": "15000.00",
        "salesCount": 42
      },
      "chartData": [
        {"date": "01/08", "sales": 100},
        {"date": "02/08", "sales": 120},
        {"date": "03/08", "sales": 110},
        {"date": "04/08", "sales": 150}
      ]
    }
  }
}
```

## Exemplo 4: Busca de Restaurantes

```json
{
  "createSurface": {
    "surfaceId": "restaurant-search",
    "displayName": "Buscar Restaurantes",
    "components": [
      {
        "id": "search-container",
        "type": "container",
        "properties": {
          "layout": "column",
          "spacing": 16,
          "children": [
            {
              "id": "cuisine-input",
              "type": "text-input",
              "properties": {
                "label": "Tipo de Cozinha",
                "placeholder": "Ex: Italiana, Japonesa",
                "onChange": {
                  "name": "updateSearch"
                }
              }
            },
            {
              "id": "location-input",
              "type": "text-input",
              "properties": {
                "label": "Localização",
                "placeholder": "Ex: São Paulo",
                "onChange": {
                  "name": "updateSearch"
                }
              }
            },
            {
              "id": "search-btn",
              "type": "button",
              "properties": {
                "label": "Buscar",
                "variant": "primary",
                "onPress": {
                  "name": "searchRestaurants"
                }
              }
            }
          ]
        }
      },
      {
        "id": "results",
        "type": "list",
        "properties": {
          "items": "${/restaurants}",
          "itemTemplate": {
            "type": "card",
            "properties": {
              "title": "${@item/name}",
              "subtitle": "${@item/rating} ⭐ • ${@item/distance}km",
              "children": [
                {
                  "type": "text",
                  "properties": {
                    "content": "${@item/description}"
                  }
                },
                {
                  "type": "button",
                  "properties": {
                    "label": "Ver Detalhes",
                    "onPress": {
                      "name": "viewRestaurant",
                      "context": {
                        "restaurantId": "${@item/id}"
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    ],
    "dataModel": {
      "restaurants": []
    }
  }
}
```

## Exemplo 5: Comentários Incrementais (Streaming)

Este exemplo mostra como atualizar UI incrementalmente:

**Mensagem 1 - Criar Superfície**:
```json
{
  "createSurface": {
    "surfaceId": "chat",
    "displayName": "Conversa",
    "components": [
      {
        "id": "loading",
        "type": "loading",
        "properties": {
          "message": "Agente digitando..."
        }
      }
    ]
  }
}
```

**Mensagem 2 - Começar Resposta**:
```json
{
  "updateComponents": {
    "surfaceId": "chat",
    "components": [
      {
        "id": "response",
        "type": "text",
        "properties": {
          "content": "Olá! Bem-vindo ao A2UI."
        }
      }
    ]
  }
}
```

**Mensagem 3 - Atualizar com Mais Informações**:
```json
{
  "updateDataModel": {
    "surfaceId": "chat",
    "path": "/response",
    "value": "Olá! Bem-vindo ao A2UI. A2UI é um protocolo para gerar UIs a partir de agentes..."
  }
}
```

**Mensagem 4 - Adicionar Ações**:
```json
{
  "updateComponents": {
    "surfaceId": "chat",
    "components": [
      {
        "id": "actions",
        "type": "container",
        "properties": {
          "layout": "row",
          "children": [
            {
              "id": "learn-more-btn",
              "type": "button",
              "properties": {
                "label": "Aprender Mais",
                "onPress": {
                  "name": "learnMore"
                }
              }
            },
            {
              "id": "next-btn",
              "type": "button",
              "properties": {
                "label": "Próximo",
                "variant": "primary",
                "onPress": {
                  "name": "nextStep"
                }
              }
            }
          ]
        }
      }
    ]
  }
}
```

## Exemplo 6: Usando Funções Personalizadas

```json
{
  "createSurface": {
    "surfaceId": "email-signup",
    "displayName": "Cadastro",
    "components": [
      {
        "id": "email-input",
        "type": "text-input",
        "properties": {
          "label": "Email",
          "placeholder": "seu@email.com",
          "onChange": {
            "name": "validateEmailOnChange"
          }
        }
      },
      {
        "id": "email-status",
        "type": "text",
        "properties": {
          "content": "${/emailStatus}"
        }
      },
      {
        "id": "signup-btn",
        "type": "button",
        "properties": {
          "label": "Cadastrar",
          "disabled": "${/emailValid === false}",
          "onPress": {
            "name": "signup"
          }
        }
      }
    ],
    "dataModel": {
      "email": "",
      "emailValid": null,
      "emailStatus": ""
    }
  }
}
```

Quando o usuário digita, o agente chama a função de validação:

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

Renderizador responde:
```json
{
  "rendererFunctionResponse": {
    "functionName": "validateEmail",
    "result": true
  }
}
```

Agente atualiza UI:
```json
{
  "updateDataModel": {
    "surfaceId": "email-signup",
    "path": "/emailValid",
    "value": true
  },
  "updateDataModel": {
    "surfaceId": "email-signup",
    "path": "/emailStatus",
    "value": "✓ Email válido"
  }
}
```

## Recursos Adicionais

- 📖 [Referência de Componentes](componentes.md)
- 📚 [Protocolo Completo](../documentacao/protocolo-v1.0.md)
- 🎨 [Catálogo de Referência](catalogo.md)

---

Tem mais exemplos? Compartilhe em [Discussões](https://github.com/a2ui-project/a2ui/discussions)!
