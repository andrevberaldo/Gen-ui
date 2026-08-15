const API_BASE = "https://jsonplaceholder.typicode.com";

export const rendererFunctions = {
  validateEmail: async (parameters) => {
    const { email } = parameters;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    return {
      functionName: "validateEmail",
      result: {
        email,
        isValid,
        message: isValid
          ? "Email válido ✓"
          : "Email inválido. Deve ser um email válido",
      },
    };
  },

  validatePostTitle: async (parameters) => {
    const { title } = parameters;
    const issues = [];

    if (!title || title.trim().length === 0) {
      issues.push("Título não pode estar vazio");
    } else {
      if (title.length < 5) {
        issues.push("Título deve ter pelo menos 5 caracteres");
      }
      if (title.length > 100) {
        issues.push("Título não pode ter mais de 100 caracteres");
      }
      if (!/^[a-zA-Z0-9\s.,!?\-':áéíóúàâêôãõç]/.test(title)) {
        issues.push("Título contém caracteres inválidos");
      }
    }

    return {
      functionName: "validatePostTitle",
      result: {
        title,
        isValid: issues.length === 0,
        issues,
        message:
          issues.length === 0
            ? "Título válido ✓"
            : `Problemas: ${issues.join("; ")}`,
      },
    };
  },

  validatePostBody: async (parameters) => {
    const { body } = parameters;
    const issues = [];

    if (!body || body.trim().length === 0) {
      issues.push("Corpo não pode estar vazio");
    } else {
      if (body.length < 10) {
        issues.push("Corpo deve ter pelo menos 10 caracteres");
      }
      if (body.length > 1000) {
        issues.push("Corpo não pode ter mais de 1000 caracteres");
      }
    }

    return {
      functionName: "validatePostBody",
      result: {
        body,
        isValid: issues.length === 0,
        issues,
        message:
          issues.length === 0
            ? "Corpo válido ✓"
            : `Problemas: ${issues.join("; ")}`,
      },
    };
  },

  formatDate: async (parameters) => {
    const { date } = parameters;
    try {
      const formatted = new Date(date).toLocaleDateString("pt-BR");
      return {
        functionName: "formatDate",
        result: {
          original: date,
          formatted,
        },
      };
    } catch (error) {
      return {
        functionName: "formatDate",
        result: {
          error: "Data inválida",
        },
      };
    }
  },

  highlightText: async (parameters) => {
    const { text, keywords } = parameters;
    if (!Array.isArray(keywords)) {
      return {
        functionName: "highlightText",
        result: {
          error: "keywords deve ser um array",
        },
      };
    }

    let highlighted = text;
    keywords.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, "gi");
      highlighted = highlighted.replace(
        regex,
        '<mark style="background-color: yellow">$1</mark>'
      );
    });

    return {
      functionName: "highlightText",
      result: {
        original: text,
        highlighted,
      },
    };
  },
};

export async function callRendererFunction(functionName, parameters) {
  if (rendererFunctions[functionName]) {
    try {
      return await rendererFunctions[functionName](parameters);
    } catch (error) {
      console.error(`Erro ao executar ${functionName}:`, error);
      return {
        functionName,
        error: error.message,
      };
    }
  } else {
    return {
      functionName,
      error: `Função ${functionName} não encontrada no renderizador`,
    };
  }
}

export async function callAgentFunction(functionName, parameters) {
  try {
    const response = await fetch("/api/agent/call-function", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        functionName,
        parameters,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro ao chamar agente: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro ao chamar função do agente:`, error);
    return {
      functionName,
      error: error.message,
    };
  }
}
