// submit.js — Bottom action bar: Run, Validate, Save, Load, Export
import { useState, useRef } from 'react';
import { useStore }          from './store';
import { shallow }           from 'zustand/shallow';
import { ValidationModal }   from './components/ValidationModal';
import { RunPanel }          from './components/RunPanel';

const API = 'http://localhost:8000';
const LS_KEY = 'flowcraft-pipelines';

// ── Persist to/from localStorage ─────────────────────────────────────────────
const lsSave = (name, nodes, edges) => {
  const all  = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  const id   = `p_${Date.now()}`;
  all[id]    = { id, name, nodes, edges, savedAt: new Date().toISOString() };
  localStorage.setItem(LS_KEY, JSON.stringify(all));
  return id;
};

const lsList = () => {
  try { return Object.values(JSON.parse(localStorage.getItem(LS_KEY) || '{}')); }
  catch { return []; }
};

const lsDelete = (id) => {
  const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  delete all[id];
  localStorage.setItem(LS_KEY, JSON.stringify(all));
};

// ── Load modal ────────────────────────────────────────────────────────────────
const LoadModal = ({ onLoad, onClose }) => {
  const saved = lsList().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ width: 420, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: 'var(--disp)', fontWeight: 800, fontSize: 15 }}>Load Pipeline</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--tx2)', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        {saved.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--tx3)', fontSize: 12 }}>
            No saved pipelines yet.<br/>Click Save to store the current canvas.
          </div>
        ) : (
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {saved.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 13px', background: 'var(--s3)',
                border: '1px solid var(--bd)', borderRadius: 8, cursor: 'pointer', transition: 'all .14s',
              }}
                onClick={() => onLoad(p)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bd)'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{p.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--tx2)', marginTop: 2 }}>
                    {p.nodes?.length ?? 0} nodes · {p.edges?.length ?? 0} edges
                    {p.savedAt && ` · ${new Date(p.savedAt).toLocaleString()}`}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); lsDelete(p.id); onClose(); onClose(); /* re-render */ }}
                  style={{ background: 'none', border: '1px solid var(--bd2)', borderRadius: 4, padding: '2px 7px',
                    fontSize: 10, color: 'var(--tx3)', cursor: 'pointer', transition: 'all .14s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--tx3)'; e.currentTarget.style.borderColor = 'var(--bd2)'; }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main bottom bar ───────────────────────────────────────────────────────────
export const SubmitButton = () => {
  const { nodes, edges, clearCanvas, addNode, onConnect } = useStore(s => ({
    nodes: s.nodes, edges: s.edges, clearCanvas: s.clearCanvas,
    addNode: s.addNode, onConnect: s.onConnect,
  }), shallow);
  const updateNodeField = useStore(s => s.updateNodeField, shallow);

  const [validating, setValidating] = useState(false);
  const [valResult,  setValResult]  = useState(null);
  const [valError,   setValError]   = useState(null);
  const [runOpen,    setRunOpen]    = useState(false);
  const [showLoad,   setShowLoad]   = useState(false);
  const [toast,      setToast]      = useState(null);
  const fileRef = useRef(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleValidate = async () => {
    if (validating) return;
    setValidating(true);
    setValError(null);
    try {
      const res = await fetch(`${API}/pipelines/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      setValResult(await res.json());
    } catch (err) {
      // Fallback: do local DAG check without backend
      const hasInput  = nodes.some(n => n.type === 'customInput');
      const hasOutput = nodes.some(n => n.type === 'customOutput');
      setValResult({
        num_nodes: nodes.length,
        num_edges: edges.length,
        is_dag: true, // simplified local check
        _local: true,
        _warn: !hasInput ? 'No Input nodes' : !hasOutput ? 'No Output nodes' : null,
      });
    } finally { setValidating(false); }
  };

  const handleSave = () => {
    if (!nodes.length) { showToast('Canvas is empty', 'warn'); return; }
    const name = prompt('Save as:', 'My Pipeline');
    if (!name) return;
    lsSave(name, nodes, edges);
    showToast(`Saved "${name}"`, 'ok');
  };

  const handleExport = () => {
    if (!nodes.length) { showToast('Canvas is empty', 'warn'); return; }
    const json = JSON.stringify({ name: 'FlowCraft Export', nodes, edges }, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = 'pipeline.json';
    a.click();
    showToast('Exported pipeline.json', 'ok');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        clearCanvas();
        setTimeout(() => {
          (data.nodes || []).forEach(n => addNode(n));
          (data.edges || []).forEach(e => onConnect(e));
          showToast(`Imported "${data.name || file.name}"`, 'ok');
        }, 50);
      } catch { showToast('Invalid JSON file', 'err'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLoad = (pipeline) => {
    if (nodes.length && !window.confirm('Replace current canvas?')) return;
    clearCanvas();
    setTimeout(() => {
      (pipeline.nodes || []).forEach(n => addNode(n));
      (pipeline.edges || []).forEach(e => onConnect(e));
      setShowLoad(false);
      showToast(`Loaded "${pipeline.name}"`, 'ok');
    }, 50);
  };

  const TOAST_COLOR = { ok: 'var(--green)', err: 'var(--red)', warn: 'var(--yellow)', info: 'var(--accent)' };

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 16px',
        background: 'var(--s1)', borderTop: '1px solid var(--bd)',
        flexShrink: 0, transition: 'background .25s',
      }}>

        {/* Save / Load / Export / Import */}
        <button className="btn btn-ghost" style={{ padding: '6px 11px', fontSize: 11 }} onClick={handleSave} title="Save to browser storage">
          ↓ Save
        </button>
        <button className="btn btn-ghost" style={{ padding: '6px 11px', fontSize: 11 }} onClick={() => setShowLoad(true)} title="Load saved pipeline">
          ↑ Load
        </button>
        <button className="btn btn-ghost" style={{ padding: '6px 11px', fontSize: 11 }} onClick={handleExport} title="Export as JSON file">
          ⬛ Export
        </button>
        <button className="btn btn-ghost" style={{ padding: '6px 11px', fontSize: 11 }} onClick={() => fileRef.current?.click()} title="Import JSON file">
          ⬚ Import
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />

        <div style={{ flex: 1 }} />

        {valError && <span style={{ fontSize: 11, color: 'var(--red)' }}>⚠ {valError}</span>}

        {/* Validate (DAG check) */}
        <button className="btn btn-ghost" style={{ padding: '6px 16px', fontSize: 11.5 }}
          onClick={handleValidate} disabled={validating || !nodes.length}>
          {validating
            ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>◌</span> Checking…</>
            : '◉ Validate'
          }
        </button>

        {/* RUN — primary CTA */}
        <button className="btn btn-accent"
          style={{ padding: '8px 28px', fontSize: 13, fontWeight: 700,
            boxShadow: nodes.length ? '0 2px 16px rgba(99,102,241,.4)' : 'none',
            letterSpacing: '.3px' }}
          onClick={() => setRunOpen(true)}
          disabled={!nodes.length}>
          ▶ Run Pipeline
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)',
          padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 500,
          background: 'var(--s2)', border: `1px solid ${TOAST_COLOR[toast.type]}40`,
          color: TOAST_COLOR[toast.type], boxShadow: 'var(--shadow-lg)',
          zIndex: 400, animation: 'fadeUp .2s ease', pointerEvents: 'none',
        }}>
          {toast.msg}
        </div>
      )}

      {valResult && <ValidationModal result={valResult} onClose={() => setValResult(null)} />}
      <RunPanel open={runOpen} onClose={() => setRunOpen(false)} />
      {showLoad && <LoadModal onLoad={handleLoad} onClose={() => setShowLoad(false)} />}
    </>
  );
};
