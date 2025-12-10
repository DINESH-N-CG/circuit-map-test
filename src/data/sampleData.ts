/**
 * Sample Dataset for Circuit Mapping Demo
 * Demonstrates typical enterprise data structure with records, documents, and versions
 */

import { RecordNode, Document } from '../types';

// ==================== Sample Data ====================

export const SAMPLE_RECORDS: RecordNode[] = [
  {
    recordKey: 'REC-001',
    title: 'System Architecture Specification',
    description: 'Core system architecture and design patterns',
    metadata: {
      owner: 'John Doe',
      department: 'Architecture',
      status: 'Active',
    },
    linkedRecords: [
      { recordKey: 'REC-002', linkType: 'is_parent_of' },
      { recordKey: 'REC-003', linkType: 'is_parent_of' },
    ],
    linkedDocuments: [
      { documentKey: 'DOC-001', linkType: 'is_parent_of' },
      { documentKey: 'DOC-002', linkType: 'is_parent_of' },
    ],
  },
  {
    recordKey: 'REC-002',
    title: 'API Layer Design',
    description: 'REST and GraphQL API specifications',
    metadata: {
      owner: 'Jane Smith',
      department: 'Engineering',
      status: 'In Progress',
    },
    linkedRecords: [
      { recordKey: 'REC-004', linkType: 'is_parent_of' },
    ],
    linkedDocuments: [
      { documentKey: 'DOC-003', linkType: 'is_parent_of' },
    ],
  },
  {
    recordKey: 'REC-003',
    title: 'Database Schema Design',
    description: 'Database structure and relationships',
    metadata: {
      owner: 'Bob Johnson',
      department: 'Data Engineering',
      status: 'Active',
    },
    linkedDocuments: [
      { documentKey: 'DOC-004', linkType: 'is_parent_of' },
    ],
  },
  {
    recordKey: 'REC-004',
    title: 'Authentication & Authorization',
    description: 'OAuth2 and RBAC implementation',
    metadata: {
      owner: 'Alice Williams',
      department: 'Security',
      status: 'Active',
    },
    linkedDocuments: [
      { documentKey: 'DOC-005', linkType: 'is_parent_of' },
    ],
  },
  {
    recordKey: 'REC-005',
    title: 'Frontend Framework',
    description: 'React and component architecture',
    metadata: {
      owner: 'Charlie Brown',
      department: 'Frontend',
      status: 'Active',
    },
    linkedRecords: [
      { recordKey: 'REC-001', linkType: 'is_parent_of' },
    ],
    linkedDocuments: [
      { documentKey: 'DOC-006', linkType: 'is_parent_of' },
    ],
  },
  {
    recordKey: 'REC-006',
    title: 'DevOps Pipeline',
    description: 'CI/CD and deployment automation',
    metadata: {
      owner: 'Diana Martinez',
      department: 'DevOps',
      status: 'Active',
    },
    linkedRecords: [
      { recordKey: 'REC-001', linkType: 'is_parent_of' },
    ],
  },
];

