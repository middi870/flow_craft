"""
FlowCraft Backend — FastAPI
─────────────────────────────────────────────────────────────────────────────
PART 4: Backend Integration

Endpoints:
  GET  /                  → health check
  POST /pipelines/parse   → validate pipeline, return num_nodes, num_edges, is_dag
  POST /api/validate      → extended analysis (metrics, topological order, warnings)
  GET  /api/pipelines     → list saved pipelines
  POST /api/pipelines     → save a pipeline
  GET  /api/pipelines/{id}→ load a pipeline
  DELETE /api/pipelines/{id} → delete a pipeline

Run:
  pip install fastapi uvicorn pydantic
  uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from collections import defaultdict, deque
import json, os, uuid, datetime

app = FastAPI(title="FlowCraft API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PIPELINES_DIR = "./pipelines"
os.makedirs(PIPELINES_DIR, exist_ok=True)


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class Position(BaseModel):
    x: float
    y: float

class Node(BaseModel):
    id: str
    type: str
    data: Dict[str, Any] = {}
    position: Optional[Position] = None

class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    type:         Optional[str] = None
    animated:     Optional[bool] = None
    style:        Optional[Dict] = None
    markerEnd:    Optional[Dict] = None

class PipelinePayload(BaseModel):
    name:  Optional[str]        = "Untitled"
    nodes: List[Node]           = []
    edges: List[Edge]           = []
    id:    Optional[str]        = None
    created_at: Optional[str]   = None
    updated_at: Optional[str]   = None


# ─── DAG Analysis ─────────────────────────────────────────────────────────────

def is_dag(nodes: List[Node], edges: List[Edge]) -> bool:
    """
    Kahn's algorithm — returns True iff the graph is a Directed Acyclic Graph.
    """
    if not nodes:
        return True

    node_ids    = {n.id for n in nodes}
    in_degree   = {n.id: 0 for n in nodes}
    adj         = defaultdict(list)

    for e in edges:
        if e.source in node_ids and e.target in node_ids:
            adj[e.source].append(e.target)
            in_degree[e.target] += 1

    queue   = deque(nid for nid, deg in in_degree.items() if deg == 0)
    visited = 0

    while queue:
        nid = queue.popleft()
        visited += 1
        for neighbor in adj[nid]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return visited == len(nodes)


def analyze_graph(nodes: List[Node], edges: List[Edge]) -> Dict:
    """Extended analysis — topological order, depths, warnings."""
    node_ids   = {n.id for n in nodes}
    in_deg     = {n.id: 0 for n in nodes}
    out_deg    = {n.id: 0 for n in nodes}
    adj        = defaultdict(list)

    for e in edges:
        if e.source in node_ids and e.target in node_ids:
            adj[e.source].append(e.target)
            in_deg[e.target]  += 1
            out_deg[e.source] += 1

    # Kahn's
    queue  = deque(nid for nid, d in in_deg.items() if d == 0)
    order  = []
    tmp_in = dict(in_deg)

    while queue:
        nid = queue.popleft()
        order.append(nid)
        for nb in adj[nid]:
            tmp_in[nb] -= 1
            if tmp_in[nb] == 0:
                queue.append(nb)

    dag = len(order) == len(nodes)

    # Depth (longest path from sources)
    depth = {n.id: 0 for n in nodes}
    for nid in order:
        for nb in adj[nid]:
            depth[nb] = max(depth[nb], depth[nid] + 1)

    connected = set()
    for e in edges:
        connected |= {e.source, e.target}
    isolated = [n.id for n in nodes if n.id not in connected and len(nodes) > 1]

    type_counts: Dict[str, int] = defaultdict(int)
    for n in nodes:
        type_counts[n.type] += 1

    warnings = []
    if isolated:
        warnings.append(f"{len(isolated)} disconnected node(s) found")
    if type_counts.get("customInput", 0) == 0:
        warnings.append("No Input nodes — pipeline has no defined entry point")
    if type_counts.get("customOutput", 0) == 0:
        warnings.append("No Output nodes — pipeline has no defined exit point")

    return {
        "is_dag":             dag,
        "topological_order":  order,
        "max_depth":          max(depth.values()) if depth else 0,
        "source_nodes":       [n.id for n in nodes if in_deg[n.id] == 0  and out_deg[n.id] > 0],
        "sink_nodes":         [n.id for n in nodes if out_deg[n.id] == 0 and in_deg[n.id]  > 0],
        "isolated_nodes":     isolated,
        "node_types":         dict(type_counts),
        "warnings":           warnings,
    }


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"service": "FlowCraft API", "status": "running", "version": "1.0.0"}


# ── PART 4: Core assessment endpoint ─────────────────────────────────────────
@app.post("/pipelines/parse")
def parse_pipeline(payload: PipelinePayload):
    """
    Required by the assessment.
    Returns: { num_nodes, num_edges, is_dag }
    """
    num_nodes = len(payload.nodes)
    num_edges = len(payload.edges)
    dag       = is_dag(payload.nodes, payload.edges)

    return {
        "num_nodes": num_nodes,
        "num_edges": num_edges,
        "is_dag":    dag,
    }


# ── Extended validation ───────────────────────────────────────────────────────
@app.post("/api/validate")
def validate_pipeline(payload: PipelinePayload):
    """Extended validation with metrics, warnings, and topological order."""
    if not payload.nodes:
        return {
            "valid": False,
            "structural_valid": True,
            "message": "Pipeline is empty",
            "warnings": ["No nodes present"],
            "metrics": {},
        }

    analysis = analyze_graph(payload.nodes, payload.edges)
    dag      = analysis["is_dag"]

    metrics = {
        "total_nodes":   len(payload.nodes),
        "total_edges":   len(payload.edges),
        "node_types":    analysis["node_types"],
        "max_depth":     analysis["max_depth"],
        "source_nodes":  len(analysis["source_nodes"]),
        "sink_nodes":    len(analysis["sink_nodes"]),
        "isolated_nodes":len(analysis["isolated_nodes"]),
    }

    return {
        "valid":             dag and not analysis["warnings"],
        "structural_valid":  dag,
        "message":           "Valid DAG" if dag else "Cycle detected",
        "warnings":          analysis["warnings"],
        "metrics":           metrics,
        "topological_order": analysis["topological_order"],
    }


# ── Pipeline CRUD ─────────────────────────────────────────────────────────────
@app.get("/api/pipelines")
def list_pipelines():
    pipelines = []
    for f in sorted(os.listdir(PIPELINES_DIR)):
        if not f.endswith(".json"):
            continue
        try:
            with open(os.path.join(PIPELINES_DIR, f)) as fp:
                d = json.load(fp)
            pipelines.append({
                "id":         d.get("id", f[:-5]),
                "name":       d.get("name", "Untitled"),
                "nodes":      len(d.get("nodes", [])),
                "edges":      len(d.get("edges", [])),
                "created_at": d.get("created_at", ""),
                "updated_at": d.get("updated_at", ""),
            })
        except Exception:
            pass
    return {"pipelines": pipelines, "count": len(pipelines)}


@app.post("/api/pipelines")
def save_pipeline(payload: PipelinePayload):
    now = datetime.datetime.utcnow().isoformat()
    if not payload.id:
        payload.id         = str(uuid.uuid4())[:8]
        payload.created_at = now
    payload.updated_at = now

    path = os.path.join(PIPELINES_DIR, f"{payload.id}.json")
    with open(path, "w") as f:
        json.dump(payload.model_dump(), f, indent=2)

    return {"success": True, "id": payload.id, "name": payload.name}


@app.get("/api/pipelines/{pipeline_id}")
def get_pipeline(pipeline_id: str):
    path = os.path.join(PIPELINES_DIR, f"{pipeline_id}.json")
    if not os.path.exists(path):
        raise HTTPException(404, f"Pipeline '{pipeline_id}' not found")
    with open(path) as f:
        return json.load(f)


@app.delete("/api/pipelines/{pipeline_id}")
def delete_pipeline(pipeline_id: str):
    path = os.path.join(PIPELINES_DIR, f"{pipeline_id}.json")
    if not os.path.exists(path):
        raise HTTPException(404, f"Pipeline '{pipeline_id}' not found")
    os.remove(path)
    return {"success": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
