# Como Contribuir

Obrigado por seu interesse em contribuir para a documentação do A2UI em Português!

Este repositório contém a documentação de A2UI traduzida para português, hospedada via GitHub Pages.

## Como Começar

### Pré-requisitos

- Git
- Python 3.8+
- pip

### Configurar Ambiente Local

```bash
# Clone o repositório
git clone https://github.com/andrevberaldo/Gen-ui.git
cd Gen-ui

# Crie um ambiente virtual
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instale dependências
pip install -r requirements.txt

# Inicie o servidor local
mkdocs serve
```

Acesse `http://localhost:8000` para visualizar a documentação.

## Estrutura do Projeto

```
docs/
├── index.md                 # Página inicial
├── quickstart.md           # Guia de início rápido
├── guias/                  # Guias introdutórios
│   ├── introducao.md
│   ├── o-que-e-a2ui.md
│   ├── conceitos-principais.md
│   └── arquitetura.md
├── documentacao/           # Documentação técnica
│   ├── protocolo-v1.0.md
│   ├── funcoes-personalizadas.md
│   ├── guia-implementacao.md
│   └── guia-evolucao.md
├── referencia/            # Referência
│   ├── componentes.md
│   ├── catalogo.md
│   └── exemplos.md
└── contributing.md        # Este arquivo

mkdocs.yml                 # Configuração do MkDocs
requirements.txt          # Dependências Python
```

## Tipos de Contribuição

### 1. Corrigir Erros e Typos

Encontrou um erro na documentação?

```bash
# Crie uma branch
git checkout -b fix/sua-correcao

# Faça as correções
# ...

# Commit
git commit -m "fix: corrigir typo em conceitos-principais.md"

# Push
git push origin fix/sua-correcao
```

### 2. Melhorar Exemplos

Quer adicionar exemplos melhores?

```bash
git checkout -b docs/melhor-exemplo

# Edite docs/referencia/exemplos.md
# Adicione seu exemplo

git commit -m "docs: adicionar exemplo de dashboard avançado"
git push origin docs/melhor-exemplo
```

### 3. Adicionar Novo Conteúdo

Quer contribuir com um novo guia ou documentação?

```bash
git checkout -b docs/novo-conteudo

# Crie um novo arquivo em docs/
# Ex: docs/guias/seu-novo-guia.md

# Atualize mkdocs.yml para incluir na navegação

git commit -m "docs: adicionar guia sobre [tópico]"
git push origin docs/novo-conteudo
```

### 4. Traduzir Conteúdo Faltante

Quer traduzir mais conteúdo do repositório original?

```bash
git checkout -b translate/recurso-novo

# Traduza o conteúdo
# docs/novo-recurso.md

git commit -m "translate: traduzir documentação sobre [recurso]"
git push origin translate/recurso-novo
```

## Diretrizes de Escrita

### Português Claro e Acessível

- Use português brasileiro
- Evite jargão técnico desnecessário
- Explique conceitos quando usado pela primeira vez

### Formatação

```markdown
# Heading 1 (Título Principal)
## Heading 2 (Subtítulo)
### Heading 3 (Sub-subtítulo)

**Texto em negrito** para termos importantes
`código` para código inline
```

### Exemplos de Código

Sempre inclua exemplos práticos:

```json
{
  "createSurface": {
    "surfaceId": "example",
    "displayName": "Exemplo"
  }
}
```

### Notas e Destaques

```markdown
!!! note "Nota"
    Conteúdo importante que o leitor deve saber

!!! warning "Aviso"
    Algo que requer cuidado

!!! tip "Dica"
    Um conselho útil
```

## Processo de Revisão

1. **Push sua branch** com suas contribuições
2. **Abra um Pull Request** descrevendo suas mudanças
3. **Aguarde revisão** da comunidade
4. **Faça ajustes** conforme feedback
5. **Merge** quando aprovado

## Checklist para Pull Request

- [ ] Conteúdo revisado quanto a erros ortográficos
- [ ] Exemplos testados (se aplicável)
- [ ] Links funcionam e apontam para documentos corretos
- [ ] Formatação consistente com resto da documentação
- [ ] mkdocs.yml atualizado (se novo arquivo adicionado)
- [ ] Imagens com alt-text descritivo (se adicionado)

## Dúvidas?

- 💬 [Discussões do A2UI](https://github.com/a2ui-project/a2ui/discussions)
- 🐛 [Issues](https://github.com/andrevberaldo/Gen-ui/issues)
- 📧 Contato: andreberaldo@hotmail.com

## Código de Conduta

Contribuindo para este projeto, você concorda em:

- Ser respeitoso com outros contribuidores
- Fornecer feedback construtivo
- Seguir as diretrizes de contribuição
- Aceitar crítica construtiva

## Atribuição

Contribuidores significativos serão creditados:

- No README.md do projeto
- Em notas na documentação quando apropriado

## Licença

Ao contribuir, você concorda que suas contribuições sejam licenciadas sob Apache 2.0, a mesma licença do projeto original A2UI.

---

**Obrigado por tornar a documentação melhor! 🎉**
