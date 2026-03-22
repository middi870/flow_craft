// toolbar.js — uses CSS classes from index.css
import { useState } from 'react';

const LogoMark = () => (
  <div className="tb-logo-mark">
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <circle cx="4" cy="9" r="2.5" fill="white" fillOpacity=".9"/>
      <circle cx="14" cy="9" r="2.5" fill="white" fillOpacity=".9"/>
      <circle cx="9" cy="4" r="2.5" fill="white" fillOpacity=".9"/>
      <circle cx="9" cy="14" r="2.5" fill="white" fillOpacity=".9"/>
      <line x1="4" y1="9" x2="14" y2="9" stroke="white" strokeWidth="1.5" strokeOpacity=".5"/>
      <line x1="9" y1="4" x2="9" y2="14" stroke="white" strokeWidth="1.5" strokeOpacity=".5"/>
    </svg>
  </div>
);

const ThemeToggle = ({ theme, onToggle }) => (
  <button className={`theme-toggle ${theme}`} onClick={onToggle}
    title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
    <div className="theme-toggle-knob">{theme === 'dark' ? '🌙' : '☀️'}</div>
  </button>
);

export const PipelineToolbar = ({ pipelineName, onNameChange, nodeCount, edgeCount, onClear, onShowTemplates, theme, onToggleTheme }) => {
  const [editing, setEditing] = useState(false);

  return (
    <header className="tb-header">
      <div className="tb-logo">
        <LogoMark />
        <div className="tb-wordmark">
          <div className="tb-wordmark-main">flow<span style={{ color: 'var(--accent)' }}>craft</span></div>
          <div className="tb-wordmark-sub">Pipeline Builder</div>
        </div>
      </div>

      <div className="divider-v" style={{ height: 28 }} />

      {editing
        ? <input autoFocus value={pipelineName} className="tb-name-input"
            onChange={e => onNameChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={e => e.key === 'Enter' && setEditing(false)} />
        : <button onClick={() => setEditing(true)} className="tb-name-input" style={{ cursor: 'text' }}>
            {pipelineName}<span className="tb-name-edit">✎</span>
          </button>
      }

      <button className="tb-templates-btn" onClick={onShowTemplates}>⊞ Templates</button>

      <div className="tb-spacer" />

      <div className="tb-stats">
        <div className="tb-stat">
          <span className="tb-stat-dot" style={{ background: 'var(--cyan)' }} />
          <span className="tb-stat-text"><span className="tb-stat-num">{nodeCount}</span> nodes</span>
        </div>
        <div className="tb-stat">
          <span className="tb-stat-dot" style={{ background: 'var(--violet)' }} />
          <span className="tb-stat-text"><span className="tb-stat-num">{edgeCount}</span> edges</span>
        </div>
      </div>

      <div className="divider-v" style={{ height: 28 }} />
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      <button className="btn btn-ghost" style={{ padding: '5px 11px', fontSize: 11 }} onClick={onClear}>✕ Clear</button>
    </header>
  );
};
