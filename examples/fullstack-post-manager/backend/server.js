import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { runAgent, generateA2UIFromResult } from "../agent/agent.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "A2UI Agent Server is running" });
});

app.post("/api/agent/query", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query é obrigatória" });
    }

    console.log(`Processando query: ${query}`);

    const result = await runAgent(query);
    const a2uiMessage = generateA2UIFromResult(result);

    res.json(a2uiMessage);
  } catch (error) {
    console.error("Erro ao processar query:", error);
    res.status(500).json({
      error: error.message,
      updateComponents: {
        surfaceId: "main",
        components: [
          {
            id: "error-alert",
            type: "alert",
            properties: {
              message: `Erro: ${error.message}`,
              severity: "error",
            },
          },
        ],
      },
    });
  }
});

app.post("/api/agent/call-function", async (req, res) => {
  try {
    const { functionName, parameters } = req.body;

    if (!functionName) {
      return res
        .status(400)
        .json({ error: "functionName é obrigatória" });
    }

    console.log(
      `Chamando função do agente: ${functionName}`,
      parameters
    );

    const result = await runAgent(
      `Chame a função ${functionName} com parâmetros: ${JSON.stringify(
        parameters
      )}`
    );

    res.json({
      functionName,
      result: result.output,
    });
  } catch (error) {
    console.error("Erro ao chamar função do agente:", error);
    res.status(500).json({
      functionName: req.body.functionName,
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 A2UI Agent Server rodando em http://localhost:${PORT}`);
  console.log(`📝 POST /api/agent/query - Processar query do agente`);
  console.log(
    `🔧 POST /api/agent/call-function - Chamar função do agente`
  );
});
