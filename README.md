# Gen-UI — an A2UI proof of concept

An agent that decides **what to render** in a chat, not just what to say — and can only
render things the design system already knows how to draw.

The agent answers a turn either in prose or by emitting [A2UI](https://a2ui.org) v1.0
messages describing a widget. The client renders those messages with its own React
components. Buttons inside the widget send protocol events back to the agent, which
answers with a data-model patch, so the widget updates **in place** with live data from a
real external API — no re-render of the message, no HTML from the model, no way for it to
invent a colour.

<!-- Run `npm run dev` and ask "Show me stats for vercel/next.js". -->

## Why this shape

Three properties fall out of the A2UI design, and they're the reason to build it this way
rather than having the model emit markup:

| Property | How it is achieved here |
| --- | --- |
| **Safe** | The model emits *data*, never code or markup. A closed catalog is the only vocabulary; anything else is rejected before it reaches the DOM. |
| **On-brand by construction** | Catalog entries map 1:1 to design-system components. There is no `style`, no `className`, no hex colour, no pixel value in the vocabulary — only named variants. |
| **Stateful and cheap to update** | Structure and state are separate. The widget is sent once; refreshes are `updateDataModel` patches at a JSON Pointer, so a live widget costs a few hundred bytes to update. |

## Running it

```bash
npm install
cp .env.example .env.local     # add ANTHROPIC_API_KEY for the live agent
npm run dev                    # http://localhost:3000
```

Then ask something like *"Show me stats for vercel/next.js"*.

**Without an `ANTHROPIC_API_KEY`** the app falls back to a scripted agent
(`src/agent/mockAgent.ts`). It is not a mock renderer: it goes through the same
`render_ui` tool, the same catalog validation, the same surface store, and the same live
GitHub API. It just always builds the repository widget, where the real agent chooses. The
header shows which agent is running.

| Env var | Effect |
| --- | --- |
| `ANTHROPIC_API_KEY` | Enables the live agent. Without it, the scripted agent runs. |
| `ANTHROPIC_MODEL` | Model override. Defaults to `claude-opus-5`. |
| `GITHUB_TOKEN` | Optional. Raises the GitHub rate limit from 60 to 5,000 requests/hour. |
| `GENUI_DATA_SOURCE=fixtures` | Opt-in offline mode: synthetic, clearly-labelled data instead of network calls, for demos and CI behind a firewall. |

```bash
npm test               # protocol, binding and validation tests
npm run typecheck
npm run catalog:print  # the exact catalog document the agent is given
```

## The loop

```
 user turn ──► agent ──► data tool ──► GitHub / Open-Meteo        (real API call)
                 │
                 └─► render_ui ──► catalog validation ──┬─► ✗ VALIDATION_FAILED back to the model
                                                        └─► ✓ A2UI messages ──► SSE ──► renderer
                                                                                          │
 agent ◄── action event ◄── button click ◄─────────────────────────────────────────────────┘
   │
   └─► updateDataModel ──► same surface, new state
```

An action is just another turn in the conversation. The agent sees
`[a2ui action] name=refresh surface=repo-1 context={"repo":"vercel/next.js"}`, calls the
API again, and replies with a patch rather than a new widget.

## Layout

```
src/a2ui/
  protocol/types.ts        A2UI v1.0 wire types (agent→renderer, renderer→agent)
  catalog/define.ts        Catalog DSL: JSON-Schema emitter + runtime validator, one source
  catalog/design-system.ts The catalog — 15 components, 4 functions, no free-form styling
  validate.ts              The gate: catalog + structural checks, VALIDATION_FAILED feedback
  runtime/pointer.ts       RFC 6901 JSON Pointer, immutable writes
  runtime/bindings.ts      {path} bindings, formatString, checks, action context resolution
  runtime/surface.ts       Pure reducer folding messages into renderable state
  react/SurfaceRenderer.tsx  Walks the flat list, maps each node to a DS component
src/design-system/         Tokens + React primitives. Knows nothing about A2UI.
src/agent/
  prompt.ts                System prompt; embeds the generated catalog document
  tools.ts                 Data tools (real APIs) + the render_ui tool
  runAgent.ts              Streaming loop: text, tool progress and A2UI on one wire
  mockAgent.ts             Scripted agent for running without a key
  providers/               GitHub REST, Open-Meteo, offline fixtures
app/api/chat/route.ts      SSE transport; user messages and actions enter here
src/chat/Chat.tsx          Transcript, surface store, action dispatch
```

## How the guarantee is enforced

The catalog is declared once, in TypeScript, and two artifacts are derived from that single
declaration:

- `buildCatalogDocument()` → the JSON-Schema-shaped document embedded in the system prompt.
- `validateComponent()` → the runtime gate every message passes through.

They cannot drift apart, so "what the model was taught" and "what the renderer accepts" are
the same set. A rejected message produces A2UI-style `VALIDATION_FAILED` feedback that is
returned to the model as the tool result, and it corrects itself on the next turn:

```
VALIDATION_FAILED — nothing was rendered. Fix these and call the tool again:
- /0/createSurface/components/2/tone: "hotpink" is not part of the design system.
  Use one of: default, muted, accent, positive, warning, negative.
```

`tests/validate.test.ts` pins this behaviour: unknown components, unknown props, invented
variants, dangling child references, duplicate ids, a missing `root`, unknown catalog
functions and non-pointer paths are all rejected.

## Extending it

**Add a component** — add an entry to `designSystemCatalog`, build the primitive in
`src/design-system`, and add a `case` to `SurfaceRenderer`. The prompt, the validator and
the emitted schema update themselves.

**Add a data source** — add a provider under `src/agent/providers`, add a tool to
`src/agent/tools.ts`. No renderer changes: the catalog is domain-agnostic, which is why the
same fifteen components render a weather widget and a repository widget.

**Swap the transport** — A2UI is transport-agnostic. `app/api/chat/route.ts` is ~70 lines of
SSE; WebSockets or A2A `DataPart`s with `mimeType: application/a2ui+json` would slot in
without touching the renderer.

## Known limits of the POC

- Sessions live in process memory (`src/server/sessions.ts`) and expire after an hour.
- One catalog, one renderer. Multi-catalog negotiation and `sendDataModel` sync are not
  implemented.
- The renderer reports render failures into the transcript; it does not yet send the
  renderer→agent `error` payload back over the wire.
- Streaming is per-message, not per-token, for A2UI: a widget appears when its message is
  validated rather than building up progressively.

## Reference

- A2UI specification: <https://a2ui.org> · <https://github.com/google/A2UI>
- The concepts used here: surfaces, flat component lists, `{path}` data binding, children
  templates, events vs. local functions, and `VALIDATION_FAILED` self-correction.
