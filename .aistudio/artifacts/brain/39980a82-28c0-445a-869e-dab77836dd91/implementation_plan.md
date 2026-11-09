# Hermes Agent Execution Bridge Integration

Extend the Agentic Documentary Studio execution bridge to support **Hermes Agent (`hermes`)** as the default headless CLI orchestrator alongside Claude Code and OpenCode, complete with inline Provider and Model ID selection, automated `hermes_prompt.txt` generation, and real-time SSE log streaming.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design and configuration choices have been confirmed from your answers and will guide the implementation:

- **Confirmed Default Agent & Credentials**: `Hermes Agent (Headless -q)` is set as the default selected CLI agent in Panel C, pre-filled with `Provider: openrouter` and `Model ID: google/gemini-2.5-flash` (while keeping example placeholders visible when cleared).
- **Confirmed Directive Inspector Enhancement**: The Directive Inspector modal will include a dedicated **`hermes_prompt.txt` & CLI Command** tab displaying both the exact prompt file written to the workspace and the full `hermes chat --yolo ...` invocation string.

---

## 1. Overview & Core Concept

- **What It Does**: Enables one-click headless orchestration of the `hermes` CLI agent in non-interactive query-file mode (`--query-file hermes_prompt.txt --yolo`) with customizable provider and model routing, while preserving full compatibility with `Claude Code` and `OpenCode`.
- **Target Audience / Persona**: Documentary creators and technical video editors running local multi-stage pipelines (`yt-dlp`/SearXNG sourcing, VLM frame verification, HyperFrames 60fps HTML/CSS rendering, Earshot SFX sync, and `pyCapCut` draft assembly).
- **Key Value**: Eliminates manual terminal invocation and interactive permission prompts (`HERMES_YOLO_MODE=1` and `--yolo`), allowing users to switch LLM providers (`openrouter`, `openai`, `nous`, etc.) and models directly from the storyboard toolbar.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Default Agent Selection (Panel C Toolbar)**: On workspace load, the CLI Agent selector defaults to `Hermes Agent (Headless -q)`.
  2. **Inline Provider & Model Controls**: When `Hermes Agent (Headless -q)` is active, two inline text inputs appear directly beside the agent selector in the Panel C execution bar:
     - **Provider**: Pre-populated with `openrouter` (placeholder: `e.g. openrouter, openai, nous`).
     - **Model ID**: Pre-populated with `google/gemini-2.5-flash` (placeholder: `e.g. google/gemini-2.5-flash, deepseek/deepseek-chat-v3:free`).
  3. **Inspecting Directives**: Clicking **Preview Directives** opens the modal with a new tab for `hermes_prompt.txt`, showing the exact 4-stage pipeline instruction file and the resolved CLI command with current provider/model flags.
  4. **Saving & Building**: Clicking **Save Manifest** or **Build CapCut Draft** writes `manifest.json`, `AGENTS.md`, `CLAUDE.md`, and `hermes_prompt.txt` into `<workspace_dir>`, then spawns `hermes chat` with live stdout/stderr streamed to the bottom console drawer.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: High-craft dark NLE studio workspace (`#0B0F17` canvas, `#0E131F` structural bar surfaces, `1px` `#1E293B` hairline borders).
  - *Color Palette & Mood*: Dominant deep slate canvas (60%), elevated slate control surfaces (30%), and high-intent amber (`#F59E0B`) primary action accents (10%).
  - *Typography & Hierarchy*: `Plus Jakarta Sans` for section headers, `Public Sans` for form labels, and `JetBrains Mono` (`tabular-nums`) for provider/model identifiers, CLI flags, and SSE console timestamps.
  - *Component Styling & Layout*: Single-row inline inputs in Panel C (`h-8`, `px-3`, `text-xs font-mono`) that align seamlessly with the CLI Agent dropdown without adding nested boxes or visual clutter.
