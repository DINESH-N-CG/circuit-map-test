/**
 * useExpand Hook - Manages node expansion state and automatic edge generation
 * Handles expand/collapse logic with deduplication and layout
 */

import { useCallback, useRef } from 'react';
import {
  FlowNode,
  FlowEdge,
  ExpandedState,
  NodeIndex,
  DataRepository,
  LinkType,
} from '../types';
import {
  getOrCreateRecordNode,
  getOrCreateDocumentNode,
  getOrCreateDocumentVersionNode,
  createEdge,
  isEdgeUnique,
  collectLinkedRecords,
  collectLinkedDocuments,
  getRecord,
  getDocument,
} from '../utils/dedup';
import { calculateHierarchicalLayout } from '../utils/layout';

interface UseExpandState {
  expandedState: ExpandedState;
  nodes: FlowNode[];
  edges: FlowEdge[];
  nodeIndex: NodeIndex;
  layoutDirection?: 'LR' | 'TB' | 'RL' | 'BT';
}

interface UseExpandReturn {
  toggleNodeExpansion: (nodeId: string, nodes: FlowNode[], edges: FlowEdge[]) => void;
  expandNode: (
    nodeId: string,
    nodes: FlowNode[],
    edges: FlowEdge[],
    repository: DataRepository
  ) => { nodes: FlowNode[]; edges: FlowEdge[] };
  collapseNode: (nodeId: string) => void;
  expandedState: ExpandedState;
  setExpandedState: (state: ExpandedState) => void;
}

/**
 * Hook for managing node expansion and contraction
 */
