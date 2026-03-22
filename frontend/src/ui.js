// ui.js — Canvas + collapsible right panel
import { useState, useRef, useCallback } from 'react';
import ReactFlow, {
  Controls, Background, MiniMap,
  BackgroundVariant, Panel, MarkerType,
  getBezierPath, EdgeLabelRenderer, BaseEdge,
} from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import 'reactflow/dist/style.css';

import { InputNode }    from './nodes/inputNode';
import { OutputNode }   from './nodes/outputNode';
import { LLMNode }      from './nodes/llmNode';
import { TextNode }     from './nodes/textNode';
import {
  APINode, TransformNode, ConditionNode, NoteNode, MergeNode,
  PromptNode, ImageInputNode, AudioInputNode, ImageOutputNode,
  OllamaGenerateNode,
  HttpRequestNode, IfNode, SwitchNode, CodeNode, SetVariableNode,
  LoopNode, ScheduleNode, WebhookNode, EmailSendNode, SlackMsgNode,
  DbQueryNode, CsvReadNode, DelayNode,
} from './nodes/extraNodes';
import { PropsPanel }   from './components/PropsPanel';
import { AIPanel }      from './components/AIPanel';

// ── Custom smooth bezier edge ─────────────────────────────────────────────────
const FlowEdge = ({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style = {}, markerEnd, selected,
}) => {
  const [edgePath] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    curvature: 0.35,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        strokeWidth: selected ? 2.5 : 2,
        stroke: selected ? 'var(--accent)' : 'var(--edge)',
        filter: selected ? 'drop-shadow(0 0 5px rgba(91,94,244,.4))' : 'none',
        transition: 'stroke .1s, stroke-width .1s, filter .1s',
        ...style,
      }}
    />
  );
};

const edgeTypes = { flowEdge: FlowEdge };

const nodeTypes = {
  customInput:    InputNode,
  customOutput:   OutputNode,
  llm:            LLMNode,
  text:           TextNode,
  api:            APINode,
  httpRequest:    HttpRequestNode,
  transform:      TransformNode,
  code:           CodeNode,
  condition:      ConditionNode,
  ifNode:         IfNode,
  switchNode:     SwitchNode,
  note:           NoteNode,
  merge:          MergeNode,
  prompt:         PromptNode,
  imageInput:     ImageInputNode,
  audioInput:     AudioInputNode,
  imageOutput:    ImageOutputNode,
  ollamaGenerate: OllamaGenerateNode,
  setVariable:    SetVariableNode,
  loop:           LoopNode,
  schedule:       ScheduleNode,
  webhook:        WebhookNode,
  emailSend:      EmailSendNode,
  slackMsg:       SlackMsgNode,
  dbQuery:        DbQueryNode,
  csvRead:        CsvReadNode,
  delay:          DelayNode,
};

const proOptions = { hideAttribution: true };

const selector = (s) => ({
  nodes: s.nodes, edges: s.edges,
  getNodeID: s.getNodeID, addNode: s.addNode,
  onNodesChange: s.onNodesChange,
  onEdgesChange: s.onEdgesChange,
  onConnect: s.onConnect,
});

