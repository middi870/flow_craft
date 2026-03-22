// store.js — Zustand global state for FlowCraft
import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges, MarkerType } from 'reactflow';

export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  nodeIDs: {},

  getNodeID: (type) => {
    const newIDs = { ...get().nodeIDs };
    if (newIDs[type] === undefined) newIDs[type] = 0;
    newIDs[type] += 1;
    set({ nodeIDs: newIDs });
    return `${type}-${newIDs[type]}`;
  },

  addNode: (node) => set({ nodes: [...get().nodes, node] }),

  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),

  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),

  onConnect: (connection) =>
    set({
      edges: addEdge({
        ...connection,
        type: 'flowEdge',
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, height: '16px', width: '16px', color: '#3a3a60' },
      }, get().edges),
    }),

  updateNodeField: (nodeId, fieldName, fieldValue) =>
    set({
      nodes: get().nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, [fieldName]: fieldValue } } : n
      ),
    }),

  deleteNode: (nodeId) =>
    set({
      nodes: get().nodes.filter(n => n.id !== nodeId),
      edges: get().edges.filter(e => e.source !== nodeId && e.target !== nodeId),
    }),

  clearCanvas: () => set({ nodes: [], edges: [], nodeIDs: {} }),

  // Load a full template — remaps IDs to avoid collisions
  loadTemplate: (template) => {
    const idMap = {};
    const newIDs = { ...get().nodeIDs };

    const newNodes = template.nodes.map(n => {
      if (newIDs[n.type] === undefined) newIDs[n.type] = 0;
      newIDs[n.type] += 1;
      const newId = `${n.type}-${newIDs[n.type]}`;
      idMap[n.id] = newId;
      return { ...n, id: newId, data: { ...n.data, id: newId } };
    });

    const newEdges = template.edges.map(e => {
      const newSrc = idMap[e.source] ?? e.source;
      const newTgt = idMap[e.target] ?? e.target;
      return {
        ...e,
        id: `e-${Math.random().toString(36).slice(2, 8)}`,
        source: newSrc,
        target: newTgt,
        sourceHandle: e.sourceHandle?.replace(e.source, newSrc),
        targetHandle: e.targetHandle?.replace(e.target, newTgt),
        type: 'flowEdge',
      };
    });

    set({
      nodes: [...get().nodes, ...newNodes],
      edges: [...get().edges, ...newEdges],
      nodeIDs: newIDs,
    });
  },
}));
