// nodes/textNode.js
// ─────────────────────────────────────────────────────────────────────────────
// PART 3: Text Node Logic
//
// Two enhancements over the basic version:
//
// 1. AUTO-RESIZE — The textarea grows in width and height as the user types,
//    always keeping content visible without scrollbars.
//
// 2. VARIABLE HANDLES — Whenever the user types {{ varName }} (where varName
//    is a valid JS identifier), a new Target Handle appears on the left side
//    of the node for that variable. Removing the variable from the text
//    removes the handle.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';

// Match {{ validJSIdentifier }} — spaces around name are tolerated
const VAR_REGEX = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;

// Extract unique variable names from a text string
const extractVars = (text) => {
  const vars = new Set();
  let match;
  const re = new RegExp(VAR_REGEX.source, 'g');
  while ((match = re.exec(text)) !== null) {
    vars.add(match[1]);
  }
  return [...vars];
};

export const TextNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((s) => s.updateNodeField, shallow);

  const [text, setText] = useState(data?.text ?? '{{input}}');
  const [vars, setVars]  = useState([]);

  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  // ── Auto-resize logic ──
  const resize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    // Reset to measure natural scroll dimensions
    ta.style.height = 'auto';
    ta.style.width  = 'auto';

    const newH = Math.max(60, ta.scrollHeight + 4);
    // Approximate char width: ~7.5px per char at 11.5px JetBrains Mono
    const longestLine = text.split('\n').reduce((max, l) => Math.max(max, l.length), 0);
    const newW = Math.max(194, Math.min(520, longestLine * 7.5 + 30));

    ta.style.height = `${newH}px`;
    ta.style.width  = `${newW}px`;

    // Grow the container card to match
    if (containerRef.current) {
      containerRef.current.style.minWidth = `${newW + 26}px`;
    }
  }, [text]);

  useEffect(() => { resize(); }, [text, resize]);

  // ── Variable detection ──
  useEffect(() => {
    setVars(extractVars(text));
    updateNodeField(id, 'text', text);
  }, [text, id, updateNodeField]);

  const handleChange = (e) => {
    setText(e.target.value);
  };

  const color = '#f472b6';
  const varHandleTop = (i, total) =>
    total === 1 ? '50%' : `${((i + 1) / (total + 1)) * 100}%`;

  return (
    <div
      ref={containerRef}
      className={`fc-node${selected ? ' selected' : ''}`}
      style={{ '--node-color': color, minWidth: 220, transition: 'min-width .1s' }}
    >
      {/* ── Variable handles (target, left) ── */}
      {vars.map((v, i) => (
        <Handle
          key={v}
          type="target"
          position={Position.Left}
          id={`${id}-${v}`}
          style={{
            top: varHandleTop(i, vars.length),
            background: color,
            borderColor: color,
          }}
          title={v}
        />
      ))}

      {/* ── Header ── */}
      <div className="fc-node-header">
        <div className="fc-node-icon" style={{ fontSize: 14 }}>T</div>
        <span className="fc-node-title">Text</span>
        <span className="fc-node-type-tag">TEXT</span>
      </div>

      {/* ── Body ── */}
      <div className="fc-node-body">
        <div className="fc-field">
          <label className="fc-field-label">Content</label>
          <textarea
            ref={textareaRef}
            className="fc-textarea"
            value={text}
            onChange={handleChange}
            placeholder="Type text… use {{varName}} for inputs"
            style={{
              width: '100%',
              overflow: 'hidden',
              resize: 'none',
              transition: 'height .1s',
            }}
            onFocus={(e) => { e.target.style.borderColor = color; }}
            onBlur={(e)  => { e.target.style.borderColor = ''; }}
          />
        </div>

        {/* ── Variable chips ── */}
        {vars.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {vars.map((v) => (
              <span
                key={v}
                style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 700,
                  background: `color-mix(in srgb, ${color} 18%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
                  color,
                  letterSpacing: '.5px',
                }}
              >
                {`{{${v}}}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Output handle (right) ── */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-output`}
        style={{ background: color, borderColor: color }}
        title="Output"
      />
    </div>
  );
};
