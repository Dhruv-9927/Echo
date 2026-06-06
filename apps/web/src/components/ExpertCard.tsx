import type { Expert } from '../types';
import './ExpertCard.css';
import { Award, ChevronRight } from 'lucide-react';

interface ExpertCardProps {
  expert: Expert;
  rank: number;
}

export function ExpertCard({ expert, rank }: ExpertCardProps) {
  return (
    <div className="expert-card glass-panel">
      <div className="expert-card__header">
        <div className="expert-card__profile">
          <div className="expert-card__rank text-mono">#{rank}</div>
          <div className="expert-card__avatar">
            {expert.name.charAt(0).toUpperCase()}
          </div>
          <div className="expert-card__info">
            <h3 className="expert-card__name text-display">{expert.name}</h3>
            <div className="expert-card__handle text-mono">@{expert.handle}</div>
          </div>
        </div>
        <div className="expert-card__score">
          <Award size={16} className="expert-card__score-icon" />
          <span className="text-display">{Math.round(expert.expertiseScore)}</span>
        </div>
      </div>
      
      <div className="expert-card__domains">
        {expert.domains.map(domain => (
          <span key={domain} className="expert-card__domain text-mono">{domain}</span>
        ))}
      </div>
      
      <div className="expert-card__evidence">
        <div className="expert-card__evidence-header">
          <span className="text-secondary text-mono">Top Evidence ({expert.evidenceCount} total)</span>
        </div>
        {expert.topMemories.slice(0, 2).map(memory => (
          <div key={memory.id} className="expert-card__memory">
            <ChevronRight size={14} className="expert-card__memory-icon" />
            <span className="text-body text-secondary">"{memory.content}"</span>
          </div>
        ))}
      </div>
    </div>
  );
}
