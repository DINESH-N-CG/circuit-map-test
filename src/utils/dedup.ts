/**
 * Core Deduplication and Data Processing Utilities
 * Handles duplicate detection, version merging, and data parsing
 */

import {
  RecordNode,
  Document,
  FlowNode,
  FlowEdge,
  LinkType,
  DocumentVersion,
  DataRepository,
  NodeIndex,
  RecordLink,
  DocumentLink,
} from '../types';

// ==================== Deduplication ====================

/**
 * Creates a unique node ID based on the record key
 */
export function createRecordNodeId(recordKey: string): string {
  return `record-${recordKey}`;
}

/**
 * Creates a unique node ID based on the document key
 * Note: Only ONE document node exists per documentKey, regardless of versions
 */
export function createDocumentNodeId(documentKey: string): string {
  return `document-${documentKey}`;
}

/**
 * Creates a unique node ID for a document version
 */
export function createDocumentVersionNodeId(versionId: string): string {
  return `version-${versionId}`;
}

/**
 * Deduplicates records by key
 */
export function deduplicateRecords(records: RecordNode[]): RecordNode[] {
  const seen = new Map<string, RecordNode>();
  records.forEach((record) => {
    if (!seen.has(record.recordKey)) {
      seen.set(record.recordKey, record);
    }
  });
  return Array.from(seen.values());
}

/**
 * Deduplicates documents by key
 */
export function deduplicateDocuments(documents: Document[]): Document[] {
  const seen = new Map<string, Document>();
  documents.forEach((doc) => {
    if (!seen.has(doc.documentKey)) {
      seen.set(doc.documentKey, doc);
    } else {
      // Merge versions if document already seen
      const existing = seen.get(doc.documentKey)!;
      existing.versions = mergeDocumentVersions(existing.versions, doc.versions);
    }
  });
  return Array.from(seen.values());
}

// ==================== Version Merging ====================

/**
 * Merges and deduplicates document versions
 */