export function useExpand(initialState: UseExpandState): UseExpandReturn {
  const expandedStateRef = useRef<ExpandedState>(initialState.expandedState);

  const setExpandedState = useCallback((state: ExpandedState) => {
    expandedStateRef.current = state;
  }, []);

  /**
   * Expands a node and generates child nodes with edges
   */
  const expandNode = useCallback(
    (
      nodeId: string,
      nodes: FlowNode[],
      edges: FlowEdge[],
      repository: DataRepository
    ): { nodes: FlowNode[]; edges: FlowEdge[] } => {
      const sourceNode = nodes.find((n) => n.id === nodeId);
      if (!sourceNode) {
        return { nodes, edges };
      }

      const newNodes: FlowNode[] = [...nodes];
      let newEdges: FlowEdge[] = [...edges];

      // Determine if this is a record or document node
      const isRecord = sourceNode.type === 'record';
      const isDocument = sourceNode.type === 'document';

      if (isRecord) {
        // Record node expansion
        const recordKey = sourceNode.data.recordKey;
        if (!recordKey) {
          return { nodes: newNodes, edges: newEdges };
        }
        const record = getRecord(repository, recordKey);

        if (!record) {
          return { nodes: newNodes, edges: newEdges };
        }

        const baseXOffset = sourceNode.position.x + 250;
        let yOffset = sourceNode.position.y - 100;

        // Add linked records as children
        const linkedRecords = collectLinkedRecords(record, repository);
        linkedRecords.forEach((linkedRecord) => {
          const childNode = getOrCreateRecordNode(
            initialState.nodeIndex,
            linkedRecord,
            { x: baseXOffset, y: yOffset }
          );

          // Add node if not already present
          if (!newNodes.find((n) => n.id === childNode.id)) {
            newNodes.push(childNode);
          }

          // Create edge if unique
          const recordLink = record.linkedRecords?.find(
            (l) => l.recordKey === linkedRecord.recordKey
          );
          const linkType = (recordLink?.linkType || 'related_to') as LinkType;

          if (isEdgeUnique(newEdges, nodeId, childNode.id, linkType)) {
            newEdges.push(createEdge(nodeId, childNode.id, linkType));
          }

          yOffset += 120;
        });

        // Add linked documents as children
        const linkedDocs = collectLinkedDocuments(record, repository);
        linkedDocs.forEach((linkedDoc) => {
          const childNode = getOrCreateDocumentNode(
            initialState.nodeIndex,
            linkedDoc,
            { x: baseXOffset, y: yOffset }
          );

          if (!newNodes.find((n) => n.id === childNode.id)) {
            newNodes.push(childNode);
          }

          const docLink = record.linkedDocuments?.find(
            (l) => l.documentKey === linkedDoc.documentKey
          );
          const linkType = (docLink?.linkType || 'references') as LinkType;

          if (isEdgeUnique(newEdges, nodeId, childNode.id, linkType)) {
            newEdges.push(createEdge(nodeId, childNode.id, linkType));
          }

          yOffset += 140;
        });
      } else if (isDocument) {
        // Document node expansion
        const documentKey = sourceNode.data.documentKey;
        if (!documentKey) {
          return { nodes: newNodes, edges: newEdges };
        }
        const document = getDocument(repository, documentKey);

        if (!document) {
          return { nodes: newNodes, edges: newEdges };
        }

        const baseXOffset = sourceNode.position.x + 250;
        let yOffset = sourceNode.position.y - 100;

        // Add linked records
        document.linkedRecords?.forEach((linkRecord) => {
          const linkedRecord = getRecord(repository, linkRecord.recordKey);
          if (linkedRecord) {
            const childNode = getOrCreateRecordNode(
              initialState.nodeIndex,
              linkedRecord,
              { x: baseXOffset, y: yOffset }
            );

            if (!newNodes.find((n) => n.id === childNode.id)) {
              newNodes.push(childNode);

          // Add document versions as separate nodes
          const versions = document.versions || [];
          versions.forEach((version) => {
            const versionNode = getOrCreateDocumentVersionNode(
              initialState.nodeIndex,
              document.documentKey,
              version,
              { x: baseXOffset + 80, y: yOffset }
            );

            if (!newNodes.find((n) => n.id === versionNode.id)) {
              newNodes.push(versionNode);
            }

            const linkType: LinkType = 'is_parent_of';
            if (isEdgeUnique(newEdges, nodeId, versionNode.id, linkType)) {
              newEdges.push(createEdge(nodeId, versionNode.id, linkType));
            }

            yOffset += 90;
          });
            }

            const linkType = (linkRecord.linkType || 'references') as LinkType;
            if (isEdgeUnique(newEdges, nodeId, childNode.id, linkType)) {
              newEdges.push(createEdge(nodeId, childNode.id, linkType));
            }

            yOffset += 120;
          }
        });

        // Add linked documents
        document.linkedDocuments?.forEach((linkDoc) => {
          const linkedDoc = getDocument(repository, linkDoc.documentKey);
          if (linkedDoc) {
            const childNode = getOrCreateDocumentNode(
              initialState.nodeIndex,
              linkedDoc,
              { x: baseXOffset, y: yOffset }
            );

            if (!newNodes.find((n) => n.id === childNode.id)) {
              newNodes.push(childNode);
            }

            const linkType = (linkDoc.linkType || 'references') as LinkType;
            if (isEdgeUnique(newEdges, nodeId, childNode.id, linkType)) {
              newEdges.push(createEdge(nodeId, childNode.id, linkType));
            }

            yOffset += 140;
          }
        });
      }

      // Update node to mark as expanded
      const updatedNodes = newNodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, isExpanded: true } } : n
      );

      // Apply layout to new nodes
      const layoutedNodes = calculateHierarchicalLayout(
        updatedNodes,
        newEdges,
        nodeId,
        initialState.layoutDirection || 'TB'
      );

      return { nodes: layoutedNodes, edges: newEdges };
    },
    [initialState.nodeIndex]
  );

  /**
   * Collapses a node and removes child nodes and edges
   */
  const collapseNode = useCallback((nodeId: string) => {
    expandedStateRef.current = {
      ...expandedStateRef.current,
      [nodeId]: false,
    };
  }, []);

  /**
   * Toggles expansion state
   */
  const toggleNodeExpansion = useCallback(
    (
      nodeId: string,
      nodes: FlowNode[],
      edges: FlowEdge[]
    ) => {
      const currentState = expandedStateRef.current[nodeId] || false;
      const newState = !currentState;

      setExpandedState({
        ...expandedStateRef.current,
        [nodeId]: newState,
      });
    },
    [setExpandedState]
  );

  return {
    toggleNodeExpansion,
    expandNode,
    collapseNode,
    expandedState: expandedStateRef.current,
    setExpandedState,
  };
}

