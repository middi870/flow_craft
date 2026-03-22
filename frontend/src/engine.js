// engine.js — FlowCraft Pipeline Execution Engine v2
// ─────────────────────────────────────────────────────────────────────────────
// Runs a pipeline fully in the browser via an async generator.
//
// Flow:
//   1. Topological sort (Kahn's algorithm)
//   2. Walk nodes in order; gather upstream outputs into this node's inputs
//   3. Execute node → store its outputs keyed by handle name
//   4. Yield events: start / nodeStart / stream / nodeDone / nodeError / output / done
//
// Outputs map: { "{nodeId}-{suffix}": value }  shared across entire run
// ─────────────────────────────────────────────────────────────────────────────

const OLLAMA = 'http://localhost:11434';

// ── Helpers ───────────────────────────────────────────────────────────────────

const interpolate = (template, vars) =>
  String(template ?? '').replace(
    /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g,
    (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{{${k}}}`)
  );

const topoSort = (nodes, edges) => {
  const ids   = nodes.map(n => n.id);
  const inDeg = Object.fromEntries(ids.map(id => [id, 0]));
  const adj   = Object.fromEntries(ids.map(id => [id, []]));

  for (const e of edges) {
    if (inDeg[e.source] !== undefined && inDeg[e.target] !== undefined) {
      adj[e.source].push(e.target);
      inDeg[e.target]++;
    }
  }

  const queue = ids.filter(id => inDeg[id] === 0);
  const order = [];
  while (queue.length) {
    const n = queue.shift();
    order.push(n);
    for (const nb of adj[n]) {
      if (--inDeg[nb] === 0) queue.push(nb);
    }
  }

  if (order.length !== ids.length) throw new Error('Pipeline has a cycle — fix it before running');
  return order;
};

const gatherInputs = (nodeId, edges, outputs) => {
  const result = {};
  for (const e of edges) {
    if (e.target === nodeId && outputs[e.sourceHandle] !== undefined) {
      const suffix = e.targetHandle?.replace(`${nodeId}-`, '') ?? e.targetHandle;
      result[suffix] = outputs[e.sourceHandle];
    }
  }
  return result;
};

// Get the first available input value regardless of handle name
const firstInput = (inputs) => Object.values(inputs)[0] ?? '';

// ── Ollama streaming helper ───────────────────────────────────────────────────
async function* streamOllama(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${(await res.text()).slice(0,120)}`);

  const reader = res.body.getReader();
  const dec    = new TextDecoder();
  let   full   = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of dec.decode(value).split('\n').filter(Boolean)) {
      try {
        const chunk = JSON.parse(line);
        const delta = chunk.message?.content ?? chunk.response ?? '';
        if (delta) { full += delta; yield { delta, full }; }
      } catch {}
    }
  }
}

