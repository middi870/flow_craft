// draggableNode.js

const NODE_COLORS = {
  customInput:   '#22d3ee',
  customOutput:  '#34d399',
  llm:           '#a78bfa',
  text:          '#f472b6',
  api:           '#fb923c',
  transform:     '#60a5fa',
  condition:     '#fbbf24',
  note:          '#94a3b8',
  merge:         '#a3e635',
};

const NODE_ICONS = {
  customInput:   '▶',
  customOutput:  '■',
  llm:           '◈',
  text:          'T',
  api:           '⇌',
  transform:     '⟳',
  condition:     '◇',
  note:          '✎',
  merge:         '⊕',
};

export const DraggableNode = ({ type, label }) => {
  const color = NODE_COLORS[type] ?? 'var(--accent)';
  const icon  = NODE_ICONS[type]  ?? '●';

  const onDragStart = (e) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType: type }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="tb-node"
      draggable
      onDragStart={onDragStart}
      style={{
        background:   `color-mix(in srgb, ${color} 9%, var(--s2))`,
        borderColor:  `color-mix(in srgb, ${color} 28%, transparent)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `color-mix(in srgb, ${color} 60%, transparent)`;
        e.currentTarget.style.transform   = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `color-mix(in srgb, ${color} 28%, transparent)`;
        e.currentTarget.style.transform   = '';
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: 5, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `color-mix(in srgb, ${color} 22%, transparent)`,
        color, fontSize: 12, fontWeight: 700,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  );
};
