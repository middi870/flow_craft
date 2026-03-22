// components/AIPanel.js — uses CSS classes from index.css
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';

const OLLAMA = 'http://localhost:11434';

const SYSTEM_PROMPT = `You are FlowCraft AI — assistant for a visual no-code pipeline builder.

When asked to CREATE/BUILD a pipeline respond ONLY with valid JSON (no markdown fences):
{"action":"create_pipeline","pipeline":{"nodes":[{"id":"n1","type":"customInput","data":{"inputName":"query","inputType":"Text"},"position":{"x":80,"y":220}}],"edges":[{"id":"e1","source":"n1","target":"n2","sourceHandle":"n1-value","targetHandle":"n2-prompt"}]},"description":"Brief description"}

Node types: customInput, customOutput, llm, ollamaGenerate, text, prompt, api, httpRequest, transform, code, condition, ifNode, switchNode, merge, note, schedule, webhook, setVariable, loop, emailSend, slackMsg, dbQuery, csvRead, delay, imageInput, audioInput, imageOutput

Handle pattern (replace {id} with node id):
customInput→{id}-value | customOutput→{id}-value | llm/ollamaGenerate→{id}-prompt,{id}-system/{id}-response | text/prompt→{id}-output | api/httpRequest→{id}-body/{id}-response | transform/code→{id}-in/{id}-out | condition/ifNode→{id}-in/{id}-true,{id}-false | merge→{id}-a,{id}-b/{id}-out

Layout x:80→1000, y:60→500, 280px gaps. For non-pipeline questions answer in 2-3 sentences.`;

