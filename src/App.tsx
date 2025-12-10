/**
 * Main App Component - Circuit Mapping with Clean Professional Design
 */

import React, { useState, useCallback } from 'react';
import ReactFlow, {
  MarkerType,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { SAMPLE_RECORDS, SAMPLE_DOCUMENTS } from './data/sampleData';
import SearchBar from './components/SearchBar';
import RecordNodeComponent from './components/RecordNodeComponent';
import DocumentVersionNodeComponent from './components/DocumentVersionNodeComponent';
import './App.css';

const nodeTypes = {
  recordNode: RecordNodeComponent,
  documentVersionNode: DocumentVersionNodeComponent,
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set<string>());

  const handleClearGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setExpandedNodes(new Set());
  }, [setNodes, setEdges]);

  const findRecordByKey = useCallback(
    (key: string) => SAMPLE_RECORDS.find((r) => r.recordKey === key),
    []
  );

  const findDocumentByKey = useCallback(
    (key: string) => SAMPLE_DOCUMENTS.find((d) => d.documentKey === key),
    []
  );

  const calculatePositions = useCallback((nds: Node[], edgs: Edge[]) => {
    const levels: Map<number, Node[]> = new Map();
    const visited = new Set<string>();

    // Build hierarchy levels
    let levelNum = 0;
    const queue = nds.filter((n) => !edgs.some((e) => e.target === n.id));

    const processLevel = (levelNodes: Node[]) => {
      levels.set(levelNum, levelNodes);
      levelNum++;

      const childIds = new Set<string>();
      levelNodes.forEach((parent) => {
        edgs.forEach((edge) => {
          if (edge.source === parent.id && !visited.has(edge.target)) {
            const child = nds.find((n) => n.id === edge.target);
            if (child) childIds.add(child.id);
          }
        });
      });

      if (childIds.size > 0) {
        const childNodes = nds.filter((n) => childIds.has(n.id));
        childNodes.forEach((n) => visited.add(n.id));
        processLevel(childNodes);
      }
    };

    queue.forEach((n) => visited.add(n.id));
    if (queue.length > 0) processLevel(queue);

    // Position nodes
    let yOffset = 0;
    const positioned: Node[] = [];
    const levelGap = 120;
    const nodeGap = 80;

    levels.forEach((levelNodes) => {
      const levelWidth = levelNodes.length * 220 + (levelNodes.length - 1) * nodeGap;
      let xOffset = -levelWidth / 2;

      levelNodes.forEach((node) => {
        positioned.push({
          ...node,
          position: { x: xOffset, y: yOffset },
        });
        xOffset += 220 + nodeGap;
      });

      yOffset += levelGap;
    });

    return positioned;
  }, []);

  const expandRecordNode = useCallback(
    (recordKey: string) => {
      const nodeId = `record-${recordKey}`;
      if (expandedNodes.has(nodeId)) return;

      const record = findRecordByKey(recordKey);
      if (!record) return;

      let newNodes: Node[] = [];
      let newEdges: Edge[] = [];

      record.linkedRecords?.forEach((link) => {
        const childRec = findRecordByKey(link.recordKey);
        if (childRec) {
          const childId = `record-${childRec.recordKey}`;
          newNodes.push({
            id: childId,
            type: 'recordNode',
            data: { title: childRec.title, key: childRec.recordKey },
            position: { x: 0, y: 0 },
          });
          newEdges.push({
            id: `edge-${nodeId}-${childId}`,
            source: nodeId,
            target: childId,
            markerEnd: { type: MarkerType.Arrow },
          });
        }
      });

      record.linkedDocuments?.forEach((link) => {
        const childDoc = findDocumentByKey(link.documentKey);
        if (childDoc && childDoc.versions.length > 0) {
          const versionId = childDoc.versions[0].versionId;
          const childId = `doc-${childDoc.documentKey}-v-${versionId}`;
          newNodes.push({
            id: childId,
            type: 'documentVersionNode',
            data: {
              title: childDoc.title,
              version: childDoc.versions[0].versionNumber,
              documentKey: childDoc.documentKey,
            },
            position: { x: 0, y: 0 },
          });
          newEdges.push({
            id: `edge-${nodeId}-${childId}`,
            source: nodeId,
            target: childId,
            markerEnd: { type: MarkerType.Arrow },
          });
        }
      });

      const existingIds = new Set(nodes.map((n) => n.id));
      const filteredNodes = newNodes.filter((n) => !existingIds.has(n.id));

      const allNodes = calculatePositions([...nodes, ...filteredNodes], [...edges, ...newEdges]);
      setNodes(allNodes);
      setEdges([...edges, ...newEdges]);
      setExpandedNodes((prev) => new Set(prev).add(nodeId));
    },
    [nodes, edges, expandedNodes, findRecordByKey, findDocumentByKey, calculatePositions, setNodes, setEdges]
  );

  const expandDocumentVersionNode = useCallback(
    (documentKey: string, versionId: string) => {
      const nodeId = `doc-${documentKey}-v-${versionId}`;
      if (expandedNodes.has(nodeId)) return;

      const doc = findDocumentByKey(documentKey);
      if (!doc) return;

      let newNodes: Node[] = [];
      let newEdges: Edge[] = [];

      // Link to related records from the document
      doc.linkedRecords?.forEach((link) => {
        const childRec = SAMPLE_RECORDS.find((r) => r.recordKey === link.recordKey);
        if (childRec) {
          const childId = `record-${childRec.recordKey}`;
          if (!nodes.find((n) => n.id === childId)) {
            newNodes.push({
              id: childId,
              type: 'recordNode',
              data: { title: childRec.title, key: childRec.recordKey },
              position: { x: 0, y: 0 },
            });
          }
          newEdges.push({
            id: `edge-${nodeId}-${childId}`,
            source: nodeId,
            target: childId,
            markerEnd: { type: MarkerType.Arrow },
          });
        }
      });

      const allNodes = calculatePositions([...nodes, ...newNodes], [...edges, ...newEdges]);
      setNodes(allNodes);
      setEdges([...edges, ...newEdges]);
      setExpandedNodes((prev) => new Set(prev).add(nodeId));
    },
    [nodes, edges, expandedNodes, findDocumentByKey, calculatePositions, setNodes, setEdges]
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.id.startsWith('record-')) {
        const recordKey = node.id.replace('record-', '');
        expandRecordNode(recordKey);
      } else if (node.id.startsWith('doc-')) {
        const match = node.id.match(/^doc-(.+)-v-(.+)$/);
        if (match) {
          expandDocumentVersionNode(match[1], match[2]);
        }
      }
    },
    [expandRecordNode, expandDocumentVersionNode]
  );

  const handleExpandAll = useCallback(() => {
    const allNodeIds = nodes.map(n => n.id);
    allNodeIds.forEach(nodeId => {
      if (nodeId.startsWith('record-')) {
        const recordKey = nodeId.replace('record-', '');
        expandRecordNode(recordKey);
      } else if (nodeId.startsWith('doc-')) {
        const match = nodeId.match(/^doc-(.+)-v-(.+)$/);
        if (match) {
          expandDocumentVersionNode(match[1], match[2]);
        }
      }
    });
  }, [nodes, expandRecordNode, expandDocumentVersionNode]);

  const onSearchSelect = useCallback(
    (selection: { type: string; recordKey?: string; documentKey?: string; versionId?: string }) => {
      let rootNode: Node;

      if (selection.type === 'record' && selection.recordKey) {
        const rec = findRecordByKey(selection.recordKey);
        if (!rec) return;
        rootNode = {
          id: `record-${rec.recordKey}`,
          type: 'recordNode',
          data: { title: rec.title, key: rec.recordKey },
          position: { x: 0, y: 0 },
        };
      } else if (selection.type === 'document' && selection.documentKey) {
        const doc = findDocumentByKey(selection.documentKey);
        if (!doc || !doc.versions.length) return;
        const ver = doc.versions[0];
        rootNode = {
          id: `doc-${doc.documentKey}-v-${ver.versionId}`,
          type: 'documentVersionNode',
          data: { title: doc.title, version: ver.versionNumber, documentKey: doc.documentKey },
          position: { x: 0, y: 0 },
        };
      } else {
        return;
      }

      setNodes([rootNode]);
      setEdges([]);
      setExpandedNodes(new Set());
    },
    [findRecordByKey, findDocumentByKey, setNodes, setEdges]
  );

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">Circuit Mapping - Dependency Explorer</h1>
        <div className="app-header-actions">
          <button className="header-button" onClick={handleClearGraph}>
            Clear Graph
          </button>
          <button className="header-button" onClick={handleExpandAll} disabled={nodes.length === 0}>
            Expand All
          </button>
        </div>
      </div>
      <div className="app-content">
        <SearchBar 
          data={{ records: SAMPLE_RECORDS, documents: SAMPLE_DOCUMENTS }} 
          onSelect={onSearchSelect} 
        />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          snapToGrid
          snapGrid={[15, 15]}
          attributionPosition="top-right"
          style={{ backgroundColor: '#f5f7fa' }}
        />
        <div className="app-footer">
          <span className="node-count">Nodes: {nodes.length} | Edges: {edges.length}</span>
        </div>
      </div>
    </div>
  );
}

export default App;
