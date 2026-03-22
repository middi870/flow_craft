// components/RunPanel.js — Pipeline execution UI (uses CSS classes from index.css)
import { useState, useRef, useCallback } from 'react';
import { executePipeline } from '../engine';
import { useStore }        from '../store';
import { shallow }         from 'zustand/shallow';

const STATUS_ICON = {
  pending: <span style={{ color: 'var(--tx3)', fontSize: 13 }}>○</span>,
  running: <span style={{ color: 'var(--accent)', fontSize: 13, display: 'inline-block', animation: 'spin 1s linear infinite' }}>◌</span>,
  done:    <span style={{ color: 'var(--green)',  fontSize: 13 }}>✓</span>,
  error:   <span style={{ color: 'var(--red)',    fontSize: 13 }}>✕</span>,
};

const NODE_COLOR = {
  customInput:'#22d3ee', customOutput:'#34d399', llm:'#a78bfa',
  ollamaGenerate:'#7c6fcd', text:'#f472b6', prompt:'#c084fc',
  api:'#fb923c', httpRequest:'#fb923c', transform:'#60a5fa',
  code:'#38bdf8', condition:'#fbbf24', ifNode:'#fbbf24',
  switchNode:'#f59e0b', note:'#94a3b8', merge:'#a3e635',
  loop:'#34d399', delay:'#94a3b8', schedule:'#60a5fa',
  webhook:'#f97316', emailSend:'#60a5fa', slackMsg:'#4ade80',
  dbQuery:'#6ee7b7', csvRead:'#86efac', setVariable:'#94a3b8',
  imageInput:'#2dd4bf', audioInput:'#fb7185', imageOutput:'#34d399',
};

const NODE_ICON = {
  customInput:'▶', customOutput:'■', llm:'◈', ollamaGenerate:'◈',
  text:'T', prompt:'✦', api:'⇌', httpRequest:'⇌',
  transform:'⟳', code:'{}', condition:'◇', ifNode:'◇', switchNode:'⊡',
  note:'✎', merge:'⊕', loop:'↺', delay:'⏱', schedule:'⏰',
  webhook:'⚡', emailSend:'✉', slackMsg:'💬', dbQuery:'🗄',
  csvRead:'≡', setVariable:'×', imageInput:'⬛', audioInput:'♪', imageOutput:'⬚',
};

// ── Input form ────────────────────────────────────────────────────────────────
const InputForm = ({ inputNodes, values, onChange, onRun, running }) => {
  if (!inputNodes.length) {
    return <p className="rp-empty">No input nodes in this pipeline.<br/>Add a Manual Input node to provide data.</p>;
  }
  return (
    <div>
      {inputNodes.map(node => {
        const varName = node.data.inputName || 'input';
        const desc    = node.data.description;
        const isLong  = (node.data.inputType || 'Text') !== 'Number';
        return (
          <div key={node.id} className="rp-input-field">
            <label className="rp-input-label">
              {varName}
              {desc && <span className="rp-input-desc">— {desc}</span>}
            </label>
            {isLong
              ? <textarea className="fc-textarea" rows={3} value={values[node.id] || ''}
                  onChange={e => onChange(node.id, e.target.value)}
                  placeholder={`Enter ${varName}…`} style={{ resize: 'vertical', minHeight: 70 }}
                  onFocus={e => { e.target.style.borderColor = '#22d3ee'; }}
                  onBlur={e  => { e.target.style.borderColor = ''; }} />
              : <input className="fc-input" type="text" value={values[node.id] || ''}
                  onChange={e => onChange(node.id, e.target.value)}
                  placeholder={`Enter ${varName}…`}
                  onFocus={e => { e.target.style.borderColor = '#22d3ee'; }}
                  onBlur={e  => { e.target.style.borderColor = ''; }} />
            }
          </div>
        );
      })}
      <button className="btn btn-accent" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
        onClick={onRun} disabled={running}>
        ▶ Run with these inputs
      </button>
    </div>
  );
};

