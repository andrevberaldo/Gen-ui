import { useState, useCallback, useRef } from "react";

export function useA2UI(initialSurfaceId = "main") {
  const [surfaces, setSurfaces] = useState({});
  const [activeData, setActiveData] = useState({});
  const callbacksRef = useRef({});

  const updateDataModel = useCallback((surfaceId, path, value) => {
    setActiveData((prev) => ({
      ...prev,
      [surfaceId]: setNestedValue(
        prev[surfaceId] || {},
        path,
        value
      ),
    }));
  }, []);

  const updateComponents = useCallback((surfaceId, components) => {
    setSurfaces((prev) => ({
      ...prev,
      [surfaceId]: {
        ...prev[surfaceId],
        components: mergeComponents(
          prev[surfaceId]?.components || [],
          components
        ),
      },
    }));
  }, []);

  const createSurface = useCallback(
    (surfaceId, displayName, catalog = "default") => {
      setSurfaces((prev) => ({
        ...prev,
        [surfaceId]: {
          displayName,
          catalog,
          components: [],
        },
      }));
    },
    []
  );

  const deleteSurface = useCallback((surfaceId) => {
    setSurfaces((prev) => {
      const newSurfaces = { ...prev };
      delete newSurfaces[surfaceId];
      return newSurfaces;
    });

    setActiveData((prev) => {
      const newData = { ...prev };
      delete newData[surfaceId];
      return newData;
    });
  }, []);

  const processA2UIMessage = useCallback(
    (message) => {
      if (message.createSurface) {
        const { surfaceId, displayName, catalog } = message.createSurface;
        createSurface(surfaceId, displayName, catalog);
      }

      if (message.updateComponents) {
        const { surfaceId, components } = message.updateComponents;
        updateComponents(surfaceId, components);
      }

      if (message.updateDataModel) {
        const { surfaceId, path, value } = message.updateDataModel;
        updateDataModel(surfaceId, path, value);
      }

      if (message.deleteSurface) {
        const { surfaceId } = message.deleteSurface;
        deleteSurface(surfaceId);
      }

      if (message.callRendererFunction) {
        const { functionName, parameters } = message.callRendererFunction;
        if (callbacksRef.current[functionName]) {
          return callbacksRef.current[functionName](parameters);
        }
      }
    },
    [createSurface, updateComponents, updateDataModel, deleteSurface]
  );

  const registerRendererFunction = useCallback((name, callback) => {
    callbacksRef.current[name] = callback;
  }, []);

  return {
    surfaces,
    activeData,
    processA2UIMessage,
    updateDataModel,
    updateComponents,
    createSurface,
    deleteSurface,
    registerRendererFunction,
  };
}

function setNestedValue(obj, path, value) {
  const keys = path.split("/").filter(Boolean);
  const result = { ...obj };
  let current = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current[key] = { ...current[key] };
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;

  return result;
}

function mergeComponents(existing, newComponents) {
  const componentMap = new Map(existing.map((c) => [c.id, c]));

  newComponents.forEach((comp) => {
    componentMap.set(comp.id, comp);
  });

  return Array.from(componentMap.values());
}
