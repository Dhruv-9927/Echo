import { useState } from 'react';
import { api } from '../lib/api';
import { Search, BrainCircuit } from 'lucide-react';
import { MemoryCard } from '../components/MemoryCard';
import type { AskResponse } from '../types';
import './AskPage.css';

export function AskPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await api.ask(query);
      if (res.data) setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ask-page page-container animate-fade-in">
      <div className="ask-page__hero">
        <BrainCircuit size={48} className="ask-page__hero-icon" />
        <h1 className="page-title">Ask ECHO</h1>
        <p className="page-subtitle">Search the team's collective memory.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="ask-page__form">
        <div className="ask-page__input-wrapper">
          <Search className="ask-page__input-icon" />
          <input
            type="text"
            className="ask-page__input text-body"
            placeholder="Why did we choose Postgres? Who knows about Redis?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="ask-page__submit" disabled={loading || !query.trim()}>
            {loading ? 'Thinking...' : 'Ask'}
          </button>
        </div>
      </form>

      {result && (
        <div className="ask-page__results animate-fade-in">
          <div className="ask-page__answer glass-panel">
            <h3 className="text-display">Answer</h3>
            <p className="text-body">{result.answer}</p>
            <div className="ask-page__confidence">
              <span className="text-mono text-muted">Confidence Score: </span>
              <span className="text-mono text-signal">{Math.round(result.confidence * 100)}%</span>
            </div>
          </div>
          
          <div className="ask-page__sources">
            <h4 className="text-display">Sources Cited</h4>
            <div className="ask-page__sources-list">
              {result.sources.map(memory => (
                <MemoryCard key={memory.id} memory={memory} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