export const AIPanel = () => {
  const [msgs,       setMsgs]       = useState([{ role: 'ai', content: "Hi! I'm FlowCraft AI.\n\nDescribe a workflow and I'll build it on your canvas, or ask me anything about nodes." }]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [model,      setModel]      = useState('');
  const [models,     setModels]     = useState([]);
  const [status,     setStatus]     = useState('checking');
  const [streamText, setStreamText] = useState('');
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  const { getNodeID, addNode, onConnect } = useStore(
    s => ({ getNodeID: s.getNodeID, addNode: s.addNode, onConnect: s.onConnect }),
    shallow
  );

  const checkOllama = useCallback(async () => {
    setStatus('checking');
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch(`${OLLAMA}/api/tags`, { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error();
      const d = await r.json();
      const list = (d.models ?? []).map(m => m.name);
      setModels(list.length ? list : ['llama3', 'llama3.2', 'mistral']);
      setModel(p => p || list[0] || 'llama3');
      setStatus('reachable');
    } catch {
      setModels(['llama3', 'llama3.2', 'mistral', 'codellama']);
      setModel(p => p || 'llama3');
      setStatus('offline');
    }
  }, []);

  useEffect(() => { checkOllama(); }, [checkOllama]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, streamText]);

  const applyPipeline = useCallback((pipeline) => {
    const idMap = {};
    (pipeline.nodes ?? []).forEach(n => {
      const newId = getNodeID(n.type);
      idMap[n.id] = newId;
      addNode({ ...n, id: newId, data: { ...n.data, id: newId } });
    });
    (pipeline.edges ?? []).forEach(e => {
      const src = idMap[e.source] ?? e.source;
      const tgt = idMap[e.target] ?? e.target;
      onConnect({ source: src, target: tgt,
        sourceHandle: e.sourceHandle?.replace(e.source, src),
        targetHandle: e.targetHandle?.replace(e.target, tgt) });
    });
  }, [getNodeID, addNode, onConnect]);

  const send = async () => {
    const txt = input.trim();
    if (!txt || loading) return;
    if (status === 'offline') {
      setMsgs(p => [...p, { role: 'user', content: txt }, { role: 'ai', content: '⚠ Ollama is offline.\n\nRun: ollama serve\n\nThen click ↺ Retry.' }]);
      setInput(''); return;
    }
    setMsgs(p => [...p, { role: 'user', content: txt }]);
    setInput(''); setLoading(true); setStreamText('');
    const history = msgs.slice(-10).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));
    try {
      const res = await fetch(`${OLLAMA}/api/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, stream: true,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: txt }] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split('\n').filter(Boolean)) {
          try {
            const chunk = JSON.parse(line);
            if (chunk.message?.content) { full += chunk.message.content; setStreamText(full); }
          } catch {}
        }
      }
      setStreamText(''); setStatus('ready');
      let reply = full;
      try {
        const raw = full.trim().replace(/^```json\s*/i, '').replace(/```$/g, '').trim();
        const parsed = JSON.parse(raw);
        if (parsed.action === 'create_pipeline' && parsed.pipeline) {
          applyPipeline(parsed.pipeline);
          const n = parsed.pipeline.nodes?.length ?? 0;
          const e = parsed.pipeline.edges?.length ?? 0;
          reply = `✓ Pipeline built!\n\n${parsed.description ?? ''}\n\nAdded ${n} node${n !== 1 ? 's' : ''} and ${e} connection${e !== 1 ? 's' : ''}.`;
        }
      } catch {}
      setMsgs(p => [...p, { role: 'ai', content: reply }]);
    } catch (err) {
      setStreamText(''); setStatus('offline');
      setMsgs(p => [...p, { role: 'ai', content: `⚠ ${err.message.includes('fetch') ? 'Lost connection to Ollama.' : err.message}\n\nRun: ollama serve` }]);
    } finally { setLoading(false); }
  };

  const SC = {
    checking:  { color: '#fbbf24', label: 'Checking…',       detail: '',                          pulse: true  },
    reachable: { color: '#60a5fa', label: 'Ollama reachable', detail: 'Send a message to verify',  pulse: false },
    ready:     { color: '#34d399', label: 'Model responding', detail: '✓ tested',                  pulse: false },
    offline:   { color: '#f87171', label: 'Ollama offline',   detail: 'Run: ollama serve',         pulse: false },
  }[status];

  const PILLS = ['Build a RAG pipeline', 'Summarize text', 'API → LLM flow', 'How do I connect nodes?'];

  return (
    <div className="ai-root">

      {/* Status bar */}
      <div className="ai-statusbar">
        <div className="ai-model-row">
          <span className="ai-model-label">Model</span>
          <select className="fc-select" value={model} onChange={e => setModel(e.target.value)}
            style={{ flex: 1, padding: '4px 7px', fontSize: 11 }} disabled={status === 'offline'}>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="ai-status-row">
          <div className="ai-status-left">
            <span className="ai-status-dot"
              style={{ background: SC.color, boxShadow: `0 0 7px ${SC.color}`,
                animation: SC.pulse ? 'pulse 1.2s ease infinite' : 'none' }} />
            <span className="ai-status-label">{SC.label}</span>
            {SC.detail && <span className="ai-status-detail">{SC.detail}</span>}
          </div>
          {(status === 'offline' || status === 'checking') && (
            <button onClick={checkOllama} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: 10 }}>↺ Retry</button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="ai-messages">
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div className={m.role === 'user' ? 'msg-user' : 'msg-ai'}>{m.content}</div>
          </div>
        ))}
        {loading && streamText && (
          <div className="msg-ai">{streamText}<span className="ai-spinner rp-blink">▌</span></div>
        )}
        {loading && !streamText && (
          <div className="ai-thinking"><span className="ai-spinner">◌</span> Thinking…</div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestion pills */}
      <div className="ai-pills">
        {PILLS.map(s => (
          <button key={s} className="ai-pill" onClick={() => { setInput(s); inputRef.current?.focus(); }}>{s}</button>
        ))}
      </div>

      {/* Input */}
      <div className="ai-inputbar">
        <textarea ref={inputRef} className="fc-textarea" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={status === 'offline' ? 'Ollama offline — run: ollama serve' : 'Ask anything… (⏎ send)'}
          rows={2} style={{ flex: 1, minHeight: 'unset', resize: 'none', fontSize: 11.5 }} />
        <button onClick={send} disabled={loading || !input.trim()}
          className="btn btn-accent ai-send-btn">
          {loading ? <span className="ai-spinner">◌</span> : '↑'}
        </button>
      </div>
    </div>
  );
};