- **Interactive Feedback & Motion**: Instant conditional rendering of the inline Provider and Model ID fields when switching between `Hermes Agent`, `Claude Code`, and `OpenCode`, paired with toast confirmation on manifest save and live SSE event streaming in the collapsible console drawer.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: File-Based Prompt Passing (`--query-file hermes_prompt.txt`)**
  - *Chosen Approach*: Write the 4-stage pipeline directive to `<workspace_dir>/hermes_prompt.txt` during `POST /api/save-manifest` and pass `--query-file hermes_prompt.txt` to `hermes chat`.
  - *Why*: Avoids cross-platform shell quoting issues and argument escaping hazards when spawning child processes, and persists the exact prompt artifact in the workspace directory for reproducibility.
  - *Alternatives Considered*: Passing long multi-sentence strings via inline `-q "..."` shell flags, which can break across different local shells.
- **Decision 2: Non-Interactive Execution via `--yolo` + `HERMES_YOLO_MODE=1`**
  - *Chosen Approach*: Supply both the `--yolo` CLI flag and `HERMES_YOLO_MODE: '1'` in the spawned child process environment alongside `--toolsets "terminal,skills,web" --verbose`.
  - *Why*: Background headless processes have no interactive stdin TTY; enforcing YOLO mode via both flag and environment variable guarantees the agent never stalls waiting for interactive tool approval.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌──────────────────────────────────────────────────────────────────────────┐
│                     React Frontend (NLE Workspace)                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Panel C: Agent Execution Bridge Bar                                │  │
│  │  • Agent Dropdown: [Hermes Agent (Headless -q) ▼]                  │  │
│  │  • Inline (when Hermes): [Provider: openrouter] [Model: gemini...] │  │
│  │  • Actions: [Preview Directives] [Save Manifest] [Build Draft]     │  │
│  └───────────────┬──────────────────────────────────┬─────────────────┘  │
│                  │ POST /api/save-manifest          │ POST /api/run-agent│
└──────────────────┼──────────────────────────────────┼────────────────────┘
                   ▼                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                Local Backend Bridge (server.ts & server.js)              │
│                                                                          │
│  ┌───────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │ Workspace File Generator          │  │ Child Process Orchestrator  │  │
│  │  • <workspace>/manifest.json      │  │  • spawn('hermes', [        │  │
│  │  • <workspace>/AGENTS.md          │  │      'chat', '--yolo',      │  │
│  │  • <workspace>/CLAUDE.md          │  │      '--query-file',        │  │
│  │  • <workspace>/hermes_prompt.txt  │  │      'hermes_prompt.txt',   │  │
│  └───────────────────────────────────┘  │      '--provider', provider,│  │
│                                         │      '--model', model,      │  │
│                                         │      '--toolsets',          │  │
│                                         │      'terminal,skills,web', │  │
│                                         │      '--verbose'            │  │
│                                         │    ], { env: HERMES_YOLO=1})│  │
│                                         └──────────────┬──────────────┘  │
│                                                        │ stdout / stderr │
│                                                        ▼                 │
│                                         ┌─────────────────────────────┐  │
│                                         │ SSE Stream (/api/agent-stream)│
│                                         └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - Extend `AgentConfig` (`agent_config` in `ProjectManifest`) to support:
    - `agent_type`: `'hermes' | 'claude-code' | 'opencode-cli' | 'opencode-server'` (defaulting to `'hermes'`).
    - `provider`: `string` (defaulting to `'openrouter'`).
    - `model`: `string` (defaulting to `'google/gemini-2.5-flash'`).
- **Interactive Component & State Mapping**:
  - Selecting `Hermes Agent (Headless -q)` in Panel C reveals the inline `Provider` and `Model ID` inputs bound directly to `manifest.agent_config.provider` and `manifest.agent_config.model`.
  - Clicking **Save Manifest** or **Build CapCut Draft** invokes `POST /api/save-manifest`, which writes `hermes_prompt.txt` containing:
    `Read manifest.json and AGENTS.md in the current working directory. Execute Stage 1 (yt-dlp/SearXNG + VLM check), Stage 2 (HyperFrames render), Stage 3 (Earshot SFX), and Stage 4 (pyCapCut draft injection).`
  - Clicking **Build CapCut Draft** invokes `POST /api/run-agent` with `{ manifest, agentType, provider, model, flags }`, spawning `hermes` in `<workspace_dir>` with `HERMES_YOLO_MODE=1` and streaming real-time line-by-line output over `/api/agent-stream` (with seamless simulation fallback if the local `hermes` binary is not installed in the preview container).