// ── Node executors ────────────────────────────────────────────────────────────
const executors = {

  // ── I/O ────────────────────────────────────────────────────────────────────
  customInput: async ({ node, userInputs }) => ({
    value: userInputs[node.id] ?? node.data.defaultValue ?? '',
  }),

  customOutput: async ({ inputs }) => ({
    _output: inputs.value ?? firstInput(inputs) ?? '',
  }),

  // ── LLM /api/chat ──────────────────────────────────────────────────────────
  llm: async function* ({ node, inputs }) {
    const model      = node.data.model      || 'llama3.2';
    const systemText = inputs.system        || node.data.systemPrompt || 'You are a helpful assistant.';
    const userText   = inputs.prompt        || inputs.value           || firstInput(inputs) || '';
    const temp       = parseFloat(node.data.temperature ?? 0.7);
    const maxTok     = parseInt(node.data.maxTokens ?? 1000);

    let full = '';
    for await (const { delta, full: f } of streamOllama(`${OLLAMA}/api/chat`, {
      model, stream: true,
      messages: [{ role: 'system', content: systemText }, { role: 'user', content: userText }],
      options: { temperature: temp, num_predict: maxTok },
    })) {
      full = f;
      yield { _stream: full };
    }
    return { response: full };
  },

  // ── Ollama /api/generate (like the curl example) ────────────────────────────
  ollamaGenerate: async function* ({ node, inputs }) {
    const model  = node.data.model         || 'llama3';
    const prompt = inputs.prompt           || inputs.value || node.data.prompt || '';
    const system = inputs.system           || node.data.systemPrompt || '';
    const temp   = parseFloat(node.data.temperature ?? 0.7);
    const maxTok = parseInt(node.data.maxTokens ?? 1000);

    let full = '';
    for await (const { full: f } of streamOllama(`${OLLAMA}/api/generate`, {
      model, prompt, stream: true,
      ...(system ? { system } : {}),
      options: { temperature: temp, num_predict: maxTok },
    })) {
      full = f;
      yield { _stream: full };
    }
    return { response: full };
  },

  // ── Text / Prompt template ──────────────────────────────────────────────────
  text: async ({ node, inputs }) => ({
    output: interpolate(node.data.text || '', inputs),
  }),

  prompt: async ({ node, inputs }) => ({
    out: interpolate(node.data.template || '', inputs),
  }),

  // ── HTTP / API ──────────────────────────────────────────────────────────────
  api: async ({ node, inputs }) => {
    const method  = node.data.method || 'GET';
    const url     = interpolate(node.data.url || '', inputs);
    let   headers = {};
    try { headers = JSON.parse(interpolate(node.data.headers || '{}', inputs)); } catch {}

    const hasBody = ['POST','PUT','PATCH'].includes(method);
    const body    = hasBody
      ? interpolate(node.data.body || '', { ...inputs, input: inputs.body ?? firstInput(inputs) })
      : undefined;

    const res  = await fetch(url, { method, headers, body });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0,200)}`);
    let parsed = text;
    try { parsed = JSON.stringify(JSON.parse(text), null, 2); } catch {}
    return { response: parsed };
  },

  httpRequest: async ({ node, inputs }) => {
    const method  = node.data.method || 'GET';
    const url     = interpolate(node.data.url || '', inputs);
    let   headers = {};
    try { headers = JSON.parse(interpolate(node.data.headers || '{}', inputs)); } catch {}

    // Auth injection
    const auth    = node.data.auth;
    const authVal = node.data.authVal || '';
    if (auth === 'bearer') headers['Authorization'] = `Bearer ${authVal}`;
    if (auth === 'api-key') headers['X-API-Key'] = authVal;
    if (auth === 'basic') headers['Authorization'] = `Basic ${btoa(authVal)}`;

    const hasBody = ['POST','PUT','PATCH'].includes(method);
    const body    = hasBody
      ? interpolate(node.data.body || '', { ...inputs, input: inputs.body ?? firstInput(inputs) })
      : undefined;

    const res    = await fetch(url, { method, headers, body });
    const text   = await res.text();
    const status = String(res.status);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0,200)}`);
    let parsed = text;
    try { parsed = JSON.stringify(JSON.parse(text), null, 2); } catch {}
    return { response: parsed, status };
  },

  // ── Data transforms ─────────────────────────────────────────────────────────
  transform: async ({ node, inputs }) => {
    const input = inputs.in ?? inputs.value ?? firstInput(inputs) ?? '';
    switch (node.data.operation || 'passthrough') {
      case 'uppercase':      return { out: String(input).toUpperCase() };
      case 'lowercase':      return { out: String(input).toLowerCase() };
      case 'trim':           return { out: String(input).trim() };
      case 'json_parse':     return { out: JSON.stringify(JSON.parse(input), null, 2) };
      case 'json_stringify': return { out: JSON.stringify(typeof input === 'string' ? JSON.parse(input) : input) };
      case 'custom': {
        // eslint-disable-next-line no-new-func
        const result = new Function('input', node.data.expression || 'return input;')(input);
        return { out: String(result ?? '') };
      }
      default: return { out: String(input) };
    }
  },

  code: async ({ node, inputs }) => {
    const input = inputs.in ?? firstInput(inputs) ?? '';
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function('input', 'inputs', node.data.code || 'return input;')(input, inputs);
      return { out: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result ?? '') };
    } catch (e) {
      throw new Error(`Code error: ${e.message}`);
    }
  },

  setVariable: async ({ node, inputs }) => {
    const val = node.data.varValue || inputs.in || firstInput(inputs) || '';
    return { out: val };
  },

  csvRead: async ({ node, inputs }) => {
    const raw = inputs.data || node.data.path || firstInput(inputs) || '';
    const delim = node.data.delimiter || ',';
    try {
      const lines = raw.split('\n').filter(l => l.trim());
      const headers = node.data.hasHeader === 'no' ? null : lines[0]?.split(delim).map(h => h.trim());
      const data = (headers ? lines.slice(1) : lines).map(line => {
        const vals = line.split(delim).map(v => v.trim().replace(/^"|"$/g, ''));
        if (headers) return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
        return vals;
      });
      return { rows: JSON.stringify(data, null, 2), headers: JSON.stringify(headers) };
    } catch (e) {
      throw new Error(`CSV parse error: ${e.message}`);
    }
  },

  // ── Flow control ────────────────────────────────────────────────────────────
  condition: async ({ node, inputs }) => {
    const input = inputs.in ?? inputs.value ?? firstInput(inputs) ?? '';
    let passed = false;
    try {
      // eslint-disable-next-line no-new-func
      passed = !!new Function('input', 'value', `return (${node.data.condition || 'true'})`)(input, input);
    } catch {}
    return passed ? { true: input, _branch: 'true' } : { false: input, _branch: 'false' };
  },

  ifNode: async ({ node, inputs }) => {
    const input = inputs.in ?? firstInput(inputs) ?? '';
    let passed = false;
    try {
      // eslint-disable-next-line no-new-func
      passed = !!new Function('input', 'value', `return (${node.data.condition || 'true'})`)(input, input);
    } catch {}
    return passed ? { true: input } : { false: input };
  },

  switchNode: async ({ node, inputs }) => {
    const input = inputs.in ?? firstInput(inputs) ?? '';
    let cases = [];
    try { cases = JSON.parse(node.data.cases || '[]'); } catch {}
    const fieldPath = node.data.field || '';
    let val = input;
    if (fieldPath) {
      try { val = fieldPath.split('.').reduce((o, k) => (typeof o === 'string' ? JSON.parse(o) : o)?.[k], input); } catch {}
    }
    const idx = cases.indexOf(String(val));
    if (idx === 0) return { out1: input };
    if (idx === 1) return { out2: input };
    return { default: input };
  },

  merge: async ({ node, inputs }) => {
    const a   = inputs.a ?? '';
    const b   = inputs.b ?? '';
    const sep = (node.data.separator || '\n').replace(/\\n/g, '\n');
    switch (node.data.strategy || 'concat') {
      case 'array':    return { out: JSON.stringify([a, b]) };
      case 'object':   return { out: JSON.stringify({ a, b }) };
      case 'first':    return { out: String(a || b) };
      case 'template': return { out: interpolate(node.data.template || '{{a}} {{b}}', { a, b }) };
      default:         return { out: [a, b].filter(Boolean).join(sep) };
    }
  },

  loop: async ({ node, inputs }) => {
    const raw = inputs.array ?? firstInput(inputs) ?? '[]';
    let arr = [];
    try { arr = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch {}
    if (!Array.isArray(arr)) arr = [arr];
    // We emit the whole array and let downstream handle iteration
    return { item: JSON.stringify(arr[0] ?? null), done: JSON.stringify(arr) };
  },

  delay: async ({ node, inputs }) => {
    const unit = node.data.unit || 'seconds';
    const dur  = parseFloat(node.data.duration ?? 1);
    const ms   = unit === 'milliseconds' ? dur : unit === 'minutes' ? dur * 60000 : dur * 1000;
    await new Promise(r => setTimeout(r, Math.min(ms, 30000))); // cap at 30s
    return { out: firstInput(inputs) ?? '' };
  },

  // ── Triggers (just pass a start signal when executed manually) ─────────────
  schedule: async ({ node }) => ({
    trigger: JSON.stringify({ timestamp: new Date().toISOString(), cron: node.data.cron }),
  }),

  webhook: async ({ node }) => ({
    body:    JSON.stringify({ message: 'Webhook triggered manually for testing' }),
    headers: JSON.stringify({ 'content-type': 'application/json' }),
  }),

  // ── Comms — stubs with helpful messages (can't send real email in browser) ──
  emailSend: async ({ node, inputs }) => {
    const preview = {
      to:      node.data.to || inputs.to || '(no recipient)',
      subject: node.data.subject || '(no subject)',
      body:    inputs.body || node.data.body || '(no body)',
      via:     node.data.smtp || 'smtp.gmail.com',
    };
    // In a real deployment this would hit a backend endpoint
    console.log('[FlowCraft] Email preview:', preview);
    return { sent: JSON.stringify({ status: 'preview', ...preview }) };
  },

  slackMsg: async ({ node, inputs }) => {
    const preview = {
      channel: node.data.channel || '#general',
      message: inputs.message || node.data.message || firstInput(inputs) || '',
    };
    console.log('[FlowCraft] Slack preview:', preview);
    return { response: JSON.stringify({ status: 'preview', ...preview }) };
  },

  dbQuery: async ({ node, inputs }) => {
    const preview = {
      db:    node.data.dbType || 'postgres',
      host:  node.data.host   || 'localhost',
      query: interpolate(node.data.query || '', { ...inputs, input: firstInput(inputs) }),
    };
    console.log('[FlowCraft] DB query preview:', preview);
    return { rows: JSON.stringify([{ _note: 'Connect a real DB endpoint to execute', query: preview.query }]) };
  },

  // ── Media ──────────────────────────────────────────────────────────────────
  note:        async ()              => ({ _skip: true }),
  imageInput:  async ({ node, inputs }) => ({ image: inputs.image || node.data.url || '' }),
  audioInput:  async ({ node, inputs }) => ({ audio: inputs.audio || node.data.url || '' }),
  imageOutput: async ({ node, inputs }) => ({ _output: inputs.image || '' }),
};

