/**
 * Main Circuit Mapping FlowWidget Component
 * Complete React Flow wrapper with search, expand/collapse, and state management
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  useNodesState,
  useEdgesState,
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  RecordNode as RecordNodeType,
  Document,
  FlowNode,
  FlowEdge,
  ExpandedState,
  NodeIndex,
  DataRepository,
} from '../types';
import { SearchPanel } from './SearchPanel';
import { nodeTypes as customNodeTypes } from './nodes';
import {
  createNodeIndex,
  getOrCreateRecordNode,
  getOrCreateDocumentNode,
  createDataRepository,
} from '../utils/dedup';
import { useExpand, expandNodePath } from '../hooks/useExpand';
import { SearchService } from '../services/search';

import './FlowWidget.css';

// ==================== Props ====================

interface FlowWidgetProps {
  records: RecordNodeType[];
  documents: Document[];
  initialNodeId?: string;
  onNodeSelect?: (nodeId: string, nodeData: any) => void;
  enableMiniMap?: boolean;
  enableSearch?: boolean;
  layoutDirection?: 'LR' | 'TB';
  autoLayoutOnExpand?: boolean;
}

// ==================== Component ====================

export const FlowWidget: React.FC<FlowWidgetProps> = ({
  records,
  documents,
  initialNodeId,
  onNodeSelect,
  enableMiniMap = true,
  enableSearch = true,
  layoutDirection = 'TB',
  autoLayoutOnExpand = true,
}) => {
  // ==================== State ====================

  const [repository] = useState<DataRepository>(() =>
    createDataRepository(records, documents)
  );

  const [nodeIndex] = useState<NodeIndex>(createNodeIndex());

  const [expandedState, setExpandedState] = useState<ExpandedState>({});

  // Initialize nodes and edges
  const [initialNodes] = useState<FlowNode[]>(() => {
    const nodes: FlowNode[] = [];

    // Create initial root node
    if (initialNodeId) {
      // Find record or document with given key
      const record = repository.records.get(initialNodeId);
      const document = repository.documents.get(initialNodeId);

      if (record) {
        const node = getOrCreateRecordNode(nodeIndex, record, { x: 0, y: 0 });
        nodes.push(node);
      } else if (document) {
        const node = getOrCreateDocumentNode(nodeIndex, document, { x: 0, y: 0 });
        nodes.push(node);
      }
    }

    return nodes;
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes as any
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as any);

  // Search service
  const searchService = useMemo(
    () => new SearchService(repository),
    [repository]
  );

  // Expand hook
  const expandHook = useExpand({
    expandedState,
    nodes: nodes as any,
    edges: edges as any,
    nodeIndex,
    layoutDirection,
  });

  const { setCenter } = useReactFlow();

  // ==================== Handlers ====================

  /**
   * Handles node click to expand/collapse
   */
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const flowNode = node as FlowNode;

      // Notify parent
      onNodeSelect?.(flowNode.id, flowNode.data);

      // Check if already expanded
      const isExpanded = expandedState[flowNode.id] || false;

      if (isExpanded) {
        // Collapse: remove children
        const descendants = getNodeDescendants(flowNode.id, nodes as any, edges as any);
        const nodesToKeep = nodes.filter(
          (n) =>
            n.id === flowNode.id || !descendants.includes(n.id)
        );
        const edgesToKeep = edges.filter(
          (e) =>
            e.source !== flowNode.id &&
            !descendants.includes(e.source) &&
            !descendants.includes(e.target)
        );

        setNodes(nodesToKeep);
        setEdges(edgesToKeep);
        setExpandedState((prev) => ({
          ...prev,
          [flowNode.id]: false,
        }));
      } else {
        // Expand: show children
        const { nodes: expandedNodes, edges: expandedEdges } =
          expandHook.expandNode(flowNode.id, nodes as any, edges as any, repository);

        setNodes(expandedNodes as any);
        setEdges(expandedEdges as any);
        setExpandedState((prev) => ({
          ...prev,
          [flowNode.id]: true,
        }));
      }
    },
    [
      expandedState,
      nodes,
      edges,
      repository,
      expandHook,
      setNodes,
      setEdges,
      onNodeSelect,
    ]
  );

  /**
   * Handles search result selection
   */
  const handleSearchSelect = useCallback(
    (key: string, type: 'record' | 'document') => {
      console.log('handleSearchSelect called:', { key, type });
      console.log('Current nodes:', nodes.length);
      console.log('Repository records:', repository.records.size);
      console.log('Repository documents:', repository.documents.size);
      
      let targetNode: FlowNode | undefined;
      const baseXOffset = 0;
      const baseYOffset = 0;

      if (type === 'record') {
        const record = repository.records.get(key);
        console.log('Found record:', record);
        if (record) {
          targetNode = getOrCreateRecordNode(nodeIndex, record, {
            x: baseXOffset,
            y: baseYOffset,
          });
          console.log('Created target node:', targetNode);
        }
      } else {
        const document = repository.documents.get(key);
        console.log('Found document:', document);
        if (document) {
          targetNode = getOrCreateDocumentNode(nodeIndex, document, {
            x: baseXOffset,
            y: baseYOffset,
          });
          console.log('Created target node:', targetNode);
        }
      }

      if (targetNode) {
        // Check if node already exists
        const existing = nodes.find((n) => n.id === targetNode!.id);
        console.log('Existing node?', existing);

        if (existing) {
          // Focus on existing node
          console.log('Focusing on existing node');
          setCenter(
            existing.position.x,
            existing.position.y,
            { zoom: 1, duration: 300 }
          );
        } else {
          // Add new node
          console.log('Adding new node to graph');
          setNodes([...nodes, targetNode as any]);
        }

        // Expand path to this node
        console.log('Expanding path to node');
        const { nodes: pathNodes, edges: pathEdges } = expandNodePath(
          targetNode.id,
          nodes as any,
          edges as any,
          repository,
          nodeIndex
        );
        console.log('Path nodes:', pathNodes.length, 'Path edges:', pathEdges.length);

        if (pathNodes.length > nodes.length) {
          console.log('Updating nodes from path');
          setNodes(pathNodes as any);
        }
        if (pathEdges.length > edges.length) {
          console.log('Updating edges from path');
          setEdges(pathEdges as any);
        }

        // Center and expand the node
        console.log('Centering on node');
        setCenter(
          targetNode.position.x,
          targetNode.position.y,
          { zoom: 1, duration: 300 }
        );
      } else {
        console.log('ERROR: No target node created!');
      }
    },
    [nodes, edges, repository, nodeIndex, setNodes, setEdges, setCenter]
  );

  /**
   * Handles node changes from React Flow
   */
  const handleNodesChange: OnNodesChange = useCallback(
    (changes: any) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  /**
   * Handles edge changes from React Flow
   */
  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  /**
   * Clears the graph
   */
  const handleClearGraph = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setExpandedState({});
  }, [setNodes, setEdges]);

  /**
   * Expands all nodes
   */
  const handleExpandAll = useCallback(() => {
    // Expand all root nodes
    const rootNodes = nodes.filter((n) => !edges.some((e) => e.target === n.id));

    let currentNodes = nodes;
    let currentEdges = edges;

    rootNodes.forEach((node) => {
      if (!expandedState[node.id]) {
        const { nodes: newNodes, edges: newEdges } = expandHook.expandNode(
          node.id,
          currentNodes as any,
          currentEdges as any,
          repository
        );
        currentNodes = newNodes as any;
        currentEdges = newEdges as any;
        setExpandedState((prev) => ({
          ...prev,
          [node.id]: true,
        }));
      }
    });

    setNodes(currentNodes as any);
    setEdges(currentEdges as any);
  }, [nodes, edges, expandedState, repository, expandHook, setNodes, setEdges]);

  // ==================== Effects ====================

  useEffect(() => {
    expandHook.setExpandedState(expandedState);
  }, [expandedState, expandHook]);

  // ==================== Render ====================

  return (
    <div className="flow-widget-container">
      <div className="flow-widget-header">
        <h1 className="flow-widget-title">Circuit Mapping - Dependency Explorer</h1>
        <div className="flow-widget-controls">
          <button onClick={handleClearGraph} className="control-btn clear-btn">
            Clear Graph
          </button>
          <button onClick={handleExpandAll} className="control-btn expand-btn">
            Expand All
          </button>
        </div>
      </div>

      <div className="flow-widget-content">
        {enableSearch && (
          <SearchPanel
            searchService={searchService}
            onSelectRecord={(key: string) => handleSearchSelect(key, 'record')}
            onSelectDocument={(key: string) => handleSearchSelect(key, 'document')}
          />
        )}

        <div className="react-flow-wrapper">
          <ReactFlow
            nodes={nodes as Node[]}
            edges={edges as Edge[]}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeClick={handleNodeClick}
            nodeTypes={customNodeTypes}
            fitView
          >
            <Background color="#aaa" gap={16} />
            <Controls />
            {enableMiniMap && (
              <MiniMap
                nodeColor={(node) => {
                  const flowNode = node as FlowNode;
                  return flowNode.data.type === 'record'
                    ? '#3b82f6'
                    : '#f59e0b';
                }}
              />
            )}
          </ReactFlow>
        </div>
      </div>

      <div className="flow-widget-footer">
        <div className="stat-item">
          <span className="stat-label">Nodes:</span>
          <span className="stat-value">{nodes.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Edges:</span>
          <span className="stat-value">{edges.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Expanded:</span>
          <span className="stat-value">
            {Object.values(expandedState).filter(Boolean).length}
          </span>
        </div>
      </div>
    </div>
  );
};

// ==================== Utility Functions ====================

/**
 * Gets descendants of a node
 */
function getNodeDescendants(
  nodeId: string,
  nodes: FlowNode[],
  edges: FlowEdge[]
): string[] {
  const descendants: Set<string> = new Set();

  const collect = (id: string) => {
    const childEdges = edges.filter((e) => e.source === id);
    childEdges.forEach((edge) => {
      descendants.add(edge.target);
      collect(edge.target);
    });
  };

  collect(nodeId);
  return Array.from(descendants);
}

export default FlowWidget;
