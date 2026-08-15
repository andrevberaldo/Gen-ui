import React, { useCallback } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Container,
  List,
  ListItem,
} from "@mui/material";

const ComponentMap = {
  text: TextComponent,
  button: ButtonComponent,
  card: CardComponent,
  "text-input": TextInputComponent,
  loading: LoadingComponent,
  alert: AlertComponent,
  list: ListComponent,
  container: ContainerComponent,
};

function TextComponent({ component, data, onAction }) {
  const { content, variant = "body1" } = component.properties;
  const resolvedContent = resolveBinding(content, data);

  const variantMap = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
    body1: "body1",
    body2: "body2",
    caption: "caption",
  };

  return (
    <Typography variant={variantMap[variant]} sx={{ mb: 2 }}>
      {resolvedContent}
    </Typography>
  );
}

function ButtonComponent({ component, data, onAction }) {
  const { label, disabled = false, variant = "contained", onClick } =
    component.properties;
  const resolvedLabel = resolveBinding(label, data);

  const handleClick = () => {
    if (onClick && onAction) {
      onAction({
        name: onClick.name,
        context: onClick.context,
      });
    }
  };

  return (
    <Button
      variant={variant}
      disabled={disabled}
      onClick={handleClick}
      sx={{ mb: 2, mr: 1 }}
    >
      {resolvedLabel}
    </Button>
  );
}

function CardComponent({ component, data, onAction }) {
  const { title, subtitle, content, elevation = 1 } = component.properties;
  const resolvedTitle = resolveBinding(title, data);
  const resolvedSubtitle = resolveBinding(subtitle, data);
  const resolvedContent = resolveBinding(content, data);

  return (
    <Card elevation={elevation} sx={{ mb: 2 }}>
      {(title || subtitle) && (
        <CardHeader title={resolvedTitle} subheader={resolvedSubtitle} />
      )}
      <CardContent>
        <Typography variant="body2">{resolvedContent}</Typography>
      </CardContent>
    </Card>
  );
}

function TextInputComponent({ component, data, onAction }) {
  const { label, placeholder, value, required = false, onChange } =
    component.properties;
  const resolvedValue = resolveBinding(value, data);

  const handleChange = (e) => {
    if (onChange && onAction) {
      onAction({
        name: onChange.name,
        context: { value: e.target.value },
      });
    }
  };

  return (
    <TextField
      label={label}
      placeholder={placeholder}
      value={resolvedValue || ""}
      onChange={handleChange}
      required={required}
      fullWidth
      margin="normal"
      variant="outlined"
    />
  );
}

function LoadingComponent({ component, data, onAction }) {
  const { message = "Carregando..." } = component.properties;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
      <CircularProgress />
      <Typography>{message}</Typography>
    </Box>
  );
}

function AlertComponent({ component, data, onAction }) {
  const { message, severity = "info" } = component.properties;
  const resolvedMessage = resolveBinding(message, data);

  return (
    <Alert severity={severity} sx={{ mb: 2 }}>
      {resolvedMessage}
    </Alert>
  );
}

function ListComponent({ component, data, onAction }) {
  const { items, itemTemplate } = component.properties;
  const resolvedItems = resolveBinding(items, data) || [];

  if (!Array.isArray(resolvedItems)) {
    return <Alert severity="error">Items deve ser um array</Alert>;
  }

  return (
    <List sx={{ mb: 2 }}>
      {resolvedItems.map((item, index) => (
        <ListItem key={index}>
          <A2UIRenderer
            component={itemTemplate}
            data={{
              "@item": item,
              "@index": index,
              ...data,
            }}
            onAction={onAction}
          />
        </ListItem>
      ))}
    </List>
  );
}

function ContainerComponent({ component, data, onAction }) {
  const { spacing = 2, children = [] } = component;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: spacing }}>
      {children.map((child, idx) => (
        <A2UIRenderer
          key={idx}
          component={child}
          data={data}
          onAction={onAction}
        />
      ))}
    </Box>
  );
}

function resolveBinding(value, data = {}) {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/\$\{([^}]+)\}/g, (match, path) => {
    const keys = path.split("/").filter(Boolean);
    let resolved = data;

    for (const key of keys) {
      if (resolved && typeof resolved === "object") {
        resolved = resolved[key];
      } else {
        return match;
      }
    }

    return resolved !== undefined ? resolved : match;
  });
}

export default function A2UIRenderer({ component, data = {}, onAction }) {
  if (!component) {
    return null;
  }

  const ComponentType = ComponentMap[component.type];

  if (!ComponentType) {
    return (
      <Alert severity="error">
        Tipo de componente desconhecido: {component.type}
      </Alert>
    );
  }

  return (
    <ComponentType
      component={component}
      data={data}
      onAction={onAction}
    />
  );
}
