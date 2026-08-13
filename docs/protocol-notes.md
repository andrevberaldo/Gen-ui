# A2UI in this POC — what is implemented, and what is not

The wire format follows the A2UI v1.0 specification so payloads stay portable to other
renderers. This note records the subset that is implemented, the deliberate deviations, and
the design decisions worth arguing about before this becomes a product.

## Implemented

| Spec concept | Where | Notes |
| --- | --- | --- |
| `createSurface` | `runtime/surface.ts` | Inline `components` + `dataModel`, per v1.0. Re-creating an existing surface is an error. |
| `updateComponents` | `runtime/surface.ts` | Merge by component id. |
| `updateDataModel` | `runtime/surface.ts` | JSON Pointer write; `""` replaces the root. |
| `deleteSurface` | `runtime/surface.ts` | Idempotent. |
| Flat component list + `root` | `validate.ts`, `react/SurfaceRenderer.tsx` | Every surface must define `root`; child references are resolved against the surface's known ids. |
| Literal vs. `{"path": …}` values | `runtime/bindings.ts` | Any catalog prop marked dynamic accepts either. |
| Children templates | `runtime/bindings.ts`, `SurfaceRenderer` | `{componentId, path}`, with paths inside the template scoped to the array item. |
| Read/write contract for inputs | `SurfaceRenderer`, `chat/Chat.tsx` | `TextField` writes into the local data model on every keystroke; the network sees nothing until an event fires. |
| Events vs. local functions | `SurfaceRenderer.dispatch` | `action.event` goes to the agent; `action.functionCall` (`openUrl`) never leaves the browser. |
| Renderer-side checks | `runtime/bindings.ts` | `required` and `regex`; a failing check disables the button and captions the field. |
| `formatString` | `runtime/bindings.ts` | `${/json/pointer}` interpolation, the spec's answer to having no operators. |
| Renderer→agent `action` | `chat/Chat.tsx`, `api/chat/route.ts` | Built with `name`, `surfaceId`, `sourceComponentId`, `timestamp`, resolved `context`. |
| `VALIDATION_FAILED` self-correction | `validate.ts`, `agent/tools.ts` | Returned as the tool result so the model fixes its own output. |

## Not implemented

- **Catalog negotiation.** The renderer advertises no `a2uiClientCapabilities`; there is one
  catalog and the agent is told about it in the system prompt.
- **`sendDataModel` sync.** Actions carry a hand-picked `context` instead of the whole model.
  Worth adding for voice or free-text control of a live widget ("okay, submit that").
- **Renderer→agent `error` payloads on the wire.** Render failures are surfaced in the
  transcript and would be trivial to POST back; the agent-side half of the loop already
  exists for validation errors.
- **`Tabs`, `Modal`, `ChoicePicker`, `Slider`, `DateTimeInput`.** In the spec's basic catalog,
  omitted here to keep the catalog readable.
- **Progressive rendering.** Messages are applied whole. The spec's streaming story (partial
  components rendered as they arrive) is a renderer change, not a protocol one.

## Deviations worth knowing

**The catalog is ours, not the spec's basic catalog.** `catalogId` is
`gen-ui.local:design-system/v1`. That is the intended extension point — the spec's basic
catalog is a reference vocabulary, and a product's catalog is its design system. The
consequence is that payloads from this agent render correctly only against a renderer that
implements this catalog; the *protocol* is portable, the *vocabulary* is ours.

**Components are declared in TypeScript, not hand-written JSON Schema.** `catalog/define.ts`
is a small DSL that emits the schema and the validator from one declaration. Hand-written
schema plus a hand-written validator is the standard way to end up with a model that has
been taught a vocabulary the renderer no longer accepts.

**Actions become a hidden user turn.** The agent receives
`[a2ui action] name=… surface=… component=… context={…}` rather than a structured tool
result. This keeps the conversation a plain message list and lets the model treat a click
and a sentence identically; the cost is one line of parsing in the scripted agent.

## Decisions to revisit before production

1. **Who owns the surface lifecycle.** Surfaces currently live for the whole session and the
   agent is told to reuse them. A long conversation with many widgets will accumulate state
   in both the client and the server mirror; a real product wants eviction, and probably a
   cap on live surfaces per conversation.
2. **Trusting agent-supplied URLs.** `Image.url` and `openUrl` take whatever the agent
   produces (via a tool result). `openUrl` is restricted to `http(s)`, but a CSP and an
   allowlist of image hosts belong here before this ships.
3. **Latency of the action round trip.** Every button press is a model turn. Deterministic
   actions (toggle a unit, switch a tab) could be handled by the renderer or by a
   non-model handler keyed on the event name, keeping the model for decisions that need
   judgement.
4. **Prompt size.** The generated catalog document is ~30 KB (roughly 8k tokens) of the
   system prompt — already down from 43 KB by hoisting the repeated binding and
   function-call schemas into `$defs`. Prompt caching makes a stable prefix cheap, but a
   design system several times this size wants progressive disclosure: send component
   summaries, and let the agent request full schemas for the ones it intends to use.
