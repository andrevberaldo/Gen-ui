# Configuração do GitHub Pages

Se você ainda está vendo erro 404, siga estes passos para configurar corretamente:

## Passo 1: Acessar Configurações do Repositório

1. Vá para: `https://github.com/andrevberaldo/Gen-ui/settings`
2. Clique em **"Pages"** no menu esquerdo (em baixo de "Code and automation")

## Passo 2: Configurar Source

Na seção "Build and deployment":

1. **Source**: Selecione **"Deploy from a branch"**
2. **Branch**: Selecione **`gh-pages`** 
3. **Folder**: Deixe como **`/ (root)`**

## Passo 3: Salvar

Clique em "Save"

## Resultado Esperado

Você deverá ver uma mensagem verde dizendo:
```
✅ Your site is published at https://andrevberaldo.github.io/Gen-ui/
```

## Se ainda não funcionar

1. Aguarde 1-2 minutos para o GitHub Pages processar
2. Tente abrir em uma aba incógnita/privada (para limpar cache)
3. Verifique se o workflow foi bem-sucedido em: 
   `https://github.com/andrevberaldo/Gen-ui/actions`

## Verificar se a branch gh-pages existe

No seu repositório, vá para a aba "Branches" e procure por `gh-pages`. 
Se existir, ótimo! Se não, o workflow criará quando for executado.

## Testar Localmente

Para testar a documentação localmente:

```bash
# Instale dependências
pip install -r requirements.txt

# Serve a documentação
mkdocs serve

# Abra http://localhost:8000
```

## URLs Esperadas

- **Documentação**: `https://andrevberaldo.github.io/Gen-ui/`
- **GitHub Pages Settings**: `https://github.com/andrevberaldo/Gen-ui/settings/pages`
- **Actions**: `https://github.com/andrevberaldo/Gen-ui/actions`

## Troubleshooting

### 404 Not Found
- Verifique se a branch `gh-pages` existe
- Confirme que o Source está apontando para `gh-pages`
- Aguarde alguns minutos para o GitHub Pages processar

### Build falhou
- Verifique os logs em: `https://github.com/andrevberaldo/Gen-ui/actions`
- Veja qual etapa falhou (build, install, etc.)

### Ainda com dúvidas?
Veja: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