export const SAMPLE_DOCUMENTS: Document[] = [
  {
    documentKey: 'DOC-001',
    title: 'Architecture Design Document',
    description: 'Complete system architecture documentation',
    metadata: {
      department: 'Architecture',
      confidentiality: 'Internal',
    },
    versions: [
      {
        versionId: 'v1-uuid-001',
        versionNumber: '1.0',
        createdAt: '2024-01-15T10:00:00Z',
        metadata: { author: 'John Doe' },
      },
      {
        versionId: 'v1-uuid-002',
        versionNumber: '1.1',
        createdAt: '2024-01-20T14:30:00Z',
        metadata: { author: 'John Doe', changes: 'Minor updates' },
      },
      {
        versionId: 'v1-uuid-003',
        versionNumber: '2.0',
        createdAt: '2024-02-01T09:00:00Z',
        metadata: { author: 'Jane Smith', changes: 'Major revision' },
      },
    ],
    linkedRecords: [
      { recordKey: 'REC-001', linkType: 'is_parent_of' },
      { recordKey: 'REC-005', linkType: 'is_parent_of' },
    ],
  },
  {
    documentKey: 'DOC-002',
    title: 'Requirement Specification',
    description: 'Functional and non-functional requirements',
    metadata: {
      department: 'Product',
      status: 'Final',
    },
    versions: [
      {
        versionId: 'v2-uuid-001',
        versionNumber: '1.0',
        createdAt: '2024-01-10T08:00:00Z',
        metadata: { author: 'Product Team' },
      },
      {
        versionId: 'v2-uuid-002',
        versionNumber: '1.1',
        createdAt: '2024-01-25T11:00:00Z',
        metadata: { author: 'Product Team', changes: 'Updated scope' },
      },
    ],
    linkedRecords: [
      { recordKey: 'REC-001', linkType: 'is_parent_of' },
    ],
  },
  {
    documentKey: 'DOC-003',
    title: 'API Documentation',
    description: 'REST API endpoints and specifications',
    metadata: {
      department: 'Engineering',
      format: 'OpenAPI',
    },
    versions: [
      {
        versionId: 'v3-uuid-001',
        versionNumber: '1.0',
        createdAt: '2024-02-05T10:00:00Z',
        metadata: { author: 'Jane Smith' },
      },
      {
        versionId: 'v3-uuid-002',
        versionNumber: '2.0',
        createdAt: '2024-03-01T13:00:00Z',
        metadata: { author: 'Jane Smith', changes: 'Added new endpoints' },
      },
      {
        versionId: 'v3-uuid-003',
        versionNumber: '2.1',
        createdAt: '2024-03-15T15:30:00Z',
        metadata: { author: 'Jane Smith', changes: 'Bug fixes' },
      },
    ],
    linkedRecords: [
      { recordKey: 'REC-002', linkType: 'is_parent_of' },
      { recordKey: 'REC-004', linkType: 'is_parent_of' },
    ],
  },
  {
    documentKey: 'DOC-004',
    title: 'Database Schema Guide',
    description: 'SQL schema and entity relationships',
    metadata: {
      department: 'Data',
      type: 'Technical',
    },
    versions: [
      {
        versionId: 'v4-uuid-001',
        versionNumber: '1.0',
        createdAt: '2024-01-18T09:30:00Z',
        metadata: { author: 'Bob Johnson' },
      },
      {
        versionId: 'v4-uuid-002',
        versionNumber: '1.1',
        createdAt: '2024-02-10T10:00:00Z',
        metadata: { author: 'Bob Johnson', changes: 'Added indexes' },
      },
    ],
    linkedRecords: [
      { recordKey: 'REC-003', linkType: 'is_parent_of' },
    ],
  },
  {
    documentKey: 'DOC-005',
    title: 'Security & Compliance Manual',
    description: 'Security policies and compliance procedures',
    metadata: {
      department: 'Security',
      confidentiality: 'Restricted',
    },
    versions: [
      {
        versionId: 'v5-uuid-001',
        versionNumber: '1.0',
        createdAt: '2024-01-12T08:00:00Z',
        metadata: { author: 'Alice Williams' },
      },
      {
        versionId: 'v5-uuid-002',
        versionNumber: '2.0',
        createdAt: '2024-03-01T12:00:00Z',
        metadata: { author: 'Alice Williams', changes: 'Compliance update' },
      },
    ],
    linkedRecords: [
      { recordKey: 'REC-004', linkType: 'is_parent_of' },
    ],
  },
  {
    documentKey: 'DOC-006',
    title: 'Frontend Component Library',
    description: 'React components and UI patterns',
    metadata: {
      department: 'Frontend',
      type: 'Design System',
    },
    versions: [
      {
        versionId: 'v6-uuid-001',
        versionNumber: '1.0',
        createdAt: '2024-02-15T10:00:00Z',
        metadata: { author: 'Charlie Brown' },
      },
      {
        versionId: 'v6-uuid-002',
        versionNumber: '1.1',
        createdAt: '2024-02-28T14:00:00Z',
        metadata: { author: 'Charlie Brown', changes: 'New components' },
      },
      {
        versionId: 'v6-uuid-003',
        versionNumber: '1.2',
        createdAt: '2024-03-10T11:00:00Z',
        metadata: { author: 'Charlie Brown', changes: 'Theme updates' },
      },
    ],
    linkedRecords: [
      { recordKey: 'REC-005', linkType: 'is_parent_of' },
    ],
  },
];

// ==================== Large Dataset (for performance testing) ====================

export function generateLargeDataset(recordCount: number = 500) {
  const records: RecordNode[] = [];
  const documents: Document[] = [];

  for (let i = 0; i < recordCount; i++) {
    const recordKey = `REC-${String(i + 1).padStart(5, '0')}`;
    const linkedRecords = [];
    const linkedDocuments = [];

    // Create some relationships
    if (i > 0) {
      if (Math.random() > 0.5) {
        linkedRecords.push({
          recordKey: `REC-${String(Math.floor(Math.random() * i) + 1).padStart(5, '0')}`,
          linkType: 'is_parent_of' as const,
        });
      }
    }

    if (Math.random() > 0.6) {
      const docIdx = Math.floor(Math.random() * Math.min(i, 100));
      linkedDocuments.push({
        documentKey: `DOC-${String(docIdx + 1).padStart(5, '0')}`,
        linkType: 'is_parent_of' as const,
      });
    }

    records.push({
      recordKey,
      title: `Record ${i + 1} - ${generateRandomName()}`,
      description: `Description for record ${i + 1}`,
      metadata: {
        owner: `User ${Math.floor(Math.random() * 50)}`,
        status: ['Active', 'Inactive', 'In Progress'][Math.floor(Math.random() * 3)],
      },
      linkedRecords,
      linkedDocuments,
    });
  }

  for (let i = 0; i < Math.min(recordCount / 5, 100); i++) {
    const documentKey = `DOC-${String(i + 1).padStart(5, '0')}`;
    const versions = [];

    for (let v = 1; v <= Math.floor(Math.random() * 4) + 1; v++) {
      versions.push({
        versionId: `v${i + 1}-uuid-${String(v).padStart(3, '0')}`,
        versionNumber: `${v}.0`,
        createdAt: new Date(2024, 0, 1 + i + v).toISOString(),
        metadata: { author: `User ${Math.floor(Math.random() * 50)}` },
      });
    }

    documents.push({
      documentKey,
      title: `Document ${i + 1} - ${generateRandomName()}`,
      description: `Description for document ${i + 1}`,
      metadata: {
        department: ['Engineering', 'Product', 'Data', 'Security'][Math.floor(Math.random() * 4)],
      },
      versions,
      linkedRecords: [],
    });
  }

  return { records, documents };
}

function generateRandomName(): string {
  const adjectives = [
    'System',
    'Advanced',
    'Core',
    'Dynamic',
    'Robust',
    'Scalable',
  ];
  const nouns = [
    'Architecture',
    'Implementation',
    'Design',
    'Framework',
    'Module',
    'Library',
  ];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adj} ${noun}`;
}
