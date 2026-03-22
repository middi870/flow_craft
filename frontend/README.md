# ⟡ FlowCraft — VectorShift Frontend Assessment

A production-quality visual pipeline builder built with React + React Flow + FastAPI.

---

## Quick Start

### Frontend
```bash
cd flowcraft-app
npm install
npm start
# → http://localhost:3000
```

### Backend
```bash
cd flowcraft-app/backend
pip install fastapi uvicorn pydantic
uvicorn main:app --reload --port 8000
```

### AI Assistant (optional)
```bash
ollama serve          # must already be installed
ollama pull llama3.2
```

---

## Assessment Coverage

### Part 1 — Node Abstraction ✅
**File:** `src/nodes/BaseNode.js`

Created `BaseNode` — a single shared component where every node defines only what makes it unique: `title`, `icon`, `color`, `fields[]`, and `handles{}`. Auto-renders form controls, handles, and styling.

Created `createNode(config)` factory — new nodes can be defined in ~15 lines.

**5 new nodes** built with the factory (`src/nodes/extraNodes.js`):
- **API Call** — HTTP method, URL, headers
- **Transform** — passthrough / map / custom JS expression
- **Condition** — if/else branch with two output handles
- **Note** — comment block (no handles)
- **Merge** — combine two inputs (concat, array, object, template)

### Part 2 — Styling ✅
Full dark-theme design system using CSS variables (`src/index.css`):
- JetBrains Mono + Syne display font
- 9-node color palette with glow effects
- React Flow handle, edge, and control overrides
- Responsive toolbar, right panel, toast notifications
- Animated node cards, smooth connections, minimap

### Part 3 — Text Node Logic ✅
**File:** `src/nodes/textNode.js`

1. **Auto-resize** — textarea grows in height AND width as the user types. Width is computed from the longest line length × estimated character width, clamped between 194px–520px.

2. **Variable handles** — regex `\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}` extracts variable names from the text in real time. Each unique variable gets a Target Handle on the left side. Removing a variable from the text removes its handle. Variable chips are shown below the textarea.

### Part 4 — Backend Integration ✅
**Backend:** `backend/main.py`  
**Frontend:** `src/submit.js` + `src/components/ValidationModal.js`

- Submit button calls `POST /pipelines/parse` with the serialised nodes + edges
- Backend runs Kahn's algorithm for DAG detection
- Returns `{ num_nodes, num_edges, is_dag }`
- Frontend shows a styled `ValidationModal` with stat cards and a plain-language explanation
- Error handling for unreachable backend

---

## Project Structure

```
flowcraft-app/
├── backend/
│   └── main.py                   ← FastAPI server (Part 4)
├── public/
│   └── index.html
└── src/
    ├── App.js                    ← Root layout
    ├── index.js
    ├── index.css                 ← Design system (Part 2)
    ├── store.js                  ← Zustand state
    ├── toolbar.js                ← Node palette header
    ├── ui.js                     ← Canvas + right panel
    ├── submit.js                 ← Submit + backend call (Part 4)
    ├── draggableNode.js          ← Toolbar node card
    ├── nodes/
    │   ├── BaseNode.js           ← Abstraction + createNode (Part 1)
    │   ├── inputNode.js          ← Input (uses BaseNode)
    │   ├── outputNode.js         ← Output (uses BaseNode)
    │   ├── llmNode.js            ← LLM (uses BaseNode)
    │   ├── textNode.js           ← Text with auto-resize + vars (Part 3)
    │   └── extraNodes.js         ← 5 new nodes via createNode (Part 1)
    └── components/
        ├── PropsPanel.js         ← Right panel property editor
        ├── AIPanel.js            ← Ollama AI chat assistant
        └── ValidationModal.js    ← Submit result modal (Part 4)
```