export function mergeDocumentVersions(
  versions1: DocumentVersion[],
  versions2: DocumentVersion[]
): DocumentVersion[] {
  const merged = new Map<string, DocumentVersion>();

  [...versions1, ...versions2].forEach((version) => {
    if (!merged.has(version.versionId)) {
      merged.set(version.versionId, version);
    }
  });

  return Array.from(merged.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

/**
 * Sorts versions by semantic versioning
 */
export function sortVersions(versions: DocumentVersion[]): DocumentVersion[] {
  return [...versions].sort((a, b) => {
    const parseVersion = (v: string) => {
      const parts = v.split('.').map(Number);
      return parts;
    };

    const aParts = parseVersion(a.versionNumber);
    const bParts = parseVersion(b.versionNumber);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aNum = aParts[i] || 0;
      const bNum = bParts[i] || 0;
      if (aNum !== bNum) return bNum - aNum;
    }
    return 0;
  });
}

// ==================== Index Management ====================

/**
 * Creates an efficient lookup index for nodes
 */
export function createNodeIndex(): NodeIndex {
  return {
    recordsByKey: new Map(),
    documentsByKey: new Map(),
    versionsById: new Map(),
    nodeById: new Map(),
  };
}

/**
 * Indexes a record node for fast lookups
 */
export function indexRecordNode(
  index: NodeIndex,
  recordKey: string,
  node: FlowNode
): void {
  index.recordsByKey.set(recordKey, node);
  index.nodeById.set(node.id, node);
}

/**
 * Indexes a document node for fast lookups
 */
export function indexDocumentNode(
  index: NodeIndex,
  documentKey: string,
  node: FlowNode
): void {
  index.documentsByKey.set(documentKey, node);
  index.nodeById.set(node.id, node);
}

/**
 * Indexes a document version node for fast lookups
 */
export function indexDocumentVersionNode(
  index: NodeIndex,
  versionId: string,
  node: FlowNode
): void {
  index.versionsById.set(versionId, node);
  index.nodeById.set(node.id, node);
}

/**
 * Retrieves a record node from index (returns existing node if already exists)
 */
export function getOrCreateRecordNode(
  index: NodeIndex,
  record: RecordNode,
  position: { x: number; y: number }
): FlowNode {
  const existingNode = index.recordsByKey.get(record.recordKey);
  if (existingNode) return existingNode;

  const nodeId = createRecordNodeId(record.recordKey);
  const node: FlowNode = {
    id: nodeId,
    type: 'record',
    position,
    data: {
      type: 'record',
      recordKey: record.recordKey,
      title: record.title,
      metadata: record.metadata,
      isExpanded: false,
      childCount: calculateRecordChildCount(record),
    },
  };

  indexRecordNode(index, record.recordKey, node);
  return node;
}

/**
 * Retrieves a document node from index (returns existing node if already exists)
 */
export function getOrCreateDocumentNode(
  index: NodeIndex,
  document: Document,
  position: { x: number; y: number }
): FlowNode {
  const existingNode = index.documentsByKey.get(document.documentKey);
  if (existingNode) return existingNode;

  const nodeId = createDocumentNodeId(document.documentKey);
  const node: FlowNode = {
    id: nodeId,
    type: 'document',
    position,
    data: {
      type: 'document',
      documentKey: document.documentKey,
      title: document.title,
      versions: sortVersions(document.versions),
      metadata: document.metadata,
      isExpanded: false,
      childCount: calculateDocumentChildCount(document),
    },
  };

  indexDocumentNode(index, document.documentKey, node);
  return node;
}

/**
 * Retrieves a document version node from index (returns existing node if already exists)
 */
export function getOrCreateDocumentVersionNode(
  index: NodeIndex,
  documentKey: string,
  version: DocumentVersion,
  position: { x: number; y: number }
): FlowNode {
  const existingNode = index.versionsById.get(version.versionId);
  if (existingNode) return existingNode;

  const nodeId = createDocumentVersionNodeId(version.versionId);
  const node: FlowNode = {
    id: nodeId,
    type: 'documentVersion',
    position,
    data: {
      type: 'documentVersion',
      documentKey,
      versionId: version.versionId,
      versionNumber: version.versionNumber,
      title: `v${version.versionNumber}`,
      metadata: version.metadata,
      childCount: 0,
    },
  };

  indexDocumentVersionNode(index, version.versionId, node);
  return node;
}

/**
 * Calculates how many children a record would have when expanded
 */
export function calculateRecordChildCount(record: RecordNode): number {
  const uniqueDocuments = new Set<string>();
  const uniqueRecords = new Set<string>();

  record.linkedDocuments?.forEach((link: DocumentLink) => {
    uniqueDocuments.add(link.documentKey);
  });

  record.linkedRecords?.forEach((link: RecordLink) => {
    uniqueRecords.add(link.recordKey);
  });

  return uniqueDocuments.size + uniqueRecords.size;
}

/**
 * Calculates how many children a document would have when expanded
 */
export function calculateDocumentChildCount(document: Document): number {
  const uniqueDocuments = new Set<string>();
  const uniqueRecords = new Set<string>();
  const versions = document.versions?.length || 0;

  document.linkedDocuments?.forEach((link) => {
    uniqueDocuments.add(link.documentKey);
  });

  document.linkedRecords?.forEach((link) => {
    uniqueRecords.add(link.recordKey);
  });

  return uniqueDocuments.size + uniqueRecords.size + versions;
}

// ==================== Data Repository ====================

/**
 * Creates a searchable data repository from raw data
 */
export function createDataRepository(
  records: RecordNode[],
  documents: Document[]
): DataRepository {
  const dedupedRecords = deduplicateRecords(records);
  const dedupedDocuments = deduplicateDocuments(documents);

  return {
    records: new Map(dedupedRecords.map((r) => [r.recordKey, r])),
    documents: new Map(dedupedDocuments.map((d) => [d.documentKey, d])),
    allRecords: dedupedRecords,
    allDocuments: dedupedDocuments,
  };
}

/**
 * Retrieves a record from repository
 */
export function getRecord(
  repository: DataRepository,
  recordKey: string
): RecordNode | undefined {
  return repository.records.get(recordKey);
}

/**
 * Retrieves a document from repository
 */
export function getDocument(
  repository: DataRepository,
  documentKey: string
): Document | undefined {
  return repository.documents.get(documentKey);
}

// ==================== Edge Creation ====================

/**
 * Creates a unique edge ID
 */
export function createEdgeId(
  sourceId: string,
  targetId: string,
  linkType: LinkType
): string {
  return `${sourceId}→${targetId}:${linkType}`;
}

/**
 * Creates an edge between two nodes with proper labeling
 */
export function createEdge(
  sourceId: string,
  targetId: string,
  linkType: LinkType
): FlowEdge {
  return {
    id: createEdgeId(sourceId, targetId, linkType),
    source: sourceId,
    target: targetId,
    // label: formatLinkTypeLabel(linkType), // Removed - don't display link type
    type: 'smoothstep',
    data: { linkType },
    animated: false,
    style: {
      stroke: getLinkTypeColor(linkType),
      strokeWidth: 2,
    },
  };
}

/**
 * Formats link type for display
 */
export function formatLinkTypeLabel(linkType: LinkType): string {
  return linkType.replace(/_/g, ' ').split(' ').map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Gets color for link type visualization
 */
export function getLinkTypeColor(linkType: LinkType): string {
  return '#3b82f6'; // Blue for is_parent_of
}

// ==================== Utility Functions ====================

/**
 * Recursively collects all linked records from a record
 */
export function collectLinkedRecords(
  record: RecordNode,
  repository: DataRepository,
  visited: Set<string> = new Set()
): RecordNode[] {
  if (visited.has(record.recordKey)) return [];
  visited.add(record.recordKey);

  const linked: RecordNode[] = [];
  record.linkedRecords?.forEach((link: RecordLink) => {
    const linkedRecord = getRecord(repository, link.recordKey);
    if (linkedRecord) {
      linked.push(linkedRecord);
    }
  });

  return linked;
}

/**
 * Recursively collects all linked documents from a record
 */
export function collectLinkedDocuments(
  record: RecordNode,
  repository: DataRepository
): Document[] {
  const linked: Document[] = [];
  record.linkedDocuments?.forEach((link) => {
    const linkedDoc = getDocument(repository, link.documentKey);
    if (linkedDoc) {
      linked.push(linkedDoc);
    }
  });
  return linked;
}

/**
 * Validates edge uniqueness (no duplicate edges to same target with same linkType)
 */
export function isEdgeUnique(
  edges: FlowEdge[],
  sourceId: string,
  targetId: string,
  linkType: LinkType
): boolean {
  return !edges.some(
    (edge) =>
      edge.source === sourceId &&
      edge.target === targetId &&
      edge.data?.linkType === linkType
  );
}
