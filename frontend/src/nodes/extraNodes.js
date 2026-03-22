// nodes/extraNodes.js
// ─────────────────────────────────────────────────────────────────────────────
// PART 1: Five new nodes showcasing the createNode factory.
// Each node is fully defined in a single createNode() call.
// No boilerplate, no repeated Handle/styling code.
// ─────────────────────────────────────────────────────────────────────────────

import { createNode } from './BaseNode';

// ── 1. API Call Node ──────────────────────────────────────────────────────────
export const APINode = createNode({
  title: 'API Call',
  icon:  '⇌',
  color: '#fb923c',
  typeTag: 'HTTP',
  fields: [
    {
      key: 'method', label: 'Method', type: 'select', default: 'GET',
      options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    {
      key: 'url', label: 'URL', type: 'text', default: '',
      placeholder: 'https://api.example.com/data',
    },
    {
      key: 'headers', label: 'Headers (JSON)', type: 'textarea', default: '{}',
      rows: 2, placeholder: '{"Authorization": "Bearer ..."}',
    },
  ],
  handles: {
    targets: [{ id: 'body',   label: 'Request Body' }],
    sources: [{ id: 'response', label: 'Response' }],
  },
});

// ── 2. Transform Node ─────────────────────────────────────────────────────────
export const TransformNode = createNode({
  title: 'Transform',
  icon:  '⟳',
  color: '#60a5fa',
  typeTag: 'LOGIC',
  fields: [
    {
      key: 'operation', label: 'Operation', type: 'select', default: 'passthrough',
      options: [
        { value: 'passthrough', label: 'Pass Through' },
        { value: 'uppercase',   label: 'Uppercase' },
        { value: 'lowercase',   label: 'Lowercase' },
        { value: 'trim',        label: 'Trim Whitespace' },
        { value: 'json_parse',  label: 'JSON Parse' },
        { value: 'json_stringify', label: 'JSON Stringify' },
        { value: 'custom',      label: 'Custom (JS Expression)' },
      ],
    },
    {
      key: 'expression', label: 'Expression (custom only)', type: 'textarea',
      default: 'return input;', placeholder: 'return input.toUpperCase();',
      rows: 2,
    },
  ],
  handles: {
    targets: [{ id: 'in',  label: 'Input' }],
    sources: [{ id: 'out', label: 'Output' }],
  },
});

// ── 3. Condition / Branch Node ────────────────────────────────────────────────
export const ConditionNode = createNode({
  title: 'Condition',
  icon:  '◇',
  color: '#fbbf24',
  typeTag: 'LOGIC',
  fields: [
    {
      key: 'condition', label: 'If Condition', type: 'text',
      default: 'input !== null', placeholder: 'e.g. value > 0',
    },
    {
      key: 'trueLabel',  label: 'True Branch Label',  type: 'text', default: 'True',
    },
    {
      key: 'falseLabel', label: 'False Branch Label', type: 'text', default: 'False',
    },
  ],
  handles: {
    targets: [{ id: 'in',    label: 'Input',         top: '50%' }],
    sources: [
      { id: 'true',  label: 'True Branch',  top: '35%' },
      { id: 'false', label: 'False Branch', top: '65%' },
    ],
  },
});

// ── 4. Note / Comment Node ────────────────────────────────────────────────────
export const NoteNode = createNode({
  title: 'Note',
  icon:  '✎',
  color: '#94a3b8',
  typeTag: 'UTIL',
  fields: [
    {
      key: 'content', label: 'Note Content', type: 'textarea',
      default: 'Add your notes here…',
      rows: 4,
    },
    {
      key: 'color', label: 'Accent', type: 'select', default: 'slate',
      options: [
        { value: 'slate',  label: '⬤ Slate'  },
        { value: 'yellow', label: '⬤ Yellow' },
        { value: 'cyan',   label: '⬤ Cyan'   },
        { value: 'green',  label: '⬤ Green'  },
      ],
    },
  ],
  handles: { targets: [], sources: [] }, // Notes have no connections
});

// ── 5. Merge Node ─────────────────────────────────────────────────────────────
export const MergeNode = createNode({
  title: 'Merge',
  icon:  '⊕',
  color: '#a3e635',
  typeTag: 'LOGIC',
  fields: [
    {
      key: 'strategy', label: 'Merge Strategy', type: 'select', default: 'concat',
      options: [
        { value: 'concat',     label: 'Concatenate' },
        { value: 'array',      label: 'Build Array' },
        { value: 'object',     label: 'Merge Objects' },
        { value: 'first',      label: 'First Non-null' },
        { value: 'template',   label: 'Template String' },
      ],
    },
    {
      key: 'separator', label: 'Separator (concat)', type: 'text',
      default: '\\n', placeholder: 'e.g. \\n or ,',
    },
    {
      key: 'template', label: 'Template (template mode)', type: 'text',
      default: '{{a}} {{b}}', placeholder: '{{input1}} and {{input2}}',
    },
  ],
  handles: {
    targets: [
      { id: 'a', label: 'Input A', top: '38%' },
      { id: 'b', label: 'Input B', top: '62%' },
    ],
    sources: [{ id: 'out', label: 'Merged Output' }],
  },
});

// ── 6. Prompt Template Node ───────────────────────────────────────────────────
export const PromptNode = createNode({
  title: 'Prompt Template',
  icon:  '✦',
  color: '#c084fc',
  typeTag: 'AI',
  fields: [
    {
      key: 'template', label: 'Template', type: 'textarea',
      default: 'Answer the following: {{question}}',
      rows: 4, placeholder: 'Use {{varName}} to inject inputs',
    },
    {
      key: 'role', label: 'Role', type: 'select', default: 'user',
      options: ['user', 'system', 'assistant'],
    },
  ],
  handles: {
    targets: [{ id: 'context', label: 'Context', top: '38%' }, { id: 'vars', label: 'Variables', top: '62%' }],
    sources: [{ id: 'out', label: 'Prompt Output' }],
  },
});

// ── 7. Image Input Node ───────────────────────────────────────────────────────
export const ImageInputNode = createNode({
  title: 'Image Input',
  icon:  '⬛',
  color: '#2dd4bf',
  typeTag: 'MEDIA',
  fields: [
    {
      key: 'source', label: 'Source', type: 'select', default: 'upload',
      options: [
        { value: 'upload', label: 'File Upload' },
        { value: 'url',    label: 'URL'         },
        { value: 'camera', label: 'Camera'      },
        { value: 'variable', label: 'Variable'  },
      ],
    },
    { key: 'url', label: 'Image URL', type: 'text', default: '', placeholder: 'https://…' },
    {
      key: 'format', label: 'Format', type: 'select', default: 'auto',
      options: ['auto', 'png', 'jpg', 'webp', 'gif'],
    },
  ],
  handles: {
    targets: [],
    sources: [{ id: 'image', label: 'Image Data' }],
  },
});

// ── 8. Audio Input Node ───────────────────────────────────────────────────────
export const AudioInputNode = createNode({
  title: 'Audio Input',
  icon:  '♪',
  color: '#fb7185',
  typeTag: 'MEDIA',
  fields: [
    {
      key: 'source', label: 'Source', type: 'select', default: 'upload',
      options: [
        { value: 'upload',    label: 'File Upload'  },
        { value: 'microphone',label: 'Microphone'   },
        { value: 'url',       label: 'URL Stream'   },
      ],
    },
    { key: 'url', label: 'Audio URL', type: 'text', default: '', placeholder: 'https://…' },
    {
      key: 'format', label: 'Format', type: 'select', default: 'auto',
      options: ['auto', 'mp3', 'wav', 'ogg', 'm4a'],
    },
  ],
  handles: {
    targets: [],
    sources: [
      { id: 'audio',      label: 'Audio Data',   top: '40%' },
      { id: 'transcript', label: 'Transcript',   top: '65%' },
    ],
  },
});

// ── 9. Image Output Node ──────────────────────────────────────────────────────
export const ImageOutputNode = createNode({
  title: 'Image Output',
  icon:  '⬚',
  color: '#34d399',
  typeTag: 'MEDIA',
  fields: [
    {
      key: 'displayMode', label: 'Display Mode', type: 'select', default: 'inline',
      options: ['inline', 'download', 'url_only'],
    },
    { key: 'filename', label: 'Filename', type: 'text', default: 'output.png', placeholder: 'output.png' },
  ],
  handles: {
    targets: [{ id: 'image', label: 'Image Data' }],
    sources: [],
  },
});

// ── 10. Ollama Generate Node (direct /api/generate — like the curl example) ──
export const OllamaGenerateNode = createNode({
  title: 'Ollama Generate',
  icon:  '◈',
  color: '#a78bfa',
  typeTag: 'OLLAMA',
  fields: [
    {
      key: 'model', label: 'Model', type: 'select', default: 'llama3',
      options: ['llama3','llama3.2','llama3:8b','llama3:70b','mistral','codellama','phi3','gemma','mixtral','llava'],
    },
    {
      key: 'prompt', label: 'Static Prompt (optional)', type: 'textarea',
      default: '', placeholder: 'Or connect a Text/Input node to override this',
      rows: 3,
    },
    {
      key: 'systemPrompt', label: 'System Prompt', type: 'textarea',
      default: 'You are a helpful assistant.',
      rows: 2,
    },
    {
      key: 'temperature', label: 'Temperature', type: 'number',
      default: '0.7', min: 0, max: 2, step: 0.1,
    },
    {
      key: 'maxTokens', label: 'Max Tokens', type: 'number',
      default: '1000', min: 1,
    },
  ],
  handles: {
    targets: [
      { id: 'prompt', label: 'Prompt (text)',   top: '35%' },
      { id: 'system', label: 'System Prompt',   top: '65%' },
    ],
    sources: [
      { id: 'response', label: 'Response' },
    ],
  },
});

// ── n8n-style realistic nodes ─────────────────────────────────────────────────

export const HttpRequestNode = createNode({
  title: 'HTTP Request', icon: '⇌', color: '#fb923c', typeTag: 'HTTP',
  fields: [
    { key: 'method',  label: 'Method',   type: 'select', default: 'GET', options: ['GET','POST','PUT','PATCH','DELETE','HEAD'] },
    { key: 'url',     label: 'URL',      type: 'text',   default: '', placeholder: 'https://api.example.com/endpoint' },
    { key: 'headers', label: 'Headers',  type: 'textarea', default: '{\n  "Content-Type": "application/json"\n}', rows: 3 },
    { key: 'body',    label: 'Body',     type: 'textarea', default: '', rows: 3, placeholder: '{"key": "value"}' },
    { key: 'auth',    label: 'Auth',     type: 'select', default: 'none', options: ['none','bearer','basic','api-key'] },
    { key: 'authVal', label: 'Auth Value', type: 'text', default: '', placeholder: 'Token or API key' },
  ],
  handles: { targets: [{ id: 'body', label: 'Body' }], sources: [{ id: 'response', label: 'Response' }, { id: 'status', label: 'Status', top: '65%' }] },
});

export const IfNode = createNode({
  title: 'If / Else', icon: '◇', color: '#fbbf24', typeTag: 'LOGIC',
  fields: [
    { key: 'condition', label: 'Condition (JS)', type: 'text', default: 'input !== null', placeholder: 'e.g. input.length > 0' },
    { key: 'trueLabel',  label: 'True path label',  type: 'text', default: 'True' },
    { key: 'falseLabel', label: 'False path label', type: 'text', default: 'False' },
  ],
  handles: { targets: [{ id: 'in', label: 'Input', top: '50%' }], sources: [{ id: 'true', label: 'True', top: '35%' }, { id: 'false', label: 'False', top: '65%' }] },
});

export const SwitchNode = createNode({
  title: 'Switch', icon: '⊡', color: '#f59e0b', typeTag: 'LOGIC',
  fields: [
    { key: 'field',   label: 'Field to match', type: 'text', default: 'type', placeholder: 'input.type' },
    { key: 'cases',   label: 'Cases (JSON)',    type: 'textarea', default: '["case_a", "case_b", "default"]', rows: 3 },
  ],
  handles: { targets: [{ id: 'in', label: 'Input' }], sources: [{ id: 'out1', label: 'Case 1', top: '30%' }, { id: 'out2', label: 'Case 2', top: '55%' }, { id: 'default', label: 'Default', top: '80%' }] },
});

export const CodeNode = createNode({
  title: 'Code', icon: '{}', color: '#38bdf8', typeTag: 'CODE',
  fields: [
    { key: 'language', label: 'Language', type: 'select', default: 'javascript', options: ['javascript', 'python (stub)'] },
    { key: 'code', label: 'Code', type: 'textarea', default: '// Access input via: input\n// Return the result:\nreturn input;', rows: 6 },
  ],
  handles: { targets: [{ id: 'in', label: 'Input' }], sources: [{ id: 'out', label: 'Output' }] },
});

export const SetVariableNode = createNode({
  title: 'Set Variable', icon: '×', color: '#94a3b8', typeTag: 'DATA',
  fields: [
    { key: 'varName',  label: 'Variable Name', type: 'text', default: 'myVar', placeholder: 'e.g. userName' },
    { key: 'varValue', label: 'Value',          type: 'text', default: '', placeholder: 'Static value or leave empty for input' },
    { key: 'varType',  label: 'Type',           type: 'select', default: 'string', options: ['string','number','boolean','json'] },
  ],
  handles: { targets: [{ id: 'in', label: 'Input' }], sources: [{ id: 'out', label: 'Output' }] },
});

export const LoopNode = createNode({
  title: 'Loop', icon: '↺', color: '#34d399', typeTag: 'LOGIC',
  fields: [
    { key: 'mode',      label: 'Mode',        type: 'select', default: 'forEach', options: ['forEach', 'map', 'filter', 'reduce'] },
    { key: 'batchSize', label: 'Batch Size',  type: 'number', default: '1', min: 1 },
  ],
  handles: { targets: [{ id: 'array', label: 'Array Input' }], sources: [{ id: 'item', label: 'Each Item', top: '38%' }, { id: 'done', label: 'When Done', top: '65%' }] },
});

export const ScheduleNode = createNode({
  title: 'Schedule', icon: '⏰', color: '#60a5fa', typeTag: 'TRIGGER',
  fields: [
    { key: 'cron',       label: 'Cron Expression', type: 'text', default: '0 9 * * 1-5', placeholder: '0 9 * * 1-5' },
    { key: 'timezone',   label: 'Timezone',         type: 'text', default: 'UTC', placeholder: 'America/New_York' },
    { key: 'description',label: 'Human-readable',   type: 'text', default: 'Weekdays at 9am', placeholder: 'Describe the schedule' },
  ],
  handles: { targets: [], sources: [{ id: 'trigger', label: 'On Schedule' }] },
});

export const WebhookNode = createNode({
  title: 'Webhook', icon: '⚡', color: '#f97316', typeTag: 'TRIGGER',
  fields: [
    { key: 'path',   label: 'Endpoint Path',   type: 'text', default: '/webhook/my-flow', placeholder: '/webhook/my-flow' },
    { key: 'method', label: 'HTTP Method',      type: 'select', default: 'POST', options: ['POST','GET','PUT'] },
    { key: 'secret', label: 'Secret (optional)', type: 'text', default: '', placeholder: 'Signing secret' },
  ],
  handles: { targets: [], sources: [{ id: 'body', label: 'Request Body', top: '38%' }, { id: 'headers', label: 'Headers', top: '65%' }] },
});

export const EmailSendNode = createNode({
  title: 'Send Email', icon: '✉', color: '#60a5fa', typeTag: 'COMMS',
  fields: [
    { key: 'to',      label: 'To',      type: 'text', default: '', placeholder: 'recipient@example.com' },
    { key: 'subject', label: 'Subject', type: 'text', default: '', placeholder: 'Email subject' },
    { key: 'body',    label: 'Body',    type: 'textarea', default: '', rows: 3 },
    { key: 'from',    label: 'From',    type: 'text', default: '', placeholder: 'sender@example.com' },
    { key: 'smtp',    label: 'SMTP Host', type: 'text', default: 'smtp.gmail.com', placeholder: 'smtp.gmail.com' },
  ],
  handles: { targets: [{ id: 'body', label: 'Body' }, { id: 'to', label: 'To (dynamic)', top: '65%' }], sources: [{ id: 'sent', label: 'On Sent' }] },
});

export const SlackMsgNode = createNode({
  title: 'Slack Message', icon: '💬', color: '#4ade80', typeTag: 'COMMS',
  fields: [
    { key: 'channel',  label: 'Channel',   type: 'text', default: '#general', placeholder: '#channel or @user' },
    { key: 'message',  label: 'Message',   type: 'textarea', default: '', rows: 3 },
    { key: 'botToken', label: 'Bot Token', type: 'text', default: '', placeholder: 'xoxb-...' },
  ],
  handles: { targets: [{ id: 'message', label: 'Message' }], sources: [{ id: 'response', label: 'Response' }] },
});

export const DbQueryNode = createNode({
  title: 'Database Query', icon: '🗄', color: '#6ee7b7', typeTag: 'DATA',
  fields: [
    { key: 'dbType',  label: 'Database',  type: 'select', default: 'postgres', options: ['postgres','mysql','sqlite','mongodb','redis'] },
    { key: 'host',    label: 'Host',      type: 'text', default: 'localhost', placeholder: 'localhost:5432' },
    { key: 'query',   label: 'Query / Command', type: 'textarea', default: 'SELECT * FROM users LIMIT 10;', rows: 4 },
    { key: 'dbName',  label: 'Database Name', type: 'text', default: 'mydb' },
  ],
  handles: { targets: [{ id: 'params', label: 'Query Params' }], sources: [{ id: 'rows', label: 'Rows / Result' }] },
});

export const CsvReadNode = createNode({
  title: 'CSV Read', icon: '≡', color: '#86efac', typeTag: 'DATA',
  fields: [
    { key: 'source',    label: 'Source',    type: 'select', default: 'file', options: ['file','url','string'] },
    { key: 'path',      label: 'Path / URL',type: 'text', default: '', placeholder: '/data/input.csv' },
    { key: 'delimiter', label: 'Delimiter', type: 'text', default: ',', placeholder: ',' },
    { key: 'hasHeader', label: 'Has Header Row', type: 'select', default: 'yes', options: ['yes','no'] },
  ],
  handles: { targets: [{ id: 'data', label: 'CSV String' }], sources: [{ id: 'rows', label: 'Rows (JSON)', top: '38%' }, { id: 'headers', label: 'Headers', top: '65%' }] },
});

export const DelayNode = createNode({
  title: 'Delay / Wait', icon: '⏱', color: '#94a3b8', typeTag: 'UTIL',
  fields: [
    { key: 'duration', label: 'Duration (seconds)', type: 'number', default: '2', min: 0, step: 0.5 },
    { key: 'unit',     label: 'Unit', type: 'select', default: 'seconds', options: ['milliseconds','seconds','minutes'] },
  ],
  handles: { targets: [{ id: 'in', label: 'Input' }], sources: [{ id: 'out', label: 'Output (after delay)' }] },
});
