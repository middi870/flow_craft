import { useState } from 'react';

const CATEGORIES = [
  {
    id: 'trigger',
    icon: '⚡',
    label: 'Trigger',
    title: 'Triggers',
    subtitle: 'Start your pipeline',
    nodes: [
      { type: 'customInput', icon: '▶', color: '#22d3ee', name: 'Manual Input',   desc: 'Type or paste data to start' },
      { type: 'schedule',    icon: '⏰', color: '#60a5fa', name: 'Schedule',       desc: 'Run on a cron schedule' },
      { type: 'webhook',     icon: '⚡', color: '#f97316', name: 'Webhook',        desc: 'Trigger from HTTP POST' },
    ],
  },
  {
    id: 'ai',
    icon: '◈',
    label: 'AI',
    title: 'AI & LLM',
    subtitle: 'Language models & prompts',
    nodes: [
      { type: 'llm',            icon: '◈', color: '#a78bfa', name: 'LLM Chat',         desc: 'Chat via /api/chat' },
      { type: 'ollamaGenerate', icon: '◈', color: '#7c6fcd', name: 'Ollama Generate',   desc: 'Direct /api/generate' },
      { type: 'prompt',         icon: '✦', color: '#c084fc', name: 'Prompt Template',   desc: '{{variable}} substitution' },
      { type: 'text',           icon: 'T',  color: '#f472b6', name: 'Text',              desc: 'Auto-resize + var handles' },
    ],
  },
  {
    id: 'http',
    icon: '⇌',
    label: 'HTTP',
    title: 'HTTP & APIs',
    subtitle: 'External integrations',
    nodes: [
      { type: 'httpRequest', icon: '⇌', color: '#fb923c', name: 'HTTP Request',   desc: 'GET, POST, PUT, DELETE…' },
      { type: 'api',         icon: '⬡', color: '#f97316', name: 'API Call',       desc: 'Generic REST call' },
      { type: 'webhook',     icon: '⚡', color: '#f97316', name: 'Webhook',        desc: 'Receive incoming POSTs' },
    ],
  },
  {
    id: 'logic',
    icon: '◇',
    label: 'Logic',
    title: 'Flow Control',
    subtitle: 'Branch, loop & transform',
    nodes: [
      { type: 'ifNode',      icon: '◇', color: '#fbbf24', name: 'If / Else',      desc: 'Branch on a condition' },
      { type: 'switchNode',  icon: '⊡', color: '#f59e0b', name: 'Switch',         desc: 'Route by value' },
      { type: 'loop',        icon: '↺', color: '#34d399', name: 'Loop',           desc: 'Iterate over an array' },
      { type: 'merge',       icon: '⊕', color: '#a3e635', name: 'Merge',          desc: 'Join two paths' },
      { type: 'delay',       icon: '⏱', color: '#94a3b8', name: 'Delay / Wait',   desc: 'Pause for N seconds' },
    ],
  },
  {
    id: 'data',
    icon: '⟳',
    label: 'Data',
    title: 'Data Processing',
    subtitle: 'Transform & filter data',
    nodes: [
      { type: 'transform',   icon: '⟳', color: '#60a5fa', name: 'Transform',      desc: 'Map, filter, custom JS' },
      { type: 'code',        icon: '{}', color: '#38bdf8', name: 'Code',           desc: 'Run custom JavaScript' },
      { type: 'setVariable', icon: '×',  color: '#94a3b8', name: 'Set Variable',   desc: 'Store a named value' },
      { type: 'csvRead',     icon: '≡',  color: '#86efac', name: 'CSV Read',       desc: 'Parse CSV into rows' },
      { type: 'dbQuery',     icon: '🗄', color: '#6ee7b7', name: 'Database Query', desc: 'SQL or NoSQL query' },
    ],
  },
  {
    id: 'comms',
    icon: '✉',
    label: 'Comms',
    title: 'Communication',
    subtitle: 'Email, Slack, notifications',
    nodes: [
      { type: 'emailSend',   icon: '✉',  color: '#60a5fa', name: 'Send Email',     desc: 'SMTP / Sendgrid / SES' },
      { type: 'slackMsg',    icon: '💬', color: '#4ade80', name: 'Slack Message',   desc: 'Post to a Slack channel' },
      { type: 'note',        icon: '✎',  color: '#94a3b8', name: 'Sticky Note',    desc: 'Comment / annotation' },
    ],
  },
  {
    id: 'media',
    icon: '◎',
    label: 'Media',
    title: 'Images & Audio',
    subtitle: 'Media input and output',
    nodes: [
      { type: 'imageInput',  icon: '⬛', color: '#2dd4bf', name: 'Image Input',    desc: 'File upload or URL' },
      { type: 'audioInput',  icon: '♪',  color: '#fb7185', name: 'Audio Input',    desc: 'Audio file or mic' },
      { type: 'imageOutput', icon: '⬚',  color: '#34d399', name: 'Image Output',   desc: 'Display or download' },
    ],
  },
  {
    id: 'io',
    icon: '■',
    label: 'Output',
    title: 'Outputs',
    subtitle: 'Pipeline exit points',
    nodes: [
      { type: 'customOutput', icon: '■', color: '#34d399', name: 'Output',         desc: 'Text, file, JSON result' },
    ],
  },
];

