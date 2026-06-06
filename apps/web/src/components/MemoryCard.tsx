import type { Memory } from '../types';
import './MemoryCard.css';
import { MessageSquare, Slack, Globe } from 'lucide-react';

interface MemoryCardProps {
  memory: Memory;
  onClick?: () => void;
}

export function MemoryCard({ memory, onClick }: MemoryCardProps) {
  const PlatformIcon = memory.platform === 'slack' ? Slack : (memory.platform === 'discord' ? MessageSquare : Globe);
  
  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString(undefined, { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className={`memory-card glass-panel memory-card--${memory.memoryType}`} onClick={onClick}>
      <div className="memory-card__header">
        <div className="memory-card__meta">
          <PlatformIcon size={14} className="memory-card__platform" />
          <span className="text-mono">{memory.channel}</span>
          <span className="memory-card__dot">•</span>
          <span className="text-mono">{formatDate(memory.timestamp)}</span>
        </div>
        <div className={`memory-badge memory-badge--${memory.memoryType}`}>
          {memory.memoryType}
        </div>
      </div>
      
      <div className="memory-card__content text-body">
        {memory.content}
      </div>
      
      <div className="memory-card__footer">
        <div className="memory-card__author">
          <div className="memory-card__avatar">
            {(memory.author || '?').charAt(0).toUpperCase()}
          </div>
          <span className="text-primary">{memory.author || 'Unknown'}</span>
        </div>
        
        {memory.entities?.technologies?.length > 0 && (
          <div className="memory-card__tags">
            {memory.entities.technologies.slice(0, 3).map(tech => (
              <span key={tech} className="memory-card__tag text-mono">{tech}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
