// components/PropsPanel.js — Node property editor (all node types)
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';

const NODE_META = {
  customInput:    { label: 'Input Node',        color: '#22d3ee', icon: '▶' },
  customOutput:   { label: 'Output Node',       color: '#34d399', icon: '■' },
  llm:            { label: 'LLM Chat',          color: '#a78bfa', icon: '◈' },
  ollamaGenerate: { label: 'Ollama Generate',   color: '#7c6fcd', icon: '◈' },
  text:           { label: 'Text',              color: '#f472b6', icon: 'T'  },
  prompt:         { label: 'Prompt Template',   color: '#c084fc', icon: '✦' },
  api:            { label: 'API Call',          color: '#fb923c', icon: '⇌' },
  httpRequest:    { label: 'HTTP Request',      color: '#fb923c', icon: '⇌' },
  transform:      { label: 'Transform',         color: '#60a5fa', icon: '⟳' },
  code:           { label: 'Code',              color: '#38bdf8', icon: '{}' },
  setVariable:    { label: 'Set Variable',      color: '#94a3b8', icon: '×'  },
  condition:      { label: 'Condition',         color: '#fbbf24', icon: '◇' },
  ifNode:         { label: 'If / Else',         color: '#fbbf24', icon: '◇' },
  switchNode:     { label: 'Switch',            color: '#f59e0b', icon: '⊡' },
  merge:          { label: 'Merge',             color: '#a3e635', icon: '⊕' },
  loop:           { label: 'Loop',              color: '#34d399', icon: '↺' },
  delay:          { label: 'Delay / Wait',      color: '#94a3b8', icon: '⏱' },
  schedule:       { label: 'Schedule',          color: '#60a5fa', icon: '⏰' },
  webhook:        { label: 'Webhook',           color: '#f97316', icon: '⚡' },
  emailSend:      { label: 'Send Email',        color: '#60a5fa', icon: '✉'  },
  slackMsg:       { label: 'Slack Message',     color: '#4ade80', icon: '💬' },
  dbQuery:        { label: 'Database Query',    color: '#6ee7b7', icon: '🗄' },
  csvRead:        { label: 'CSV Read',          color: '#86efac', icon: '≡'  },
  note:           { label: 'Sticky Note',       color: '#94a3b8', icon: '✎' },
  imageInput:     { label: 'Image Input',       color: '#2dd4bf', icon: '⬛' },
  audioInput:     { label: 'Audio Input',       color: '#fb7185', icon: '♪'  },
  imageOutput:    { label: 'Image Output',      color: '#34d399', icon: '⬚' },
};

