/**
 * Search Panel Component
 * Interactive search with dropdown and result selection
 */

import React, { useState, useCallback, useMemo } from 'react';
import { SearchService } from '../services/search';
import { SearchResult } from '../types';

import './SearchPanel.css';

interface SearchPanelProps {
  searchService: SearchService;
  onSelectRecord: (recordKey: string) => void;
  onSelectDocument: (documentKey: string) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  searchService,
  onSelectRecord,
  onSelectDocument,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchService.search({
      query: query.trim(),
      categories: ['all'],
      limit: 15,
    });
  }, [query, searchService]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      console.log('SearchPanel handleSelect called:', result);
      if (result.type === 'record') {
        console.log('Calling onSelectRecord with key:', result.key);
        onSelectRecord(result.key);
      } else if (result.type === 'document') {
        console.log('Calling onSelectDocument with key:', result.key);
        onSelectDocument(result.key);
      }

      setQuery('');
      setIsOpen(false);
      setSelectedIndex(-1);
    },
    [onSelectRecord, onSelectDocument]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    },
    [results, selectedIndex, handleSelect]
  );

  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    setIsOpen(value.trim().length > 0);
    setSelectedIndex(-1);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (query.trim().length > 0) {
      setIsOpen(true);
    }
  }, [query]);

  const handleInputBlur = useCallback(() => {
    // Delay closing to allow click on result
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  }, []);

  return (
    <div className="search-panel">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Search records and documents..."
          className="search-input"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setSelectedIndex(-1);
            }}
            className="search-clear-btn"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((result, index) => (
            <div
              key={result.id}
              className={`search-result-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(result);
              }}
              onClick={() => handleSelect(result)}
            >
              <div className="result-icon">
                {result.type === 'record' && '📋'}
                {result.type === 'document' && '📄'}
              </div>
              <div className="result-content">
                <div className="result-title">{result.title}</div>
                <div className="result-key">{result.key}</div>
              </div>
              <div className="result-type-badge">{result.type}</div>
            </div>
          ))}
        </div>
      )}

      {isOpen && query.trim().length > 0 && results.length === 0 && (
        <div className="search-no-results">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
};
