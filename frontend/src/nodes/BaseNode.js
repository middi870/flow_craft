// nodes/BaseNode.js
// ─────────────────────────────────────────────────────────────────────────────
// PART 1: Node Abstraction
//
// BaseNode is the single shared foundation for every node in FlowCraft.
// Instead of copying and modifying boilerplate HTML/styles between nodes,
// each node only declares what makes it unique:
//   - title, icon, color
//   - fields array  (auto-rendered form controls)
//   - handle layout (inputs/outputs, positions, labels)
//
// New nodes can be created in ~20 lines by composing BaseNode.
// All styling, handle wiring, and field updates flow from here.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';

// ── Field renderers ───────────────────────────────────────────────────────────
const FieldInput = ({ field, value, onChange, nodeColor }) => {
  const onFocus = (e) => { e.target.style.borderColor = nodeColor; };
  const onBlur  = (e) => { e.target.style.borderColor = ''; };

  switch (field.type) {
    case 'select':
      return (
        <select
          className="fc-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          {field.options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
      );

    case 'textarea':
      return (
        <textarea
          className="fc-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows || 3}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      );

    case 'number':
      return (
        <input
          className="fc-input"
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      );

    default: // 'text'
      return (
        <input
          className="fc-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      );
  }
};

// ── Handle builder ────────────────────────────────────────────────────────────
// handles = { targets: [{id, label, top?}], sources: [{id, label, top?}] }
const buildHandles = (handles, nodeId, nodeColor) => {
  const targets = handles?.targets ?? [];
  const sources = handles?.sources ?? [];

  const pct = (arr, i) =>
    arr.length === 1 ? '50%' : `${((i + 1) / (arr.length + 1)) * 100}%`;

  return (
    <>
      {targets.map((h, i) => (
        <Handle
          key={`target-${h.id}`}
          type="target"
          position={Position.Left}
          id={`${nodeId}-${h.id}`}
          style={{ top: h.top ?? pct(targets, i), background: nodeColor, borderColor: nodeColor }}
          title={h.label}
        />
      ))}
      {sources.map((h, i) => (
        <Handle
          key={`source-${h.id}`}
          type="source"
          position={Position.Right}
          id={`${nodeId}-${h.id}`}
          style={{ top: h.top ?? pct(sources, i), background: nodeColor, borderColor: nodeColor }}
          title={h.label}
        />
      ))}
    </>
  );
};

// ── BaseNode ──────────────────────────────────────────────────────────────────
/**
 * @param {string}   id         - React Flow node id
 * @param {object}   data       - Node data from store
 * @param {boolean}  selected   - Selected state from React Flow
 * @param {string}   title      - Node display title
 * @param {string}   icon       - Icon character / emoji
 * @param {string}   color      - CSS color string
 * @param {string}   typeTag    - Short uppercase tag shown in header (e.g. "LLM")
 * @param {Array}    fields     - Field descriptors: { key, label, type, options?, placeholder?, ... }
 * @param {object}   handles    - { targets: [], sources: [] }
 * @param {node}     children   - Extra custom JSX rendered below fields (optional)
 */
export const BaseNode = ({
  id,
  data,
  selected,
  title,
  icon,
  color = 'var(--accent)',
  typeTag,
  fields = [],
  handles = {},
  children,
}) => {
  const updateNodeField = useStore((s) => s.updateNodeField, shallow);

  const handleChange = useCallback(
    (key, value) => updateNodeField(id, key, value),
    [id, updateNodeField]
  );

  return (
    <div
      className={`fc-node${selected ? ' selected' : ''}`}
      style={{ '--node-color': color }}
    >
      {buildHandles(handles, id, color)}

      {/* ── Header ── */}
      <div className="fc-node-header">
        <div className="fc-node-icon">{icon}</div>
        <span className="fc-node-title">{data.title || title}</span>
        {typeTag && <span className="fc-node-type-tag">{typeTag}</span>}
      </div>

      {/* ── Body ── */}
      <div className="fc-node-body">
        {fields.map((field) => (
          <div key={field.key} className="fc-field">
            <label className="fc-field-label">{field.label}</label>
            <FieldInput
              field={field}
              value={data[field.key] ?? field.default ?? ''}
              onChange={(val) => handleChange(field.key, val)}
              nodeColor={color}
            />
          </div>
        ))}
        {children}
      </div>
    </div>
  );
};

// ── createNode factory ────────────────────────────────────────────────────────
/**
 * Factory that wraps BaseNode — the fastest way to create a new node.
 * Usage:
 *   export const MyNode = createNode({
 *     title: 'My Node', icon: '⟳', color: '#f00', typeTag: 'CUSTOM',
 *     fields: [{ key: 'name', label: 'Name', type: 'text', default: '' }],
 *     handles: { targets: [{id:'in'}], sources: [{id:'out'}] },
 *   });
 */
export const createNode = (config) => {
  const NodeComponent = (props) => <BaseNode {...props} {...config} />;
  NodeComponent.displayName = config.title?.replace(/\s+/g, '') + 'Node';
  return NodeComponent;
};
