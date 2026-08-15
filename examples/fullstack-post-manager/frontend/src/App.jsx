import React, { useState, useCallback, useEffect } from "react";
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import A2UIRenderer from "./components/A2UIRenderer";
import { useA2UI } from "./hooks/useA2UI";
import {
  callAgentFunction,
  callRendererFunction,
} from "./services/renderer-functions";

export default function App() {
  const {
    surfaces,
    activeData,
    processA2UIMessage,
    registerRendererFunction,
  } = useA2UI();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    registerRendererFunction(
      "callAgentFunction",
      async (params) => {
        const result = await callAgentFunction(
          params.functionName,
          params.parameters
        );
        processA2UIMessage(result);
        return result;
      }
    );
  }, [registerRendererFunction, processA2UIMessage]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/agent/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `Busque o post com ID ${searchQuery.trim()}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar post");
      }

      const a2uiMessage = await response.json();
      processA2UIMessage(a2uiMessage);
    } catch (error) {
      console.error("Erro:", error);
      processA2UIMessage({
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
    } finally {
      setLoading(false);
    }
  }, [searchQuery, processA2UIMessage]);

  const handleAction = useCallback(
    async (action) => {
      console.log("Ação recebida:", action);

      if (action.name === "openEditForm") {
        setLoading(true);
        try {
          const response = await fetch("/api/agent/query", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `Prepare um formulário de edição para o post ID ${action.context.postId}`,
            }),
          });

          const a2uiMessage = await response.json();
          processA2UIMessage(a2uiMessage);
        } finally {
          setLoading(false);
        }
      }
    },
    [processA2UIMessage]
  );

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            📝 A2UI Post Manager
          </Typography>
          <Typography variant="caption">
            Agente + React + Material UI
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Buscar Posts
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="ID do Post (1-100)"
              type="number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              fullWidth
              variant="outlined"
              placeholder="Digite o ID do post..."
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading || !searchQuery}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : "Buscar"}
            </Button>
          </Box>
        </Paper>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {Object.entries(surfaces).map(([surfaceId, surface]) => (
            <Paper key={surfaceId} elevation={2} sx={{ p: 3 }}>
              {surface.displayName && (
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {surface.displayName}
                </Typography>
              )}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {surface.components &&
                  surface.components.map((component) => (
                    <div key={component.id}>
                      <A2UIRenderer
                        component={component}
                        data={activeData[surfaceId] || {}}
                        onAction={handleAction}
                      />
                    </div>
                  ))}
              </Box>
            </Paper>
          ))}

          {Object.keys(surfaces).length === 0 && !loading && (
            <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
              <Typography color="textSecondary">
                Nenhum post carregado. Use a busca acima para começar.
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>

      <Box sx={{ bgcolor: "#f5f5f5", py: 3, mt: 4, textAlign: "center" }}>
        <Typography variant="caption" color="textSecondary">
          A2UI Protocol | Langchain Deep Agent | JSONPlaceholder API
        </Typography>
      </Box>
    </div>
  );
}
