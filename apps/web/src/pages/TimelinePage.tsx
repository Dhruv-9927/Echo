import { useState } from 'react';
import { api } from '../lib/api';
import { useApi } from '../hooks/use-api';
import { MemoryCard } from '../components/MemoryCard';
import { LoadingPulse } from '../components/LoadingPulse';
import { SearchInput } from '../components/SearchInput';
import './TimelinePage.css';

export function TimelinePage() {
  const { data: memories, loading, error } = useApi(api.getMemories);
  const [filter, setFilter] = useState('');

  if (loading) return <LoadingPulse />;
  if (error || !memories) return <div className="text-danger">Failed to load memories.</div>;

  const filteredMemories = memories.filter(m => 
    (m.content || '').toLowerCase().includes(filter.toLowerCase()) || 
    (m.author || '').toLowerCase().includes(filter.toLowerCase()) ||
    (m.memoryType || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="timeline-page page-container animate-fade-in">
      <h1 className="page-title">Memory Timeline</h1>
      <p className="page-subtitle">Chronological record of ingested intelligence.</p>
      
      <div className="timeline-page__controls">
        <SearchInput 
          value={filter} 
          onChange={setFilter} 
          placeholder="Filter by keyword, author, or type..."
        />
      </div>

      <div className="timeline-page__feed">
        {filteredMemories.map((memory, idx) => (
          <div key={memory.id} className="timeline-page__item" style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="timeline-page__line">
              <div className="timeline-page__node"></div>
            </div>
            <div className="timeline-page__card">
              <MemoryCard memory={memory} />
            </div>
          </div>
        ))}
        {filteredMemories.length === 0 && (
          <div className="text-muted text-mono">No memories match your filter.</div>
        )}
      </div>
    </div>
  );
}