export const PropsPanel = ({ node }) => {
  const { updateNodeField, deleteNode } = useStore(
    s => ({ updateNodeField: s.updateNodeField, deleteNode: s.deleteNode }),
    shallow
  );

  if (!node) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 12, padding: '32px 20px', textAlign: 'center', color: 'var(--tx3)' }}>
      <div style={{ fontSize: 38, opacity: .18 }}>◎</div>
      <div style={{ fontSize: 12, lineHeight: 1.7 }}>Click any node on the canvas<br/>to edit its properties</div>
    </div>
  );

  const meta  = NODE_META[node.type] ?? { label: node.type, color: 'var(--accent)', icon: '●' };
  const color = meta.color;
  const upd   = (key, val) => updateNodeField(node.id, key, val);

  // ── Reusable field builders ──
  const Field = ({ label, fk, type = 'text', opts = [], ph = '', min, max, step, rows = 3 }) => {
    const val = node.data?.[fk] ?? '';
    const focus = e => { e.target.style.borderColor = color; };
    const blur  = e => { e.target.style.borderColor = ''; };
    return (
      <div className="fc-field" style={{ marginBottom: 10 }}>
        <label className="fc-field-label">{label}</label>
        {type === 'select' ? (
          <select className="fc-select" value={val} onChange={e => upd(fk, e.target.value)} onFocus={focus} onBlur={blur}>
            {opts.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
          </select>
        ) : type === 'textarea' ? (
          <textarea className="fc-textarea" value={val} rows={rows} onChange={e => upd(fk, e.target.value)}
            placeholder={ph} onFocus={focus} onBlur={blur} style={{ resize: 'vertical', minHeight: 60 }} />
        ) : (
          <input className="fc-input" type={type} value={val} onChange={e => upd(fk, e.target.value)}
            placeholder={ph} min={min} max={max} step={step} onFocus={focus} onBlur={blur} />
        )}
      </div>
    );
  };

  const Tip = ({ text }) => (
    <div style={{ padding: '9px 11px', background: 'var(--s3)', borderRadius: 6,
      border: '1px solid var(--bd)', fontSize: 11, color: 'var(--tx2)', lineHeight: 1.65, marginBottom: 10 }}>
      {text}
    </div>
  );



  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '14px 14px 20px' }}>

      {/* ── Node header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11,
        padding: '11px 13px', marginBottom: 16,
        background: `color-mix(in srgb, ${color} 8%, var(--s3))`,
        border: `1.5px solid color-mix(in srgb, ${color} 28%, transparent)`,
        borderRadius: 'var(--r2)',
      }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `color-mix(in srgb, ${color} 22%, transparent)`,
          color, fontSize: 15, fontWeight: 800 }}>
          {meta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{meta.label}</div>
          <div style={{ fontSize: 9.5, color, letterSpacing: .8, textTransform: 'uppercase', marginTop: 1 }}>id: {node.id}</div>
        </div>
        <button onClick={() => deleteNode(node.id)} style={{
          padding: '4px 9px', fontSize: 11, background: 'transparent',
          border: '1px solid var(--bd2)', borderRadius: 5, color: 'var(--tx2)', cursor: 'pointer', transition: 'all .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd2)'; e.currentTarget.style.color = 'var(--tx2)'; }}
        >✕ Delete</button>
      </div>

      {/* ── Per-type fields ── */}

      {node.type === 'customInput' && <>
        <Field label="Variable Name"  fk="inputName"    ph="e.g. user_query" />
        <Field label="Input Type"     fk="inputType"    type="select" opts={['Text','Number','JSON','Boolean','File']} />
        <Field label="Default Value"  fk="defaultValue" ph="Optional default if left blank" />
        <Field label="Description"    fk="description"  ph="Shown as hint in Run panel" />
      </>}

      {node.type === 'customOutput' && <>
        <Field label="Output Name"  fk="outputName" ph="e.g. result" />
        <Field label="Output Type"  fk="outputType" type="select" opts={['Text','JSON','File','Image','Number']} />
      </>}

      {(node.type === 'llm' || node.type === 'ollamaGenerate') && <>
        {node.type === 'ollamaGenerate' && (
          <Tip text={<>Calls <code style={{ color, background: 'var(--s4)', padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>POST /api/generate</code> — same as: <span style={{ color: 'var(--tx3)', fontSize: 10 }}>curl localhost:11434/api/generate</span></>} />
        )}
        <Field label="Model"         fk="model" type="select"
          opts={['llama3','llama3.2','llama3:8b','llama3:70b','mistral','codellama','phi3','gemma','mixtral','llava','deepseek-r1','qwen2']} />
        <Field label="System Prompt" fk="systemPrompt" type="textarea" rows={4} ph="You are a helpful assistant." />
        <Field label="Temperature"   fk="temperature"  type="number" min={0} max={2} step={0.1} />
        <Field label="Max Tokens"    fk="maxTokens"    type="number" min={1} />
      </>}

      {node.type === 'text' && (
        <Tip text={<>Edit text directly on the node.<br/>Use <b style={{ color }}>{'{{varName}}'}</b> to create input handles automatically.</>} />
      )}

      {node.type === 'prompt' && <>
        <Tip text="Use {{varName}} placeholders — each unique variable gets a target handle on the node." />
        <Field label="Template"  fk="template"  type="textarea" rows={5} ph="Answer this: {{question}}" />
        <Field label="Role"      fk="role"       type="select" opts={['user','system','assistant']} />
      </>}

      {(node.type === 'api' || node.type === 'httpRequest') && <>
        <Field label="Method"  fk="method"  type="select" opts={['GET','POST','PUT','PATCH','DELETE','HEAD']} />
        <Field label="URL"     fk="url"     ph="https://api.example.com/endpoint" />
        <Field label="Headers (JSON)" fk="headers" type="textarea" rows={3} ph={'{\n  "Authorization": "Bearer ..."\n}'} />
        <Field label="Body"    fk="body"    type="textarea" rows={3} ph='{"key": "value"}' />
        {node.type === 'httpRequest' && <>
          <Field label="Auth Type"  fk="auth"    type="select" opts={['none','bearer','basic','api-key']} />
          <Field label="Auth Value" fk="authVal" ph="Token / API key" />
        </>}
      </>}

      {node.type === 'transform' && <>
        <Field label="Operation" fk="operation" type="select" opts={[
          { value: 'passthrough',    label: 'Pass Through' },
          { value: 'uppercase',      label: 'Uppercase'    },
          { value: 'lowercase',      label: 'Lowercase'    },
          { value: 'trim',           label: 'Trim Whitespace' },
          { value: 'json_parse',     label: 'JSON → Pretty' },
          { value: 'json_stringify', label: 'Object → JSON string' },
          { value: 'custom',         label: 'Custom JS Expression' },
        ]} />
        <Field label="JS Expression (custom only)" fk="expression" type="textarea" rows={4}
          ph="return input.toUpperCase();" />
      </>}

      {node.type === 'code' && <>
        <Tip text="Access data via: input (first input), inputs (all handles). Return the result." />
        <Field label="Language" fk="language" type="select" opts={['javascript','python (stub)']} />
        <Field label="Code"     fk="code"     type="textarea" rows={7}
          ph={'// input = first connected value\nreturn input;'} />
      </>}

      {node.type === 'setVariable' && <>
        <Field label="Variable Name"  fk="varName"  ph="myVar" />
        <Field label="Static Value"   fk="varValue" ph="Or leave blank to use input" />
        <Field label="Type"           fk="varType"  type="select" opts={['string','number','boolean','json']} />
      </>}

      {(node.type === 'condition' || node.type === 'ifNode') && <>
        <Tip text="Write a JavaScript expression. The input value is available as: input" />
        <Field label="Condition"    fk="condition"  ph="input.length > 0" />
        <Field label="True Label"   fk="trueLabel"  ph="True" />
        <Field label="False Label"  fk="falseLabel" ph="False" />
      </>}

      {node.type === 'switchNode' && <>
        <Field label="Field to Match"  fk="field" ph="input.type  or  leave blank for whole value" />
        <Field label="Cases (JSON array)" fk="cases" type="textarea" rows={3}
          ph='["case_a", "case_b", "default"]' />
      </>}

      {node.type === 'merge' && <>
        <Field label="Strategy" fk="strategy" type="select" opts={[
          { value: 'concat',   label: 'Concatenate text' },
          { value: 'array',    label: 'Build array [a, b]' },
          { value: 'object',   label: 'Merge objects {a, b}' },
          { value: 'first',    label: 'First non-empty' },
          { value: 'template', label: 'Custom template' },
        ]} />
        <Field label="Separator (concat)"  fk="separator" ph="\\n" />
        <Field label="Template (template)" fk="template"  ph="{{a}} and then {{b}}" />
      </>}

      {node.type === 'loop' && <>
        <Tip text="Connect an array-valued output. Each item will flow through the loop body." />
        <Field label="Mode"       fk="mode"      type="select" opts={['forEach','map','filter','reduce']} />
        <Field label="Batch Size" fk="batchSize" type="number" min={1} />
      </>}

      {node.type === 'delay' && <>
        <Field label="Duration"  fk="duration" type="number" min={0} step={0.5} />
        <Field label="Unit"      fk="unit"     type="select" opts={['milliseconds','seconds','minutes']} />
        <Tip text="Maximum 30 seconds in the browser runner. For longer delays use a backend scheduler." />
      </>}

      {node.type === 'schedule' && <>
        <Field label="Cron Expression"  fk="cron"        ph="0 9 * * 1-5" />
        <Field label="Timezone"         fk="timezone"    ph="UTC  or  America/New_York" />
        <Field label="Description"      fk="description" ph="Weekdays at 9am" />
        <Tip text="Example crons: every minute → * * * * *  |  daily 8am → 0 8 * * *  |  hourly → 0 * * * *" />
      </>}

      {node.type === 'webhook' && <>
        <Field label="Endpoint Path"     fk="path"   ph="/webhook/my-pipeline" />
        <Field label="HTTP Method"       fk="method" type="select" opts={['POST','GET','PUT']} />
        <Field label="Secret (optional)" fk="secret" ph="Signing secret for verification" />
        <Tip text="In production, point your webhook source to:  http://your-server:8000/webhook/{path}" />
      </>}

      {node.type === 'emailSend' && <>
        <Tip text="Preview only in the browser runner. Connect your backend to actually send." />
        <Field label="To"          fk="to"      ph="recipient@example.com" />
        <Field label="Subject"     fk="subject" ph="Hello from FlowCraft" />
        <Field label="Body"        fk="body"    type="textarea" rows={4} ph="Email body here…" />
        <Field label="From"        fk="from"    ph="noreply@yourdomain.com" />
        <Field label="SMTP Host"   fk="smtp"    ph="smtp.gmail.com" />
      </>}

      {node.type === 'slackMsg' && <>
        <Tip text="Preview only in the browser runner. Provide a Bot Token to send via the backend." />
        <Field label="Channel"   fk="channel"  ph="#general  or  @username" />
        <Field label="Message"   fk="message"  type="textarea" rows={3} ph="Message text…" />
        <Field label="Bot Token" fk="botToken" ph="xoxb-..." />
      </>}

      {node.type === 'dbQuery' && <>
        <Tip text="Preview only in browser. The backend handles the actual DB connection." />
        <Field label="Database"       fk="dbType" type="select" opts={['postgres','mysql','sqlite','mongodb','redis']} />
        <Field label="Host"           fk="host"   ph="localhost:5432" />
        <Field label="Database Name"  fk="dbName" ph="mydb" />
        <Field label="Query / Command" fk="query" type="textarea" rows={5}
          ph="SELECT * FROM users WHERE id = {{user_id}} LIMIT 10;" />
        <Tip text="Use {{varName}} placeholders in your query — they'll be interpolated with upstream values." />
      </>}

      {node.type === 'csvRead' && <>
        <Field label="Source"      fk="source"    type="select" opts={['file','url','string']} />
        <Field label="Path / URL"  fk="path"      ph="/data/input.csv  or  https://…/data.csv" />
        <Field label="Delimiter"   fk="delimiter" ph="," />
        <Field label="Has Header Row" fk="hasHeader" type="select" opts={['yes','no']} />
      </>}

      {node.type === 'note' && <>
        <Field label="Note Content" fk="content" type="textarea" rows={5} ph="Add comments here…" />
        <Field label="Accent Colour" fk="color" type="select"
          opts={[{ value:'slate',label:'⬤ Slate' },{ value:'yellow',label:'⬤ Yellow' },
                 { value:'cyan',label:'⬤ Cyan' },{ value:'green',label:'⬤ Green' }]} />
      </>}

      {(node.type === 'imageInput' || node.type === 'audioInput') && <>
        <Field label="Source" fk="source" type="select"
          opts={node.type === 'imageInput'
            ? ['upload','url','variable']
            : ['upload','microphone','url']} />
        <Field label={node.type === 'imageInput' ? 'Image URL' : 'Audio URL'}
          fk="url" ph="https://example.com/file" />
        <Field label="Format" fk="format" type="select"
          opts={node.type === 'imageInput' ? ['auto','png','jpg','webp','gif'] : ['auto','mp3','wav','ogg','m4a']} />
      </>}

      {node.type === 'imageOutput' && <>
        <Field label="Display Mode" fk="displayMode" type="select"
          opts={[{ value:'inline',label:'Inline Preview' },{ value:'download',label:'Download Link' },{ value:'url_only',label:'URL Only' }]} />
        <Field label="Filename" fk="filename" ph="output.png" />
      </>}

      {/* Handles info footer */}
      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--bd)',
        fontSize: 10.5, color: 'var(--tx3)', lineHeight: 1.8 }}>
        Drag from a <span style={{ color, fontSize: 12 }}>●</span> handle to connect nodes.
        Press <kbd style={{ padding: '1px 5px', background: 'var(--s3)', borderRadius: 3,
          border: '1px solid var(--bd2)', fontSize: 10 }}>Delete</kbd> on the canvas to remove.
      </div>
    </div>
  );
};
