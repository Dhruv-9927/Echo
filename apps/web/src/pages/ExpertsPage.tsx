import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { ExpertCard } from '../components/ExpertCard';
import { LoadingPulse } from '../components/LoadingPulse';
import { SearchInput } from '../components/SearchInput';
import type { Expert } from '../types';
import './ExpertsPage.css';

export function ExpertsPage() {
  const [topic, setTopic] = useState('');
  const [debouncedTopic, setDebouncedTopic] = useState('');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTopic(topic), 500);
    return () => clearTimeout(timer);
  }, [topic]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    // If no topic, get top experts globally by passing empty string
    api.getExperts(debouncedTopic || 'all').then(res => {
      if (mounted && res.data) {
        setExperts(res.data);
      }
    }).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, [debouncedTopic]);

  return (
    <div className="experts-page page-container animate-fade-in">
      <h1 className="page-title">Expert Finder</h1>
      <p className="page-subtitle">Discover who knows what, backed by memory evidence.</p>
      
      <div className="experts-page__search">
        <SearchInput 
          value={topic} 
          onChange={setTopic} 
          placeholder="Search for a technology, domain, or concept..."
        />
      </div>

      {loading ? (
        <LoadingPulse />
      ) : (
        <div className="experts-page__grid">
          {experts.map((expert, idx) => (
            <div key={expert.handle} style={{ animation: `fadeIn 0.5s ease forwards ${idx * 0.1}s`, opacity: 0 }}>
              <ExpertCard expert={expert} rank={idx + 1} />
            </div>
          ))}
          {experts.length === 0 && (
            <div className="text-muted text-mono">No experts found for this topic.</div>
          )}
        </div>
      )}
    </div>
  );
}