const SidebarCard = ({ node }) => {
  const onDragStart = e => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType: node.type }));
    e.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div className="sb-node" draggable onDragStart={onDragStart}
      style={{ '--node-color': node.color }}>
      <div className="sb-node-icon">{node.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="sb-node-name">{node.name}</div>
        <div className="sb-node-desc">{node.desc}</div>
      </div>
      <span style={{ fontSize: 9, color: 'var(--tx4)', opacity: .5, flexShrink: 0 }}>⠿</span>
    </div>
  );
};

export const LeftSidebar = () => {
  const [activeId, setActiveId] = useState(null);
  const activeCat = CATEGORIES.find(c => c.id === activeId);
  const toggle = id => setActiveId(p => p === id ? null : id);

  return (
    <>
      <nav className="ribbon">
        {/* Logo mark */}
        <div style={{
          height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderBottom: '1px solid var(--bd)', flexShrink: 0,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg,#6366f1,#22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(99,102,241,.4)',
          }}>
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <circle cx="4" cy="9" r="2.5" fill="white" fillOpacity=".9"/>
              <circle cx="14" cy="9" r="2.5" fill="white" fillOpacity=".9"/>
              <circle cx="9" cy="4" r="2.5" fill="white" fillOpacity=".9"/>
              <circle cx="9" cy="14" r="2.5" fill="white" fillOpacity=".9"/>
              <line x1="4" y1="9" x2="14" y2="9" stroke="white" strokeWidth="1.5" strokeOpacity=".5"/>
              <line x1="9" y1="4" x2="9" y2="14" stroke="white" strokeWidth="1.5" strokeOpacity=".5"/>
            </svg>
          </div>
        </div>

        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`ribbon-btn${activeId === cat.id ? ' active' : ''}`}
            onClick={() => toggle(cat.id)}
            title={cat.title}
          >
            <span className="ribbon-btn-icon">{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </nav>

      <div className={`ribbon-drawer ${activeId ? 'open' : 'closed'}`}>
        {activeCat && (
          <>
            <div className="drawer-header">
              <div>
                <div className="drawer-title">{activeCat.title}</div>
                <div className="drawer-subtitle">{activeCat.subtitle}</div>
              </div>
              <button onClick={() => setActiveId(null)}
                style={{ background: 'none', border: 'none', color: 'var(--tx2)', cursor: 'pointer', fontSize: 13, padding: 3 }}>
                ✕
              </button>
            </div>
            <div className="drawer-nodes">
              {activeCat.nodes.map(n => <SidebarCard key={n.type} node={n} />)}
            </div>
          </>
        )}
      </div>
    </>
  );
};