// ── Execution log ─────────────────────────────────────────────────────────────
const ExecLog = ({ nodes, statuses, streamMap }) => (
  <div>
    {nodes.filter(n => n.type !== 'note').map(node => {
      const status = statuses[node.id] || 'pending';
      const color  = NODE_COLOR[node.type] || 'var(--accent)';
      const icon   = NODE_ICON[node.type]  || '●';
      const label  = node.data.name || node.data.title || node.type;
      const stream = streamMap[node.id];
      const err    = streamMap[`${node.id}__err`];
      return (
        <div key={node.id} className="rp-node-card"
          style={{
            borderColor: status === 'running'
              ? `color-mix(in srgb, ${color} 40%, var(--bd))`
              : status === 'done'  ? 'color-mix(in srgb, var(--green) 25%, var(--bd))'
              : status === 'error' ? 'color-mix(in srgb, var(--red) 25%, var(--bd))'
              : 'var(--bd)',
            background: status === 'running'
              ? `color-mix(in srgb, ${color} 8%, var(--s3))`
              : 'var(--s3)',
          }}>
          <div className="rp-node-card-row">
            <div className="rp-node-card-icon"
              style={{ background: `color-mix(in srgb, ${color} 20%, transparent)`, color }}>
              {icon}
            </div>
            <span className="rp-node-label">{label}</span>
            <span className="rp-node-type">{node.type}</span>
            {STATUS_ICON[status]}
          </div>
          {status === 'running' && stream && (
            <div className="rp-stream-preview">
              {stream.slice(-200)}
              <span className="rp-blink">▌</span>
            </div>
          )}
          {status === 'error' && err && <p className="rp-error-text">{err}</p>}
        </div>
      );
    })}
  </div>
);

// ── Output display ────────────────────────────────────────────────────────────
const OutputDisplay = ({ outputs, llmStreams }) => {
  if (!Object.keys(outputs).length && !Object.keys(llmStreams).length) {
    return <p className="rp-empty">Outputs will appear here once the pipeline runs.</p>;
  }
  const copy = (text) => navigator.clipboard.writeText(String(text));
  const download = (name, value) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([String(value)], { type: 'text/plain' }));
    a.download = `${name}.txt`;
    a.click();
  };
  return (
    <div className="rp-output-block">
      {Object.entries(llmStreams).map(([nodeId, text]) =>
        !outputs[nodeId] ? (
          <div key={nodeId}>
            <p className="rp-output-stream-label">◈ Streaming…</p>
            <div className="rp-output-value rp-output-value--stream">
              {text}<span className="rp-blink">▌</span>
            </div>
          </div>
        ) : null
      )}
      {Object.entries(outputs).map(([name, value]) => (
        <div key={name}>
          <p className="rp-output-label"><span>■</span> {name}</p>
          <div className="rp-output-value rp-output-value--final">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </div>
          <div className="rp-output-actions">
            <button className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: 10 }} onClick={() => copy(value)}>⎘ Copy</button>
            <button className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: 10 }} onClick={() => download(name, value)}>↓ Download</button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── RunPanel ──────────────────────────────────────────────────────────────────