// ── Main generator ─────────────────────────────────────────────────────────────
/**
 * Events yielded:
 *   { type:'start',     total }
 *   { type:'nodeStart', nodeId, label }
 *   { type:'stream',    nodeId, text }      ← LLM token stream
 *   { type:'nodeDone',  nodeId, outputs }
 *   { type:'nodeError', nodeId, error }
 *   { type:'output',    nodeId, name, value }
 *   { type:'done',      results }
 *   { type:'error',     error }
 */
export async function* runPipeline(nodes, edges, userInputs = {}) {
  let order;
  try {
    order = topoSort(nodes, edges);
  } catch (e) {
    yield { type: 'error', error: e.message };
    return;
  }

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));
  const outputs = {};   // { handleName: value }
  const results = {};

  yield { type: 'start', total: order.length };

  for (const nodeId of order) {
    const node  = nodeMap[nodeId];
    if (!node) continue;

    const label  = node.data.name || node.data.title || node.type;
    const inputs = gatherInputs(nodeId, edges, outputs);
    const exec   = executors[node.type];

    yield { type: 'nodeStart', nodeId, label };

    if (!exec) {
      // Unknown node type — pass input through
      outputs[`${nodeId}-out`] = firstInput(inputs);
      yield { type: 'nodeDone', nodeId, outputs: {} };
      continue;
    }

    try {
      // Some executors are async generators (LLM streaming), others are plain async
      const execResult = exec({ node, inputs, userInputs });
      let finalOutputs = {};

      if (execResult && typeof execResult[Symbol.asyncIterator] === 'function') {
        // Streaming generator
        let lastReturn;
        for await (const chunk of execResult) {
          if (chunk._stream !== undefined) {
            // Live stream token
            yield { type: 'stream', nodeId, text: chunk._stream };
            outputs[`${nodeId}-response`] = chunk._stream; // update live
          } else {
            lastReturn = chunk;
          }
        }
        // After generator finishes, the return value is in the last non-stream yield
        // For generators, collect non-stream properties
        if (lastReturn) finalOutputs = lastReturn;
        // If only streaming happened, the response is already in outputs
        if (!finalOutputs.response && outputs[`${nodeId}-response`]) {
          finalOutputs.response = outputs[`${nodeId}-response`];
        }
      } else {
        // Plain async
        finalOutputs = await execResult;
      }

      // Store outputs
      for (const [suffix, value] of Object.entries(finalOutputs)) {
        if (!suffix.startsWith('_')) {
          outputs[`${nodeId}-${suffix}`] = value;
        }
      }

      // Emit customOutput result
      if (node.type === 'customOutput' && finalOutputs._output !== undefined) {
        const name = node.data.outputName || nodeId;
        yield { type: 'output', nodeId, name, value: finalOutputs._output };
      }

      results[nodeId] = finalOutputs;
      yield { type: 'nodeDone', nodeId, outputs: finalOutputs };

    } catch (e) {
      yield { type: 'nodeError', nodeId, error: e.message };
      // Don't abort — skip this node and continue
    }
  }

  yield { type: 'done', results };
}

export const executePipeline = runPipeline;