/**
 * Utility to get expanded descendants of a node
 */
export function getNodeDescendants(
  nodeId: string,
  nodes: FlowNode[],
  edges: FlowEdge[]
): string[] {
  const descendants: Set<string> = new Set();

  const collectDescendants = (id: string) => {
    const childEdges = edges.filter((e) => e.source === id);
    childEdges.forEach((edge) => {
      descendants.add(edge.target);
      collectDescendants(edge.target);
    });
  };

  collectDescendants(nodeId);
  return Array.from(descendants);
}

/**
 * Utility to remove node and all its descendants
 */
export function removeNodeWithDescendants(
  nodeId: string,
  nodes: FlowNode[],
  edges: FlowEdge[]
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const descendantIds = getNodeDescendants(nodeId, nodes, edges);

  const nodesToRemove = new Set([nodeId, ...descendantIds]);

  const newNodes = nodes.filter((n) => !nodesToRemove.has(n.id));
  const newEdges = edges.filter(
    (e) => !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target)
  );

  return { nodes: newNodes, edges: newEdges };
}

/**
 * Expands all nodes in a path from root to target
 */
export function expandNodePath(
  targetNodeId: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  repository: DataRepository,
  nodeIndex: NodeIndex
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  // Find all ancestors of the target node
  const ancestors = findAncestors(targetNodeId, edges);

  let currentNodes = nodes;
  let currentEdges = edges;

  // Expand each ancestor
  for (const ancestorId of ancestors) {
    const { nodes: newNodes, edges: newEdges } = expandNodeHelper(
      ancestorId,
      currentNodes,
      currentEdges,
      repository,
      nodeIndex
    );
    currentNodes = newNodes;
    currentEdges = newEdges;
  }

  return { nodes: currentNodes, edges: currentEdges };
}

/**
 * Helper for expanding a node (similar to expandNode but standalone)
 */