export const RunPanel = ({ open, onClose }) => {
  const { nodes, edges } = useStore(s => ({ nodes: s.nodes, edges: s.edges }), shallow);
  const [inputValues, setInputValues] = useState({});
  const [statuses,    setStatuses]    = useState({});
  const [streamMap,   setStreamMap]   = useState({});
  const [outputs,     setOutputs]     = useState({});
  const [llmStreams,  setLlmStreams]   = useState({});
  const [running,     setRunning]     = useState(false);
  const [runLog,      setRunLog]      = useState([]);
  const [tab,         setTab]         = useState('inputs');

  const inputNodes = nodes.filter(n => n.type === 'customInput');
  const doneCount  = Object.values(statuses).filter(s => s === 'done').length;
  const totalCount = Object.values(statuses).length;
  const errCount   = Object.values(statuses).filter(s => s === 'error').length;

  const reset = () => { setStatuses({}); setStreamMap({}); setOutputs({}); setLlmStreams({}); setRunLog([]); };

  const handleRun = async () => {
    if (!nodes.length) return;
    reset(); setRunning(true); setTab('log');
    const init = {};
    nodes.filter(n => n.type !== 'note').forEach(n => { init[n.id] = 'pending'; });
    setStatuses(init);
    try {
      for await (const ev of executePipeline(nodes, edges, inputValues)) {
        switch (ev.type) {
          case 'start':    setRunLog(l => [...l, `▶ Running ${ev.total} nodes`]); break;
          case 'nodeStart':setStatuses(s => ({ ...s, [ev.nodeId]: 'running' })); break;
          case 'stream':
            setLlmStreams(m => ({ ...m, [ev.nodeId]: ev.text }));
            setStreamMap(m  => ({ ...m, [ev.nodeId]: ev.text }));
            setTab('outputs');
            break;
          case 'nodeDone':
            setStatuses(s => ({ ...s, [ev.nodeId]: 'done' }));
            if (ev.outputs?.response) setLlmStreams(m => ({ ...m, [ev.nodeId]: ev.outputs.response }));
            break;
          case 'nodeError':
            setStatuses(s => ({ ...s, [ev.nodeId]: 'error' }));
            setStreamMap(m => ({ ...m, [`${ev.nodeId}__err`]: ev.error }));
            setRunLog(l => [...l, `✕ ${ev.error}`]);
            break;
          case 'output':
            setOutputs(o => ({ ...o, [ev.name]: ev.value }));
            setRunLog(l => [...l, `✓ Output: ${ev.name}`]);
            setTab('outputs');
            break;
          case 'done':   setRunLog(l => [...l, '✓ Complete']); break;
          case 'error':  setRunLog(l => [...l, `✕ ${ev.error}`]); break;
        }
      }
    } catch (e) {
      setRunLog(l => [...l, `✕ ${e.message}`]);
    } finally {
      setRunning(false);
    }
  };

  if (!open) return null;

  const TABS = [
    { id: 'inputs',  label: `Inputs (${inputNodes.length})` },
    { id: 'log',     label: 'Live Log' },
    { id: 'outputs', label: `Outputs (${Object.keys(outputs).length})` },
  ];

  return (
    <div className="rp-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rp-spacer" onClick={onClose} />
      <div className="rp-panel">

        {/* Header */}
        <div className="rp-header">
          {running
            ? <button className="btn" onClick={() => setRunning(false)}
                style={{ background: 'color-mix(in srgb, var(--red) 15%, var(--s3))', border: '1px solid color-mix(in srgb, var(--red) 40%, var(--bd))', color: 'var(--red)', fontWeight: 700, padding: '7px 20px' }}>
                ⬛ Stop
              </button>
            : <button className="btn btn-accent" onClick={handleRun} disabled={!nodes.length}
                style={{ padding: '7px 22px', fontWeight: 700, fontSize: 12.5 }}>
                ▶ Run Pipeline
              </button>
          }

          {totalCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="rp-progress-bar">
                <div className="rp-progress-fill"
                  style={{ width: `${(doneCount/totalCount)*100}%`,
                    background: errCount > 0 ? 'var(--red)' : 'var(--green)' }} />
              </div>
              <span className="rp-progress-label">
                {doneCount}/{totalCount} nodes
                {errCount > 0 && <span style={{ color: 'var(--red)', marginLeft: 6 }}>· {errCount} err</span>}
              </span>
            </div>
          )}

          <div style={{ flex: 1 }} />

          <div className="rp-tabs">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`rp-tab rp-tab--${tab === t.id ? 'active' : 'inactive'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--tx2)', cursor: 'pointer', fontSize: 17, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Body */}
        <div className="rp-body">
          <div className="rp-col rp-col--inputs" data-visible={tab === 'inputs' || window.innerWidth > 860 ? 'true' : 'false'}
            style={{ display: tab === 'inputs' || window.innerWidth > 860 ? 'flex' : 'none' }}>
            <div className="rp-col-head">
              <p className="rp-col-title">Pipeline Inputs</p>
              <p className="rp-col-subtitle">Fill these before running</p>
            </div>
            <div className="rp-col-body">
              <InputForm inputNodes={inputNodes} values={inputValues}
                onChange={(id, v) => setInputValues(p => ({ ...p, [id]: v }))}
                onRun={handleRun} running={running} />
            </div>
          </div>

          <div className="rp-col rp-col--log" data-visible={tab === 'log' || window.innerWidth > 860 ? 'true' : 'false'}
            style={{ display: tab === 'log' || window.innerWidth > 860 ? 'flex' : 'none' }}>
            <div className="rp-col-head">
              <p className="rp-col-title">Execution Log</p>
            </div>
            <div className="rp-col-body">
              <ExecLog nodes={nodes} statuses={statuses} streamMap={streamMap} />
              {runLog.length > 0 && (
                <div className="rp-run-log">
                  {runLog.map((l, i) => <div key={i}>{l}</div>)}
                </div>
              )}
            </div>
          </div>

          <div className="rp-col rp-col--outputs" data-visible={tab === 'outputs' || window.innerWidth > 860 ? 'true' : 'false'}
            style={{ display: tab === 'outputs' || window.innerWidth > 860 ? 'flex' : 'none' }}>
            <div className="rp-col-head">
              <p className="rp-col-title">
                Results
                {Object.keys(outputs).length > 0 &&
                  <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--green)' }}>
                    ✓ {Object.keys(outputs).length} output{Object.keys(outputs).length > 1 ? 's' : ''}
                  </span>
                }
              </p>
            </div>
            <div className="rp-col-body">
              <OutputDisplay outputs={outputs} llmStreams={llmStreams} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
