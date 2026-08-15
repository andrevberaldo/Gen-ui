import { ChatOpenAI } from "@langchain/openai";
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";
import { tools } from "./tools.js";

const model = new ChatOpenAI({
  modelName: "gpt-4-turbo-preview",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});

class DeepAgentExecutor {
  constructor(tools, model) {
    this.tools = tools;
    this.model = model;
    this.executor = null;
    this.maxIterations = 10;
    this.verbose = true;
  }

  async initialize() {
    const systemPrompt = `Você é um assistente inteligente que gera interfaces dinâmicas usando o protocolo A2UI.

Quando um usuário faz uma requisição:
1. Analise a intenção
2. Execute ferramentas apropriadas (SearchPosts, UpdatePost, etc)
3. Gere uma resposta A2UI estruturada em JSON
4. A resposta deve incluir: createSurface, updateDataModel, updateComponents conforme necessário

Sempre retorne respostas em JSON válido que seja compatível com o protocolo A2UI.`;

    const agent = await createOpenAIFunctionsAgent({
      llm: this.model,
      tools: this.tools,
      systemPrompt,
    });

    this.executor = new AgentExecutor({
      agent,
      tools: this.tools,
      verbose: this.verbose,
      maxIterations: this.maxIterations,
      handleParsingErrors: true,
    });
  }

  async invoke(input) {
    if (!this.executor) {
      await this.initialize();
    }

    try {
      const result = await this.executor.invoke({
        input,
      });
      return result;
    } catch (error) {
      console.error("Erro na execução do agente:", error);
      throw error;
    }
  }
}

let agentExecutor;

export async function initializeAgent() {
  agentExecutor = new DeepAgentExecutor(tools, model);
  await agentExecutor.initialize();
  return agentExecutor;
}

export async function runAgent(userMessage) {
  if (!agentExecutor) {
    await initializeAgent();
  }

  const result = await agentExecutor.invoke(userMessage);
  return result;
}

export function generateA2UIFromResult(result, surfaceId = "main") {
  const toolOutput = result.output || result;

  if (typeof toolOutput === "string") {
    try {
      const parsed = JSON.parse(toolOutput);
      if (parsed.createSurface || parsed.updateComponents || parsed.updateDataModel) {
        return parsed;
      }
      return generateDefaultResponse(toolOutput, surfaceId);
    } catch {
      return generateDefaultResponse(toolOutput, surfaceId);
    }
  }

  if (typeof toolOutput === "object" && toolOutput !== null) {
    if (toolOutput.createSurface || toolOutput.updateComponents || toolOutput.updateDataModel) {
      return toolOutput;
    }
  }

  return generateDefaultResponse(JSON.stringify(toolOutput), surfaceId);
}

function generateDefaultResponse(content, surfaceId) {
  return {
    updateComponents: {
      surfaceId,
      components: [
        {
          id: "result-card",
          type: "card",
          properties: {
            title: "Resultado",
            content: content,
          },
        },
      ],
    },
  };
}
