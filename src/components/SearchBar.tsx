import React, { useState, useEffect } from 'react';
import { RecordNode, Document } from '../types';
import './SearchBar.css';

interface SearchBarProps {
  data: { records: RecordNode[]; documents: Document[] };
  onSelect: (selection: { type: string; recordKey?: string; documentKey?: string; versionId?: string }) => void;
}

export default function SearchBar({ data, onSelect }: SearchBarProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const lower = search.toLowerCase();
    const recordMatches = data.records
      .filter(
        (r) =>
          r.recordKey.toLowerCase().includes(lower) ||
          r.title.toLowerCase().includes(lower)
      )
      .map((r) => ({ type: 'record', recordKey: r.recordKey, title: r.title }));

    const documentMatches = data.documents
      .filter(
        (d) =>
          d.documentKey.toLowerCase().includes(lower) ||
          d.title.toLowerCase().includes(lower)
      )
      .flatMap((d) => [
        { type: 'document', documentKey: d.documentKey, title: d.title },
        ...d.versions.map((v) => ({
          type: 'version',
          documentKey: d.documentKey,
          versionId: v.versionId,
          title: `${d.title} - v${v.versionNumber}`,
          version: v.versionNumber,
        })),
      ]);

    const all = [...recordMatches, ...documentMatches].slice(0, 15);
    setResults(all);
    setIsOpen(all.length > 0);
  }, [search, data]);

  const handleSelect = (item: any) => {
    onSelect(item);
    setSearch('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="search-bar-container">
      <input
        type="text"
        className="search-input"
        placeholder="Search records or documents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => search.trim() && setIsOpen(true)}
      />

      {isOpen && results.length > 0 && (
        <div className="search-suggestions">
          {results.map((item) => (
            <div
              key={`${item.type}-${item.recordKey || item.documentKey}-${item.versionId || ''}`}
              className={`search-item search-item-${item.type}`}
              onClick={() => handleSelect(item)}
            >
              <span className="search-item-icon">
                {item.type === 'record' && '📋'}
                {item.type === 'document' && '📄'}
                {item.type === 'version' && '📌'}
              </span>
              <div className="search-item-content">
                <div className="search-item-title">{item.title}</div>
                {item.type === 'record' && <div className="search-item-key">{item.recordKey}</div>}
                {item.type === 'document' && <div className="search-item-key">{item.documentKey}</div>}
                {item.type === 'version' && (
                  <div className="search-item-key">
                    {item.documentKey} • v{item.version}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
