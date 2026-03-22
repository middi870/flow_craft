// components/TemplateGallery.js — uses CSS classes from index.css
import { useState } from 'react';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../templates';

const CAT_ICONS = { All:'⊞', Beginner:'★', Productivity:'⚡', Audio:'♪', Creative:'✦', Data:'⟳' };

const STEPS = [
  { title: 'Pick a category',    desc: 'Use the left ribbon — I/O, AI, Text, Logic, HTTP, Media' },
  { title: 'Drag to canvas',     desc: 'Drop any node card from the sidebar panel onto the canvas' },
  { title: 'Connect handles',    desc: 'Hover a node edge until you see a dot, drag to connect' },
  { title: 'Run the pipeline',   desc: 'Click ▶ Run Pipeline, fill in inputs, see live outputs' },
];

const TemplateCard = ({ tpl, onLoad }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="tg-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onLoad(tpl)}
      style={{
        background: hovered ? `color-mix(in srgb, ${tpl.color} 8%, var(--s2))` : 'var(--s2)',
        borderColor: hovered ? tpl.color : 'var(--bd)',
        boxShadow: hovered ? `0 6px 24px color-mix(in srgb, ${tpl.color} 18%, rgba(0,0,0,.3))` : 'none',
      }}
    >
      <div className="tg-card-head">
        <div className="tg-card-icon"
          style={{ background: `color-mix(in srgb, ${tpl.color} 20%, transparent)`, color: tpl.color }}>
          {tpl.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="tg-card-name">{tpl.name}</p>
          <p className="tg-card-cat" style={{ color: tpl.color }}>{tpl.category}</p>
        </div>
      </div>

      <p className="tg-card-desc">{tpl.description}</p>

      <div className="tg-card-footer">
        <div className="tg-card-tags">
          {tpl.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tg-tag"
              style={{
                background: `color-mix(in srgb, ${tpl.color} 12%, var(--s3))`,
                border: `1px solid color-mix(in srgb, ${tpl.color} 25%, var(--bd))`,
                color: 'var(--tx2)',
              }}>
              {tag}
            </span>
          ))}
        </div>
        <span className="tg-card-meta">{tpl.nodes.length} nodes · {tpl.edges.length} edges</span>
      </div>

      {hovered && (
        <div className="tg-card-cta" style={{ borderTop: `1px solid color-mix(in srgb, ${tpl.color} 25%, var(--bd))`, color: tpl.color }}>
          ↗ Load this pipeline
        </div>
      )}
    </div>
  );
};

export const TemplateGallery = ({ onLoad, onDismiss }) => {
  const [activeCat, setActiveCat] = useState('All');
  const [search,    setSearch]    = useState('');

  const filtered = TEMPLATES.filter(t => {
    const matchCat = activeCat === 'All' || t.category === activeCat;
    const q = search.toLowerCase();
    return matchCat && (!q || t.name.toLowerCase().includes(q) || t.tags.some(g => g.includes(q)));
  });

  return (
    <div className="tg-overlay" onClick={onDismiss}>
      <div className="tg-container" onClick={e => e.stopPropagation()}>

        {/* Hero */}
        <div className="tg-hero">
          <div className="tg-hero-bg1" /><div className="tg-hero-bg2" />

          <div className="tg-hero-row">
            <div>
              <div className="tg-logo-row">
                <div className="tg-logo-mark">
                  <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                    <circle cx="4" cy="9" r="2.5" fill="white" fillOpacity=".9"/>
                    <circle cx="14" cy="9" r="2.5" fill="white" fillOpacity=".9"/>
                    <circle cx="9" cy="4" r="2.5" fill="white" fillOpacity=".9"/>
                    <circle cx="9" cy="14" r="2.5" fill="white" fillOpacity=".9"/>
                    <line x1="4" y1="9" x2="14" y2="9" stroke="white" strokeWidth="1.5" strokeOpacity=".5"/>
                    <line x1="9" y1="4" x2="9" y2="14" stroke="white" strokeWidth="1.5" strokeOpacity=".5"/>
                  </svg>
                </div>
                <span className="tg-wordmark">
                  flow<span style={{ color: 'var(--accent)' }}>craft</span>
                </span>
              </div>
              <h1 className="tg-headline">
                Build AI pipelines<br/>
                <span style={{ color: 'var(--accent)' }}>without code</span>
              </h1>
              <p className="tg-subhead">
                Connect nodes like blocks — text generation, image creation, audio synthesis,
                data transforms and more. Start with a template or drag from the sidebar.
              </p>
            </div>
            <button className="tg-dismiss" onClick={onDismiss}>Start blank →</button>
          </div>

          <div className="tg-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="tg-step">
                <div className="tg-step-head">
                  <span className="tg-step-num">{i + 1}</span>
                  <span className="tg-step-title">{s.title}</span>
                </div>
                <p className="tg-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Templates section */}
        <div className="tg-body">
          <div className="tg-section-head">
            <h2 className="tg-section-title">Start with a template</h2>
            <input className="fc-input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search templates…" style={{ width: 200, fontSize: 12 }} />
          </div>

          <div className="tg-filters">
            {TEMPLATE_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                className={`tg-filter tg-filter--${activeCat === cat ? 'active' : 'inactive'}`}>
                {CAT_ICONS[cat] || '●'} {cat}
              </button>
            ))}
          </div>

          <div className="tg-grid">
            {filtered.map(tpl => <TemplateCard key={tpl.id} tpl={tpl} onLoad={onLoad} />)}
          </div>
          {filtered.length === 0 && <p className="tg-empty">No templates match "{search}"</p>}
        </div>
      </div>
    </div>
  );
};
