/**
 * Core Type Definitions for Circuit Mapping System
 * Defines Records, Documents, Versions, and Graph structures
 */

// ==================== Base Data Types ====================

export type LinkType = 'is_parent_of';

export interface RecordNode {
  recordKey: string;
  title: string;
  description?: string;
  metadata?: { [key: string]: any };
  linkedRecords?: RecordLink[];
  linkedDocuments?: DocumentLink[];
}

export interface RecordLink {
  recordKey: string;
  linkType: LinkType;
}

export interface DocumentLink {
  documentKey: string;
  versionId?: string;
  linkType: LinkType;
}

export interface Document {
  documentKey: string;
  title: string;
  description?: string;
  metadata?: { [key: string]: any };
  versions: DocumentVersion[];
  linkedRecords?: RecordLink[];
  linkedDocuments?: DocumentLink[];
}

export interface DocumentVersion {
  versionId: string;
  versionNumber: string;
  createdAt: string;
  metadata?: { [key: string]: any };
}

// ==================== Graph Types ====================

export type NodeType = 'record' | 'document' | 'documentVersion';

export interface FlowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: FlowNodeData;
  parentNode?: string;
  extent?: 'parent' | 'parent!';
  selected?: boolean;
  isGroup?: boolean;
}

export interface FlowNodeData {
  type: NodeType;
  recordKey?: string;
  documentKey?: string;
  versionId?: string;
  versionNumber?: string;
  title: string;
  versions?: DocumentVersion[];
  metadata?: { [key: string]: any };
  isExpanded?: boolean;
  childCount?: number;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  data?: {
    linkType: LinkType;
  };
  animated?: boolean;
  style?: { [key: string]: any };
}

// ==================== State Management Types ====================

export interface ExpandedState {
  [nodeId: string]: boolean;
}

export interface NodeIndex {
  recordsByKey: Map<string, FlowNode>;
  documentsByKey: Map<string, FlowNode>;
   versionsById: Map<string, FlowNode>;
  nodeById: Map<string, FlowNode>;
}

export interface GraphState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  expandedState: ExpandedState;
  nodeIndex: NodeIndex;
}

// ==================== Search Types ====================

export type SearchCategory = 'records' | 'documents' | 'all';

export interface SearchResult {
  id: string;
  type: 'record' | 'document';
  key: string;
  title: string;
  category: SearchCategory;
  metadata?: { [key: string]: any };
}

export interface SearchQuery {
  query: string;
  categories: SearchCategory[];
  limit?: number;
}

// ==================== Data Repository ====================

export interface DataRepository {
  records: Map<string, RecordNode>;
  documents: Map<string, Document>;
  allRecords: RecordNode[];
  allDocuments: Document[];
}

// ==================== API Types ====================

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface FetchDataOptions {
  includeVersions?: boolean;
  maxDepth?: number;
  limit?: number;
}