export const PipelineUI = ({ theme }) => {
  const rfWrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [rightTab, setRightTab] = useState('ai');
  const [panelOpen, setPanelOpen] = useState(true);

  const {
    nodes, edges, getNodeID, addNode,
    onNodesChange, onEdgesChange, onConnect,
  } = useStore(selector, shallow);

  // ── Drop ──
  const onDrop = useCallback((e) => {
    e.preventDefault();
    if (!rfInstance || !e.dataTransfer.getData('application/reactflow')) return;
    const { nodeType } = JSON.parse(e.dataTransfer.getData('application/reactflow'));
    if (!nodeType) return;
    const bounds = rfWrapper.current.getBoundingClientRect();
    const position = rfInstance.project({ x: e.clientX - bounds.left, y: e.clientY - bounds.top });
    const nodeID = getNodeID(nodeType);
    addNode({ id: nodeID, type: nodeType, position, data: { id: nodeID } });
  }, [rfInstance, getNodeID, addNode]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    setRightTab('props');
  }, []);

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  // Sync selected node
  const liveSelected = selectedNode
    ? nodes.find(n => n.id === selectedNode.id) ?? null
    : null;

  // Edge color by theme
  const edgeColor = theme === 'light' ? '#b8bcd8' : '#1e2048';
  const markerColor = theme === 'light' ? '#9098b8' : '#3a3a60';

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

      {/* ── Canvas ── */}
      <div ref={rfWrapper} style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={setRfInstance}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          proOptions={proOptions}
          snapGrid={[16, 16]}
          snapToGrid
          connectionLineType="bezier"
          connectionLineStyle={{
            stroke: 'var(--accent)', strokeWidth: 2.5,
            strokeDasharray: '7 3',
            filter: 'drop-shadow(0 0 6px rgba(91,94,244,.5))',
          }}
          defaultEdgeOptions={{
            type: 'flowEdge',
            markerEnd: { type: MarkerType.ArrowClosed, color: markerColor, width: 14, height: 14 },
          }}
          deleteKeyCode="Delete"
          elevateEdgesOnSelect
          fitView
          fitViewOptions={{ padding: 0.35, includeHiddenNodes: false }}
          defaultViewport={{ x: 120, y: 80, zoom: 0.72 }}
          minZoom={0.1}
          maxZoom={3}
          style={{ background: 'var(--bg)' }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22} size={1}
            color={theme === 'light' ? '#d0d4e8' : '#12122a'}
          />
          <Controls position="bottom-left" />
          <MiniMap
            position="bottom-right"
            nodeColor={n => ({
              customInput:'#22d3ee', customOutput:'#34d399', llm:'#a78bfa',
              ollamaGenerate:'#7c6fcd', text:'#f472b6', prompt:'#c084fc',
              api:'#fb923c', httpRequest:'#fb923c', transform:'#60a5fa',
              code:'#38bdf8', condition:'#fbbf24', ifNode:'#fbbf24',
              switchNode:'#f59e0b', note:'#94a3b8', merge:'#a3e635',
              loop:'#34d399', delay:'#94a3b8', schedule:'#60a5fa',
              webhook:'#f97316', emailSend:'#60a5fa', slackMsg:'#4ade80',
              dbQuery:'#6ee7b7', csvRead:'#86efac', setVariable:'#94a3b8',
              imageInput:'#2dd4bf', audioInput:'#fb7185', imageOutput:'#34d399',
            }[n.type] ?? '#6366f1')}
            maskColor={theme === 'light' ? 'rgba(240,242,248,.75)' : 'rgba(7,7,15,.75)'}
            style={{ background: 'var(--s1)', height: 110 }}
          />
          <Panel position="top-center">
            <div style={{
              padding: '4px 14px', background: 'var(--s2)',
              border: '1px solid var(--bd)', borderRadius: 20,
              fontSize: 10.5, color: 'var(--tx3)', letterSpacing: '.4px',
              userSelect: 'none', transition: 'background .25s',
            }}>
              Drag from the sidebar · Connect handles · Delete to remove
            </div>
          </Panel>
        </ReactFlow>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ textAlign: 'center', opacity: .13, userSelect: 'none' }}>
              <div style={{
                fontSize: 72, fontFamily: 'var(--disp)', fontWeight: 900,
                background: 'linear-gradient(135deg,#5b5ef4,#22d3ee)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1,
              }}>⟡</div>
              <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--disp)', marginTop: 12, color: 'var(--tx)' }}>
                Canvas is empty
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--tx2)', marginTop: 6, lineHeight: 1.7 }}>
                Click <b>⊞ Templates</b> in the toolbar to load a starter<br/>
                or drag nodes from the <b>left sidebar</b>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel wrapper — tab lives OUTSIDE so it's always visible ── */}
      <div className="right-panel-wrapper">

        {/* Always-visible collapse tab */}
        <div
          className="panel-collapse-tab"
          onClick={() => setPanelOpen(p => !p)}
          title={panelOpen ? 'Collapse panel (Alt+P)' : 'Expand panel (Alt+P)'}
        >
          {panelOpen ? '›' : '‹'}
        </div>

        {/* The panel itself */}
        <div
          className="right-panel"
          style={{ width: panelOpen ? 300 : 0 }}
        >
          {panelOpen && (
            <>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--bd)', flexShrink: 0 }}>
                <button className={`tab-btn${rightTab === 'props' ? ' active' : ''}`} onClick={() => setRightTab('props')}>
                  ◎ Properties
                </button>
                <button className={`tab-btn${rightTab === 'ai' ? ' active' : ''}`} onClick={() => setRightTab('ai')}>
                  ◈ AI Assistant
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {rightTab === 'props'
                  ? <PropsPanel node={liveSelected} />
                  : <AIPanel />
                }
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