function expandNodeHelper(
  nodeId: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  repository: DataRepository,
  nodeIndex: NodeIndex
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const sourceNode = nodes.find((n) => n.id === nodeId);
  if (!sourceNode) {
    return { nodes, edges };
  }

  const newNodes: FlowNode[] = [...nodes];
  let newEdges: FlowEdge[] = [...edges];

  if (sourceNode.type === 'record') {
    const recordKey = sourceNode.data.recordKey;
    if (!recordKey) {
      return { nodes: newNodes, edges: newEdges };
    }
    const record = getRecord(repository, recordKey);

    if (!record) {
      return { nodes: newNodes, edges: newEdges };
    }

    const baseXOffset = sourceNode.position.x + 250;
    let yOffset = sourceNode.position.y - 100;

    const linkedRecords = collectLinkedRecords(record, repository);
    linkedRecords.forEach((linkedRecord) => {
      const childNode = getOrCreateRecordNode(nodeIndex, linkedRecord, {
        x: baseXOffset,
        y: yOffset,
      });

      if (!newNodes.find((n) => n.id === childNode.id)) {
        newNodes.push(childNode);
      }

      const recordLink = record.linkedRecords?.find(
        (l) => l.recordKey === linkedRecord.recordKey
      );
      const linkType = (recordLink?.linkType || 'related_to') as LinkType;

      if (isEdgeUnique(newEdges, nodeId, childNode.id, linkType)) {
        newEdges.push(createEdge(nodeId, childNode.id, linkType));
      }

      yOffset += 120;
    });

    const linkedDocs = collectLinkedDocuments(record, repository);
    linkedDocs.forEach((linkedDoc) => {
      const childNode = getOrCreateDocumentNode(nodeIndex, linkedDoc, {
        x: baseXOffset,
        y: yOffset,
      });

      if (!newNodes.find((n) => n.id === childNode.id)) {
        newNodes.push(childNode);
      }

      const docLink = record.linkedDocuments?.find(
        (l) => l.documentKey === linkedDoc.documentKey
      );
      const linkType = (docLink?.linkType || 'references') as LinkType;

      if (isEdgeUnique(newEdges, nodeId, childNode.id, linkType)) {
        newEdges.push(createEdge(nodeId, childNode.id, linkType));
      }

      yOffset += 140;
    });
  }
  else if (sourceNode.type === 'document') {
    const documentKey = sourceNode.data.documentKey;
    if (!documentKey) {
      return { nodes: newNodes, edges: newEdges };
    }
    const document = getDocument(repository, documentKey);

    if (!document) {
      return { nodes: newNodes, edges: newEdges };
    }

    const baseXOffset = sourceNode.position.x + 250;
    let yOffset = sourceNode.position.y - 100;

    document.linkedRecords?.forEach((linkRecord) => {
      const linkedRecord = getRecord(repository, linkRecord.recordKey);
      if (linkedRecord) {
        const childNode = getOrCreateRecordNode(nodeIndex, linkedRecord, {
          x: baseXOffset,
          y: yOffset,
        });

        if (!newNodes.find((n) => n.id === childNode.id)) {
          newNodes.push(childNode);
        }

        const linkType = (linkRecord.linkType || 'is_parent_of') as LinkType;
        if (isEdgeUnique(newEdges, nodeId, childNode.id, linkType)) {
          newEdges.push(createEdge(nodeId, childNode.id, linkType));
        }

        yOffset += 120;
      }
    });

    document.linkedDocuments?.forEach((linkDoc) => {
      const linkedDoc = getDocument(repository, linkDoc.documentKey);
      if (linkedDoc) {
        const childNode = getOrCreateDocumentNode(nodeIndex, linkedDoc, {
          x: baseXOffset,
          y: yOffset,
        });

        if (!newNodes.find((n) => n.id === childNode.id)) {
          newNodes.push(childNode);
        }

        const linkType = (linkDoc.linkType || 'is_parent_of') as LinkType;
        if (isEdgeUnique(newEdges, nodeId, childNode.id, linkType)) {
          newEdges.push(createEdge(nodeId, childNode.id, linkType));
        }

        yOffset += 140;
      }
    });

    const versions = document.versions || [];
    versions.forEach((version) => {
      const versionNode = getOrCreateDocumentVersionNode(
        nodeIndex,
        document.documentKey,
        version,
        { x: baseXOffset + 80, y: yOffset }
      );

      if (!newNodes.find((n) => n.id === versionNode.id)) {
        newNodes.push(versionNode);
      }

      const linkType: LinkType = 'is_parent_of';
      if (isEdgeUnique(newEdges, nodeId, versionNode.id, linkType)) {
        newEdges.push(createEdge(nodeId, versionNode.id, linkType));
      }

      yOffset += 90;
    });
  }

  const updatedNodes = newNodes.map((n) =>
    n.id === nodeId ? { ...n, data: { ...n.data, isExpanded: true } } : n
  );

  const layoutedNodes = calculateHierarchicalLayout(
    updatedNodes,
    newEdges,
    nodeId,
    'TB'
  );

  return { nodes: layoutedNodes, edges: newEdges };
}

/**
 * Finds all ancestors of a node in the edge graph
 */
function findAncestors(nodeId: string, edges: FlowEdge[]): string[] {
  const ancestors: Set<string> = new Set();

  const collectAncestors = (id: string) => {
    const parentEdges = edges.filter((e) => e.target === id);
    parentEdges.forEach((edge) => {
      if (!ancestors.has(edge.source)) {
        ancestors.add(edge.source);
        collectAncestors(edge.source);
      }
    });
  };

  collectAncestors(nodeId);
  return Array.from(ancestors);
}
