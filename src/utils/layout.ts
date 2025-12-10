/**
 * Auto-Layout Engine using Dagre Algorithm
 * Positions nodes automatically in a tree-like structure
 */

import { FlowNode, FlowEdge } from '../types';

// Dagre node and graph types
interface DagreNode {
  width: number;
  height: number;
}

interface DagreGraph {
  nodes: () => string[];
  edges: () => Array<{ v: string; w: string }>;
  node: (id: string) => DagreNode | undefined;
  edge: (v: string, w: string) => any;
  setNode: (id: string, node: DagreNode) => void;
  setEdge: (v: string, w: string, label?: any) => void;
  layout: () => void;
}

// Default node dimensions
const DEFAULT_NODE_WIDTH = 200;
const DEFAULT_NODE_HEIGHT = 60;
const DOCUMENT_NODE_HEIGHT = 100;

/**
 * Simulates Dagre layout algorithm
 * Since we might not have dagre-js installed, we provide a working layout engine
 */
export class LayoutEngine {
  private nodeWidth: number = DEFAULT_NODE_WIDTH;
  private nodeHeight: number = DEFAULT_NODE_HEIGHT;
  private levelGap: number = 120;
  private nodeGap: number = 60;

  constructor(options?: {
    nodeWidth?: number;
    nodeHeight?: number;
    levelGap?: number;
    nodeGap?: number;
  }) {
    if (options?.nodeWidth) this.nodeWidth = options.nodeWidth;
    if (options?.nodeHeight) this.nodeHeight = options.nodeHeight;
    if (options?.levelGap) this.levelGap = options.levelGap;
    if (options?.nodeGap) this.nodeGap = options.nodeGap;
  }

  /**
   * Calculates layout for nodes and edges using hierarchical positioning
   */
  public calculateLayout(
    nodes: FlowNode[],
    edges: FlowEdge[],
    options?: {
      direction?: 'LR' | 'TB' | 'RL' | 'BT';
      rootNodeId?: string;
    }
  ): FlowNode[] {
    const direction = options?.direction || 'LR';
    const rootNodeId = options?.rootNodeId || nodes[0]?.id;

    if (nodes.length === 0) return [];

    // Build adjacency list
    const adjacencyList = this.buildAdjacencyList(nodes, edges);

    // Calculate levels/hierarchy
    const levels = this.calculateLevels(nodes, edges, rootNodeId);

    // Position nodes based on hierarchy
    const layoutedNodes = this.positionNodes(
      nodes,
      levels,
      direction
    );

    return layoutedNodes;
  }

  /**
   * Builds an adjacency list from nodes and edges
   */
  private buildAdjacencyList(
    nodes: FlowNode[],
    edges: FlowEdge[]
  ): Map<string, string[]> {
    const adjacency = new Map<string, string[]>();

    nodes.forEach((node) => {
      adjacency.set(node.id, []);
    });

    edges.forEach((edge) => {
      const neighbors = adjacency.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacency.set(edge.source, neighbors);
    });

    return adjacency;
  }

  /**
   * Calculates node levels (depth) based on parent-child relationships
   */
  private calculateLevels(
    nodes: FlowNode[],
    edges: FlowEdge[],
    rootNodeId?: string
  ): Map<string, number> {
    const levels = new Map<string, number>();
    const adjacency = this.buildAdjacencyList(nodes, edges);
    const visited = new Set<string>();

    const startNode = rootNodeId || nodes[0]?.id;
    if (!startNode) return levels;

    const dfs = (nodeId: string, level: number) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      levels.set(nodeId, level);

      adjacency.get(nodeId)?.forEach((childId) => {
        dfs(childId, level + 1);
      });
    };

    dfs(startNode, 0);

    // Handle disconnected nodes
    nodes.forEach((node) => {
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
      }
    });

    return levels;
  }

  /**
   * Positions nodes based on calculated levels
   */
  private positionNodes(
    nodes: FlowNode[],
    levels: Map<string, number>,
    direction: 'LR' | 'TB' | 'RL' | 'BT'
  ): FlowNode[] {
    // Group nodes by level
    const levelGroups = new Map<number, FlowNode[]>();
    nodes.forEach((node) => {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });

    const layoutedNodes: FlowNode[] = [];

    // Position based on direction
    if (direction === 'LR' || direction === 'RL') {
      let currentX = direction === 'RL' ? -1000 : 0;

      // Sort levels for consistent positioning
      const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) =>
        direction === 'RL' ? b - a : a - b
      );

      sortedLevels.forEach((level) => {
        const nodesAtLevel = levelGroups.get(level)!;
        const totalHeight = nodesAtLevel.length * (this.nodeHeight + this.nodeGap);
        let currentY = -totalHeight / 2;

        nodesAtLevel.forEach((node) => {
          layoutedNodes.push({
            ...node,
            position: {
              x: currentX,
              y: currentY,
            },
          });
          currentY += this.nodeHeight + this.nodeGap;
        });

        currentX += this.nodeWidth + this.levelGap;
      });
    } else {
      // TB or BT
      let currentY = direction === 'BT' ? -1000 : 0;

      const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) =>
        direction === 'BT' ? b - a : a - b
      );

      sortedLevels.forEach((level) => {
        const nodesAtLevel = levelGroups.get(level)!;
        const totalWidth = nodesAtLevel.length * (this.nodeWidth + this.nodeGap);
        let currentX = -totalWidth / 2;

        nodesAtLevel.forEach((node) => {
          layoutedNodes.push({
            ...node,
            position: {
              x: currentX,
              y: currentY,
            },
          });
          currentX += this.nodeWidth + this.nodeGap;
        });

        currentY += this.nodeHeight + this.levelGap;
      });
    }

    return layoutedNodes;
  }
}

