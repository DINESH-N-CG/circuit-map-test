/**
 * Search System for Records, Documents, and Versions
 * Implements fast search with support for multiple categories
 */

import {
  RecordNode,
  Document,
  SearchResult,
  SearchQuery,
  DataRepository,
  SearchCategory,
} from '../types';

/**
 * Fuses search - measures similarity between strings (0-1)
 * Based on Levenshtein distance concept but simpler
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  // Simple character-based similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  const matches = Array.from(shorter).filter((char) =>
    longer.includes(char)
  ).length;

  return matches / longer.length;
}

/**
 * Search service class for efficient querying
 */
export class SearchService {
  private repository: DataRepository;
  private index: Map<string, SearchResult> = new Map();

  constructor(repository: DataRepository) {
    this.repository = repository;
    this.buildIndex();
  }

  /**
   * Builds a full-text index of all searchable items
   */
  private buildIndex(): void {
    // Index records
    this.repository.allRecords.forEach((record) => {
      const id = `record-${record.recordKey}`;
      this.index.set(id, {
        id,
        type: 'record',
        key: record.recordKey,
        title: record.title,
        category: 'records',
        metadata: record.metadata,
      });
    });

    // Index documents
    this.repository.allDocuments.forEach((document) => {
      const docId = `document-${document.documentKey}`;
      this.index.set(docId, {
        id: docId,
        type: 'document',
        key: document.documentKey,
        title: document.title,
        category: 'documents',
        metadata: document.metadata,
      });
    });
  }

  /**
   * Performs a search query
   */
  public search(query: SearchQuery): SearchResult[] {
    const { query: q, categories, limit = 15 } = query;

    console.log('Search called with:', { query: q, categories, limit });
    console.log('Index size:', this.index.size);
    console.log('Index entries:', Array.from(this.index.entries()).map(([key, val]) => ({ key, type: val.type, title: val.title })));

    if (!q || q.trim().length === 0) {
      console.log('Empty query, returning []');
      return [];
    }

    const searchTerms = q.toLowerCase().split(/\s+/);
    console.log('Search terms:', searchTerms);

    // Filter by categories
    const categoryFilter = (result: SearchResult) => {
      if (categories.includes('all')) return true;
      if (categories.includes('records') && result.type === 'record')
        return true;
      if (categories.includes('documents') && result.type === 'document')
        return true;
      return false;
    };

    // Score and filter results
    const allIndexEntries = Array.from(this.index.values());
    console.log('All index entries:', allIndexEntries.length);
    
    const filtered = allIndexEntries.filter(categoryFilter);
    console.log('After category filter:', filtered.length);
    
    const scored = filtered
      .map((result) => ({
        result,
        score: this.calculateScore(result, searchTerms),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log('Final results:', scored.length);
    return scored.map(({ result }) => result);
  }

  /**
   * Calculates relevance score for a result
   */
  private calculateScore(result: SearchResult, terms: string[]): number {
    const titleLower = result.title.toLowerCase();
    const keyLower = result.key.toLowerCase();

    let score = 0;

    terms.forEach((term) => {
      if (titleLower.includes(term)) {
        // Exact substring match in title
        if (titleLower.startsWith(term)) {
          score += 2;
        } else {
          score += 1.5;
        }
      }

      if (keyLower.includes(term)) {
        // Match in key
        score += 1;
      }

      // Fuzzy match
      const similarity = calculateSimilarity(titleLower, term);
      if (similarity > 0.6) {
        score += similarity;
      }
    });

    return score;
  }

  /**
   * Finds a record by key
   */
  public findRecordByKey(recordKey: string): RecordNode | undefined {
    return this.repository.records.get(recordKey);
  }

  /**
   * Finds a document by key
   */
  public findDocumentByKey(documentKey: string): Document | undefined {
    return this.repository.documents.get(documentKey);
  }

  /**
   * Searches for records only
   */
  public searchRecords(query: string, limit?: number): SearchResult[] {
    return this.search({ query, categories: ['records'], limit });
  }

  /**
   * Searches for documents only
   */
  public searchDocuments(query: string, limit?: number): SearchResult[] {
    return this.search({ query, categories: ['documents'], limit });
  }

  /**
   * Gets all items in a category
   */
  public getAllInCategory(category: SearchCategory, limit?: number): SearchResult[] {
    const maxLimit = limit || 1000;
    return Array.from(this.index.values())
      .filter((result) => {
        if (category === 'all') return true;
        if (category === 'records') return result.type === 'record';
        if (category === 'documents') return result.type === 'document';
        return false;
      })
      .slice(0, maxLimit);
  }

  /**
   * Rebuilds the index (call after data updates)
   */
  public rebuildIndex(): void {
    this.index.clear();
    this.buildIndex();
  }
}

/**
 * Quick search function without creating a service instance
 */
export function quickSearch(
  repository: DataRepository,
  query: string,
  categories: SearchCategory[] = ['all'],
  limit: number = 15
): SearchResult[] {
  const service = new SearchService(repository);
  return service.search({ query, categories, limit });
}

/**
 * Extracts search terms from query string
 */
export function extractSearchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,;:]+/)
    .filter((term) => term.length > 0);
}

/**
 * Highlights search terms in text
 */
export function highlightSearchTerms(text: string, terms: string[]): string {
  let highlighted = text;
  terms.forEach((term) => {
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  });
  return highlighted;
}

/**
 * Groups search results by type
 */
export function groupSearchResults(
  results: SearchResult[]
): Map<string, SearchResult[]> {
  const grouped = new Map<string, SearchResult[]>();

  results.forEach((result) => {
    if (!grouped.has(result.type)) {
      grouped.set(result.type, []);
    }
    grouped.get(result.type)!.push(result);
  });

  return grouped;
}

/**
 * Deduplicates search results by key
 */
export function deduplicateSearchResults(
  results: SearchResult[]
): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.key)) {
      return false;
    }
    seen.add(result.key);
    return true;
  });
}
