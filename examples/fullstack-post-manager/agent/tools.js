import { Tool } from "@langchain/core/tools";
import { z } from "zod";

const JSONPLACEHOLDER_API = "https://jsonplaceholder.typicode.com";

class SearchPostsTool extends Tool {
  name = "search_posts";
  description =
    "Busca posts no JSONPlaceholder por ID ou retorna um post específico. Use quando o usuário quer buscar ou visualizar um post.";

  schema = z.object({
    postId: z.number().describe("ID do post a buscar (1-100)"),
  });

  async _call(input) {
    try {
      const response = await fetch(
        `${JSONPLACEHOLDER_API}/posts/${input.postId}`
      );
      if (!response.ok) {
        return JSON.stringify({
          error: `Post com ID ${input.postId} não encontrado`,
        });
      }

      const post = await response.json();
      const userResponse = await fetch(
        `${JSONPLACEHOLDER_API}/users/${post.userId}`
      );
      const user = await userResponse.json();

      return JSON.stringify({
        createSurface: {
          surfaceId: `post-${post.id}`,
          displayName: `Post #${post.id}`,
        },
        updateDataModel: {
          surfaceId: `post-${post.id}`,
          path: "/post",
          value: {
            id: post.id,
            title: post.title,
            body: post.body,
            author: user.name,
            authorEmail: user.email,
            userId: post.userId,
          },
        },
        updateComponents: {
          surfaceId: `post-${post.id}`,
          components: [
            {
              id: "post-title",
              type: "text",
              properties: {
                content: post.title,
                variant: "h3",
              },
            },
            {
              id: "post-author",
              type: "text",
              properties: {
                content: `Por: ${user.name} (${user.email})`,
                variant: "caption",
              },
            },
            {
              id: "post-body",
              type: "text",
              properties: {
                content: post.body,
                variant: "body1",
              },
            },
            {
              id: "edit-button",
              type: "button",
              properties: {
                label: "Editar Post",
                variant: "contained",
                onClick: {
                  name: "openEditForm",
                  context: { postId: post.id },
                },
              },
            },
          ],
        },
      });
    } catch (error) {
      return JSON.stringify({
        error: `Erro ao buscar post: ${error.message}`,
      });
    }
  }
}

class UpdatePostTool extends Tool {
  name = "update_post";
  description =
    "Atualiza um post existente. Requer validação de título e corpo.";

  schema = z.object({
    postId: z.number().describe("ID do post a atualizar"),
    title: z.string().min(5).describe("Novo título (mínimo 5 caracteres)"),
    body: z.string().min(10).describe("Novo corpo (mínimo 10 caracteres)"),
  });

  async _call(input) {
    try {
      const response = await fetch(
        `${JSONPLACEHOLDER_API}/posts/${input.postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: input.postId,
            title: input.title,
            body: input.body,
            userId: 1,
          }),
        }
      );

      if (!response.ok) {
        return JSON.stringify({
          error: `Erro ao atualizar post ${input.postId}`,
        });
      }

      const updated = await response.json();

      return JSON.stringify({
        updateDataModel: {
          surfaceId: `post-${input.postId}`,
          path: "/post",
          value: updated,
        },
        updateComponents: {
          surfaceId: `post-${input.postId}`,
          components: [
            {
              id: "success-alert",
              type: "alert",
              properties: {
                message: `Post #${input.postId} atualizado com sucesso!`,
                severity: "success",
              },
            },
            {
              id: "updated-title",
              type: "text",
              properties: {
                content: input.title,
                variant: "h3",
              },
            },
            {
              id: "updated-body",
              type: "text",
              properties: {
                content: input.body,
                variant: "body1",
              },
            },
          ],
        },
      });
    } catch (error) {
      return JSON.stringify({
        error: `Erro ao atualizar post: ${error.message}`,
      });
    }
  }
}

class ValidateEmailTool extends Tool {
  name = "validate_email";
  description = "Valida se um email tem formato correto";

  schema = z.object({
    email: z.string().email().describe("Email a validar"),
  });

  _call(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(input.email);

    return JSON.stringify({
      email: input.email,
      isValid,
      message: isValid
        ? "Email válido"
        : "Email inválido - deve ter formato correto",
    });
  }
}

class ValidatePostTitleTool extends Tool {
  name = "validate_post_title";
  description = "Valida se um título de post atende os critérios";

  schema = z.object({
    title: z.string().describe("Título a validar"),
  });

  _call(input) {
    const issues = [];

    if (input.title.length < 5) {
      issues.push("Título deve ter pelo menos 5 caracteres");
    }
    if (input.title.length > 100) {
      issues.push("Título não pode ter mais de 100 caracteres");
    }
    if (!/^[a-zA-Z0-9\s.,!?\-']/.test(input.title)) {
      issues.push(
        "Título contém caracteres inválidos"
      );
    }

    return JSON.stringify({
      title: input.title,
      isValid: issues.length === 0,
      issues,
      message:
        issues.length === 0
          ? "Título válido"
          : `Problemas encontrados: ${issues.join("; ")}`,
    });
  }
}

export const tools = [
  new SearchPostsTool(),
  new UpdatePostTool(),
  new ValidateEmailTool(),
  new ValidatePostTitleTool(),
];
