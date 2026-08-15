# A2UI - Documentação em Português

📖 Documentação completa do protocolo **A2UI (Agent-to-UI)** traduzida para português.

## Sobre este Projeto

Este repositório contém uma documentação abrangente e traduzida do protocolo A2UI, um formato declarativo de UI que permite agentes de IA gerar interfaces de usuário ricas, seguras e interativas.

### 📚 Conteúdo

- **Guias Introdutórios**: Entenda o que é A2UI e seus conceitos fundamentais
- **Documentação Técnica**: Especificação completa do protocolo v1.0
- **Referência de Componentes**: Lista detalhada de todos os componentes disponíveis
- **Exemplos Práticos**: Código pronto para usar
- **Guias de Implementação**: Como implementar um renderizador A2UI

## 🚀 Começar Rápido

### Ver a Documentação Online

A documentação é publicada automaticamente via GitHub Pages:

**[📖 Acessar Documentação](https://andrevberaldo.github.io/Gen-ui/)**

### Executar Localmente

```bash
# Clone o repositório
git clone https://github.com/andrevberaldo/Gen-ui.git
cd Gen-ui

# Crie um ambiente virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instale dependências
pip install -r requirements.txt

# Inicie o servidor local
mkdocs serve
```

Acesse `http://localhost:8000` para visualizar a documentação.

## 📁 Estrutura

```
.
├── docs/
│   ├── index.md                 # Página inicial
│   ├── quickstart.md           # Guia de início rápido
│   ├── contributing.md         # Como contribuir
│   ├── guias/                  # Guias introdutórios
│   ├── documentacao/           # Documentação técnica
│   └── referencia/             # Referência de componentes
├── mkdocs.yml                  # Configuração MkDocs
└── requirements.txt            # Dependências Python
```

## 🔗 Recursos Relacionados

- **[Repositório Original A2UI](https://github.com/a2ui-project/a2ui)** - Código-fonte e especificação oficial
- **[Site Oficial A2UI](https://a2ui.org)** - Especificação original em inglês
- **[A2UI Composer](https://a2ui-project.github.io/composer/)** - Editor visual de A2UI
- **[A2UI Theater](https://a2ui-composer.ag-ui.com/theater)** - Demonstrações interativas

## 📖 Principais Seções

### Para Iniciantes
- [Introdução a A2UI](docs/guias/introducao.md)
- [O que é A2UI?](docs/guias/o-que-e-a2ui.md)
- [Conceitos Principais](docs/guias/conceitos-principais.md)
- [Guia de Início Rápido](docs/quickstart.md)

### Para Desenvolvedores
- [Arquitetura](docs/guias/arquitetura.md)
- [Protocolo v1.0](docs/documentacao/protocolo-v1.0.md)
- [Funções Personalizadas](docs/documentacao/funcoes-personalizadas.md)
- [Guia de Implementação](docs/documentacao/guia-implementacao.md)
- [Referência de Componentes](docs/referencia/componentes.md)

### Para Arquitetos
- [Guia de Evolução v0.9 → v1.0](docs/documentacao/guia-evolucao.md)
- [Catálogo de Referência](docs/referencia/catalogo.md)

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja [Como Contribuir](docs/contributing.md) para detalhes.

### Tipos de Contribuição

- 🐛 Corrigir erros e typos
- 📝 Melhorar exemplos
- ➕ Adicionar novo conteúdo
- 🌐 Traduzir para outros idiomas
- 💡 Sugerir melhorias

## ⚙️ Deployment Automático

Este repositório usa GitHub Actions para deploy automático:

1. **Trigger**: Push para a branch `claude/mkdocs-portuguese-docs-l9rysy`
2. **Build**: MkDocs constrói o site
3. **Deploy**: Site é publicado em GitHub Pages

## 📋 Checklist de Configuração

- [x] Documentação em Markdown criada
- [x] MkDocs configurado com tema Material
- [x] Arquivo de configuração mkdocs.yml
- [x] Dependências em requirements.txt
- [x] GitHub Actions workflow configurado
- [x] README.md criado
- [x] Code of Conduct incluído
- [ ] Domínio customizado configurado (opcional)
- [ ] CNAME adicionado (opcional)

## 🔐 Segurança

Esta documentação é pública e aberta. Não inclua:
- Senhas ou tokens
- Informações confidenciais
- Dados pessoais

## 📄 Licença

A documentação segue a mesma licença do projeto original A2UI: **Apache 2.0**

Veja [LICENSE](https://github.com/a2ui-project/a2ui/blob/main/LICENSE) para detalhes.

## 💬 Suporte

- 💬 [Discussões GitHub](https://github.com/andrevberaldo/Gen-ui/discussions)
- 🐛 [Issues](https://github.com/andrevberaldo/Gen-ui/issues)
- 🔗 [Discussões do A2UI Original](https://github.com/a2ui-project/a2ui/discussions)

## 👤 Autor

- **André Vilarinho Beraldo** - [@andrevberaldo](https://github.com/andrevberaldo)

## 🙏 Agradecimentos

- Projeto original [A2UI](https://github.com/a2ui-project/a2ui) por Google e comunidade
- [MkDocs](https://www.mkdocs.org/) para documentação estática
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) para tema
- Comunidade de contribuidores

---

**Última atualização**: 15 de agosto de 2026

**Status**: ✅ Documentação Completa

Para começar, visite [📖 A Documentação](https://andrevberaldo.github.io/Gen-ui/) ou execute localmente com `mkdocs serve`.
