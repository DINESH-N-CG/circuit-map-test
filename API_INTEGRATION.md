# Circuit Mapping - Backend API Integration Guide

Complete guide for integrating Circuit Mapping with your backend API.

## 📋 Table of Contents

1. [API Contract](#api-contract)
2. [Implementation Examples](#implementation-examples)
3. [Real-Time Updates](#real-time-updates)
4. [Pagination & Lazy Loading](#pagination--lazy-loading)
5. [Authentication](#authentication)
6. [Error Handling](#error-handling)
7. [Caching Strategy](#caching-strategy)

---

## API Contract

### Record Endpoint

**GET /api/records**

Returns all records with relationships.

```typescript
// Request
interface RecordFetchRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  maxDepth?: number;
}

// Response
interface RecordFetchResponse {
  success: boolean;
  data: Record[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}
```

**GET /api/records/:recordKey**

Returns specific record with full details.

```typescript
interface RecordDetailResponse {
  success: boolean;
  data: Record;
  timestamp: string;
}
```

### Document Endpoint

**GET /api/documents**

Returns all documents with versions.

```typescript
interface DocumentFetchResponse {
  success: boolean;
  data: Document[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}
```

**GET /api/documents/:documentKey**

Returns document with all versions.

```typescript
interface DocumentDetailResponse {
  success: boolean;
  data: Document;
  timestamp: string;
}
```

**GET /api/documents/:documentKey/versions/:versionId**

Returns specific version content.

```typescript
interface DocumentVersionResponse {
  success: boolean;
  data: {
    version: DocumentVersion;
    content: string;  // Document content/body
    metadata: Record<string, any>;
  };
  timestamp: string;
}
```

### Linked Items Endpoint

**GET /api/records/:recordKey/linked**

Returns only the directly linked items (for on-demand expansion).

```typescript
interface LinkedItemsResponse {
  success: boolean;
  data: {
    linkedRecords: Record[];
    linkedDocuments: Document[];
  };
  timestamp: string;
}
```

---

## Implementation Examples

### 1. Basic Data Fetching

```typescript
// services/apiClient.ts

import { Record, Document, APIResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch all records
   */
  async fetchRecords(options?: {
    page?: number;
    pageSize?: number;
  }): Promise<Record[]> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', String(options.page));
    if (options?.pageSize) params.append('pageSize', String(options.pageSize));

    const response = await fetch(`${this.baseUrl}/records?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch records: ${response.statusText}`);
    }

    const data: APIResponse<Record[]> = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch records');
    }

    return data.data || [];
  }

  /**
   * Fetch single record
   */
  async fetchRecord(recordKey: string): Promise<Record> {
    const response = await fetch(`${this.baseUrl}/records/${recordKey}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch record: ${response.statusText}`);
    }

    const data: APIResponse<Record> = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch record');
    }

    return data.data!;
  }

  /**
   * Fetch all documents
   */
  async fetchDocuments(options?: {
    page?: number;
    pageSize?: number;
  }): Promise<Document[]> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', String(options.page));
    if (options?.pageSize) params.append('pageSize', String(options.pageSize));

    const response = await fetch(`${this.baseUrl}/documents?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`);
    }

    const data: APIResponse<Document[]> = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch documents');
    }

    return data.data || [];
  }

  /**
   * Fetch linked items (for expansion)
   */
  async fetchLinkedItems(recordKey: string) {
    const response = await fetch(
      `${this.baseUrl}/records/${recordKey}/linked`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch linked items: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      linkedRecords: data.data?.linkedRecords || [],
      linkedDocuments: data.data?.linkedDocuments || [],
    };
  }
}

// Create singleton instance
export const apiClient = new APIClient();
```

### 2. Integration with FlowWidget

```typescript
// App.tsx

import { useEffect, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import FlowWidget from './components/FlowWidget';
import { Record, Document } from './types';
import { apiClient } from './services/apiClient';

function App() {
  const [records, setRecords] = useState<Record[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [recordsData, documentsData] = await Promise.all([
          apiClient.fetchRecords({ page: 1, pageSize: 100 }),
          apiClient.fetchDocuments({ page: 1, pageSize: 100 }),
        ]);

        setRecords(recordsData);
        setDocuments(documentsData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="loading">Loading Circuit Map...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <ReactFlowProvider>
      <FlowWidget
        records={records}
        documents={documents}
        initialNodeId="REC-001"
      />
    </ReactFlowProvider>
  );
}

export default App;
```

### 3. Search Integration

```typescript
// services/searchApiClient.ts

import { SearchResult } from '../types';

export class SearchAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Search records via API
   */
  async searchRecords(
    query: string,
    limit: number = 15
  ): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      category: 'records',
    });

    const response = await fetch(`${this.baseUrl}/search?${params}`);
    const data = await response.json();

    return data.data || [];
  }

  /**
   * Global search across all items
   */
  async search(
    query: string,
    categories: string[] = ['all'],
    limit: number = 15
  ): Promise<SearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      categories: categories.join(','),
      limit: String(limit),
    });

    const response = await fetch(`${this.baseUrl}/search?${params}`);
    const data = await response.json();

    return data.data || [];
  }
}
```

---

## Real-Time Updates

### WebSocket Integration

```typescript
// services/realtimeClient.ts

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, Function[]> = new Map();

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('Connected to realtime updates');
          resolve();
        };

        this.ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          this.emit(message.type, message.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Subscribe to updates
   */
  subscribe(eventType: string, callback: Function): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  private emit(eventType: string, data: any) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  /**
   * Close connection
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Usage in component
export function useRealtimeUpdates(
  onRecordUpdate: (record: Record) => void,
  onDocumentUpdate: (document: Document) => void
) {
  const [client] = useState(() =>
    new RealtimeClient(
      process.env.REACT_APP_WS_URL || 'ws://localhost:3001/realtime'
    )
  );

  useEffect(() => {
    client.connect().catch(console.error);

    const unsubRecord = client.subscribe('record:updated', onRecordUpdate);
    const unsubDoc = client.subscribe('document:updated', onDocumentUpdate);

    return () => {
      unsubRecord();
      unsubDoc();
      client.disconnect();
    };
  }, [client, onRecordUpdate, onDocumentUpdate]);

  return client;
}
```

---

## Pagination & Lazy Loading

### Incremental Loading Strategy

```typescript
// hooks/useLazyGraphData.ts

import { useCallback, useRef, useState } from 'react';
import { Record, Document } from '../types';
import { apiClient } from '../services/apiClient';

export function useLazyGraphData() {
  const [records, setRecords] = useState<Record[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current) return;

    try {
      const newRecords = await apiClient.fetchRecords({
        page: pageRef.current,
        pageSize: 50,
      });

      if (newRecords.length < 50) {
        hasMoreRef.current = false;
      }

      setRecords((prev) => [
        ...prev,
        ...newRecords.filter(
          (r) => !prev.find((p) => p.recordKey === r.recordKey)
        ),
      ]);

      pageRef.current++;
    } catch (error) {
      console.error('Failed to load more records:', error);
    }
  }, []);

  const loadInitial = useCallback(async () => {
    try {
      pageRef.current = 1;
      hasMoreRef.current = true;

      const initialRecords = await apiClient.fetchRecords({
        page: 1,
        pageSize: 100,
      });
      const initialDocuments = await apiClient.fetchDocuments({
        page: 1,
        pageSize: 100,
      });

      setRecords(initialRecords);
      setDocuments(initialDocuments);

      if (initialRecords.length < 100) {
        hasMoreRef.current = false;
      }

      pageRef.current = 2;
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }, []);

  return {
    records,
    documents,
    loadInitial,
    loadMore,
    hasMore: hasMoreRef.current,
  };
}
```

### On-Demand Node Expansion

```typescript
// Modified useExpand hook for API-driven expansion

async function expandNodeFromAPI(
  nodeId: string,
  recordKey: string | undefined,
  repository: DataRepository
): Promise<{ records: Record[]; documents: Document[] }> {
  if (!recordKey) {
    return { records: [], documents: [] };
  }

  try {
    const { linkedRecords, linkedDocuments } =
      await apiClient.fetchLinkedItems(recordKey);
    return { records: linkedRecords, documents: linkedDocuments };
  } catch (error) {
    console.error('Failed to fetch linked items:', error);
    return { records: [], documents: [] };
  }
}
```

---

## Authentication

### JWT Token Handling

```typescript
// services/authClient.ts

export class AuthClient {
  private token: string | null = null;
  private refreshToken: string | null = null;

  /**
   * Login and get tokens
   */
  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    this.token = data.accessToken;
    this.refreshToken = data.refreshToken;

    localStorage.setItem('accessToken', this.token);
    localStorage.setItem('refreshToken', this.refreshToken);
  }

  /**
   * Get auth headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token || localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Refresh token
   */
  async refreshAccessToken() {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: this.refreshToken || localStorage.getItem('refreshToken'),
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.token = data.accessToken;
    localStorage.setItem('accessToken', this.token);
  }

  /**
   * Logout
   */
  logout() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// Authenticated API client
export class AuthenticatedAPIClient extends APIClient {
  constructor(baseUrl: string, private authClient: AuthClient) {
    super(baseUrl);
  }

  async fetchRecords(): Promise<Record[]> {
    const response = await fetch(`${this.baseUrl}/records`, {
      headers: this.authClient.getAuthHeaders(),
    });

    if (response.status === 401) {
      await this.authClient.refreshAccessToken();
      return this.fetchRecords(); // Retry with new token
    }

    // ... rest of implementation
    return [];
  }
}
```

---

## Error Handling

### Robust Error Handling

```typescript
// services/errorHandler.ts

export class GraphDataError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'GraphDataError';
  }
}

export async function fetchWithErrorHandling<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new GraphDataError(
        `Network error while ${context}`,
        'NETWORK_ERROR',
        0
      );
    }

    if (error instanceof SyntaxError) {
      throw new GraphDataError(
        `Invalid response format while ${context}`,
        'PARSE_ERROR',
        500
      );
    }

    throw error;
  }
}

// Usage
async function safeLoadRecords(): Promise<Record[]> {
  return fetchWithErrorHandling(
    () => apiClient.fetchRecords(),
    'loading records'
  );
}
```

---

## Caching Strategy

### Simple Cache Layer

```typescript
// services/cache.ts

export class CacheManager {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Set cache
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
    } else {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    }
  }
}

// Usage with API client
export class CachedAPIClient extends APIClient {
  private cache = new CacheManager();

  async fetchRecords(): Promise<Record[]> {
    const cached = this.cache.get<Record[]>('records');
    if (cached) return cached;

    const records = await super.fetchRecords();
    this.cache.set('records', records);
    return records;
  }
}
```

---

## Server-Side Example (Node.js/Express)

```typescript
// Example backend implementation

import express from 'express';
import { Record, Document } from './types';

const app = express();

// Middleware
app.use(express.json());
app.use(authenticateToken); // Your auth middleware

// Routes
app.get('/api/records', async (req, res) => {
  try {
    const { page = 1, pageSize = 50 } = req.query;
    const records = await db.records
      .find()
      .skip((Number(page) - 1) * Number(pageSize))
      .limit(Number(pageSize))
      .toArray();

    res.json({
      success: true,
      data: records,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/api/records/:recordKey', async (req, res) => {
  try {
    const record = await db.records.findOne({ recordKey: req.params.recordKey });
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found',
      });
    }

    res.json({
      success: true,
      data: record,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

app.get('/api/records/:recordKey/linked', async (req, res) => {
  try {
    const record = await db.records.findOne({ recordKey: req.params.recordKey });
    if (!record) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    // Fetch linked items
    const linkedRecords = await db.records
      .find({ recordKey: { $in: record.linkedRecords?.map((r: any) => r.recordKey) || [] } })
      .toArray();

    const linkedDocuments = await db.documents
      .find({ documentKey: { $in: record.linkedDocuments?.map((d: any) => d.documentKey) || [] } })
      .toArray();

    res.json({
      success: true,
      data: { linkedRecords, linkedDocuments },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error });
  }
});

// WebSocket for real-time updates
import { Server } from 'socket.io';
const io = new Server(app, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('subscribe', (eventType) => {
    socket.join(eventType);
  });
});

// Emit updates when data changes
export function notifyUpdate(type: 'record' | 'document', data: any) {
  io.to(`${type}:updated`).emit(`${type}:updated`, data);
}
```

---

## Summary

To integrate Circuit Mapping with your backend:

1. **Implement API endpoints** following the contract above
2. **Use APIClient** for data fetching with error handling
3. **Implement authentication** with JWT tokens
4. **Add caching** to reduce API calls
5. **Use WebSocket** for real-time updates
6. **Implement pagination** for large datasets
7. **Handle errors gracefully** with user feedback

---

For more information, see [README.md](./README.md)
