// App.js — Root with theme, template gallery, first-run welcome
import { useState, useEffect } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { PipelineToolbar }     from './toolbar';
import { PipelineUI }          from './ui';
import { SubmitButton }        from './submit';
import { LeftSidebar }         from './components/LeftSidebar';
import { TemplateGallery }     from './components/TemplateGallery';
import { useStore }            from './store';
import { shallow }             from 'zustand/shallow';

function App() {
  const [pipelineName, setPipelineName] = useState('Untitled Pipeline');
  const [theme, setTheme]               = useState('dark');
  const [showGallery, setShowGallery]   = useState(true); // open on first load

  const { nodes, edges, clearCanvas, loadTemplate } = useStore(
    s => ({ nodes: s.nodes, edges: s.edges, clearCanvas: s.clearCanvas, loadTemplate: s.loadTemplate }),
    shallow
  );

  // Persist theme choice
  useEffect(() => {
    const saved = localStorage.getItem('fc-theme');
    if (saved) setTheme(saved);
  }, []);
  const toggleTheme = () => setTheme(t => {
    const next = t === 'dark' ? 'light' : 'dark';
    localStorage.setItem('fc-theme', next);
    return next;
  });

  const handleClear = () => {
    if (!nodes.length) return;
    if (window.confirm('Clear the canvas? This cannot be undone.')) clearCanvas();
  };

  const handleLoadTemplate = (tpl) => {
    if (nodes.length > 0 && !window.confirm(`Load "${tpl.name}"? This will add nodes to your canvas.`)) return;
    loadTemplate(tpl);
    setPipelineName(tpl.name);
    setShowGallery(false);
  };

  return (
    <ReactFlowProvider>
      <div data-theme={theme} style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh' }}>

        <PipelineToolbar
          pipelineName={pipelineName}
          onNameChange={setPipelineName}
          nodeCount={nodes.length}
          edgeCount={edges.length}
          onClear={handleClear}
          onShowTemplates={() => setShowGallery(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <LeftSidebar />
          <PipelineUI theme={theme} />
        </div>

        <SubmitButton />

        {/* Template gallery overlay */}
        {showGallery && (
          <TemplateGallery
            onLoad={handleLoadTemplate}
            onDismiss={() => setShowGallery(false)}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
}

export default App;