/**
 * Alternative Dagre-compatible layout helper (works with actual dagre-js if installed)
 */
export function layoutWithDagre(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: 'LR' | 'TB' = 'LR'
): FlowNode[] {
  // Try to use dagre if available, otherwise fall back to our engine
  try {
    // Check if dagre is available
    const dagreModule = require('dagre');
    return layoutWithDagreModule(nodes, edges, direction, dagreModule);
  } catch (e) {
    // Fall back to our implementation
    const engine = new LayoutEngine();
    return engine.calculateLayout(nodes, edges, { direction });
  }
}

/**
 * Uses actual Dagre module if available
 */
function layoutWithDagreModule(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: 'LR' | 'TB',
  dagreModule: any
): FlowNode[] {
  const g = new dagreModule.graphlib.Graph();
  g.setGraph({ rankdir: direction });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes
  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: DEFAULT_NODE_WIDTH,
      height:
        node.data.type === 'document'
          ? DOCUMENT_NODE_HEIGHT
          : DEFAULT_NODE_HEIGHT,
    });
  });

  // Add edges
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Run layout
  dagreModule.layout(g);

  // Apply positions
  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - DEFAULT_NODE_WIDTH / 2,
        y: dagreNode.y - DEFAULT_NODE_HEIGHT / 2,
      },
    };
  });
}

/**
 * Calculates a hierarchical layout without external dependencies
 * Suitable for tree structures
 */
export function calculateHierarchicalLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  rootNodeId?: string,
  direction: 'LR' | 'TB' | 'RL' | 'BT' = 'TB'
): FlowNode[] {
  const engine = new LayoutEngine({
    levelGap: 320,
    nodeGap: 220,
  });

  return engine.calculateLayout(nodes, edges, {
    direction,
    rootNodeId,
  });
}

/**
 * Force-directed layout for better graph visualization
 */
export function calculateForceDirectedLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  iterations: number = 50
): FlowNode[] {
  if (nodes.length === 0) return [];

  // Initialize positions randomly
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node) => {
    positions.set(node.id, {
      x: Math.random() * 400 - 200,
      y: Math.random() * 400 - 200,
    });
  });

  const k = 100; // Optimal distance
  const c = 0.5; // Damping
  const maxDistance = 500;

  // Simulate forces
  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { x: number; y: number }>();

    nodes.forEach((node) => {
      forces.set(node.id, { x: 0, y: 0 });
    });

    // Repulsive forces between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = positions.get(nodes[i].id)!;
        const b = positions.get(nodes[j].id)!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;

        const force = (k * k) / dist;
        const fx = (force * dx) / dist;
        const fy = (force * dy) / dist;

        const fa = forces.get(nodes[i].id)!;
        const fb = forces.get(nodes[j].id)!;

        fa.x += fx;
        fa.y += fy;
        fb.x -= fx;
        fb.y -= fy;
      }
    }

    // Attractive forces along edges
    edges.forEach((edge) => {
      const a = positions.get(edge.source)!;
      const b = positions.get(edge.target)!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const force = (dist * dist) / k;
      const fx = (force * dx) / (dist + 0.01);
      const fy = (force * dy) / (dist + 0.01);

      const fa = forces.get(edge.source)!;
      const fb = forces.get(edge.target)!;

      fa.x += fx;
      fa.y += fy;
      fb.x -= fx;
      fb.y -= fy;
    });

    // Update positions
    nodes.forEach((node) => {
      const force = forces.get(node.id)!;
      const pos = positions.get(node.id)!;
      const dist = Math.sqrt(force.x * force.x + force.y * force.y);

      if (dist > 0) {
        pos.x += (c * force.x) / dist;
        pos.y += (c * force.y) / dist;
      }
    });
  }

  // Apply calculated positions
  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id)!,
  }));
}

/**
 * Circular layout - useful for symmetrical graphs
 */
export function calculateCircularLayout(nodes: FlowNode[]): FlowNode[] {
  const radius = Math.max(100, nodes.length * 20);
  const angleSlice = (Math.PI * 2) / nodes.length;

  return nodes.map((node, index) => {
    const angle = angleSlice * index;
    return {
      ...node,
      position: {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      },
    };
  });
}
