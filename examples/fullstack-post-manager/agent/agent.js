import { ChatOpenAI } from "@langchain/openai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { tools } from "./tools.js";

const model = new ChatOpenAI({
  modelName: "gpt-4-turbo-preview",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY,
});

let agentExecutor;

export async function initializeAgent() {
  agentExecutor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "openai-functions",
    verbose: true,
  });
  return agentExecutor;
}

export async function runAgent(userMessage) {
  if (!agentExecutor) {
    await initializeAgent();
  }

  const result = await agentExecutor.invoke({
    input: userMessage,
  });

  return result;
}

export function generateA2UIFromResult(result, surfaceId = "main") {
  const toolOutput = result.output;

  if (typeof toolOutput === "string" && toolOutput.startsWith("{")) {
    try {
      return JSON.parse(toolOutput);
    } catch {
      return generateDefaultResponse(toolOutput, surfaceId);
    }
  }

  return generateDefaultResponse(toolOutput, surfaceId);
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
