// components/ValidationModal.js — uses CSS classes from index.css
export const ValidationModal = ({ result, onClose }) => {
  if (!result) return null;
  const { num_nodes, num_edges, is_dag } = result;
  const statusColor = is_dag ? 'var(--green)' : 'var(--red)';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ width: 380 }} onClick={e => e.stopPropagation()}>

        <div className="vm-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="vm-icon-wrap"
              style={{
                background: `color-mix(in srgb, ${statusColor} 18%, transparent)`,
                border: `1px solid color-mix(in srgb, ${statusColor} 40%, transparent)`,
              }}>
              <span style={{ fontSize: 18 }}>{is_dag ? '✓' : '⚠'}</span>
            </div>
            <div>
              <p className="vm-title">Pipeline Analysis</p>
              <p className="vm-status" style={{ color: statusColor }}>
                {is_dag ? 'VALID DAG — NO CYCLES' : 'INVALID — CYCLE DETECTED'}
              </p>
            </div>
          </div>
          <button className="vm-close" onClick={onClose}>✕</button>
        </div>

        <div className="vm-stats">
          {[
            { label: 'Nodes', value: num_nodes, color: 'var(--cyan)',   icon: '○' },
            { label: 'Edges', value: num_edges, color: 'var(--violet)', icon: '—' },
            { label: 'Is DAG', value: is_dag ? 'Yes' : 'No', color: statusColor, icon: is_dag ? '✓' : '✗' },
          ].map(s => (
            <div key={s.label} className="vm-stat"
              style={{ border: `1px solid color-mix(in srgb, ${s.color} 25%, transparent)` }}>
              <div className="vm-stat-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="vm-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="vm-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="vm-explanation">
          {is_dag
            ? `Your pipeline has ${num_nodes} node${num_nodes !== 1 ? 's' : ''} and ${num_edges} edge${num_edges !== 1 ? 's' : ''}. It forms a valid Directed Acyclic Graph — ready for execution.`
            : 'Your pipeline contains a cycle. All paths must flow in one direction without loops. Find and remove the circular connection.'
          }
          {result._warn && <><br/><br/><span style={{ color: 'var(--yellow)' }}>⚠ {result._warn}</span></>}
          {result._local && <><br/><span style={{ fontSize: 10, color: 'var(--tx3)', marginTop: 4, display: 'block' }}>Validated locally (backend offline)</span></>}
        </div>

        <button className="btn btn-accent vm-btn-full" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
};
