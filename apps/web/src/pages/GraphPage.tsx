import { KnowledgeGraph } from '../components/KnowledgeGraph';
import './GraphPage.css';

export function GraphPage() {
  return (
    <div className="graph-page animate-fade-in">
      <div className="graph-page__header">
        <h1 className="page-title">Neural Map</h1>
        <p className="page-subtitle">Live visualization of the team's collective intelligence.</p>
        
        <div className="graph-legend glass-panel">
          <div className="graph-legend__item">
            <span className="graph-legend__color" style={{background: 'var(--graph-person-node)'}}></span>
            <span className="text-mono">Person</span>
          </div>
          <div className="graph-legend__item">
            <span className="graph-legend__color" style={{background: 'var(--graph-concept-node)'}}></span>
            <span className="text-mono">Concept</span>
          </div>
          <div className="graph-legend__item">
            <span className="graph-legend__color" style={{background: 'var(--graph-decision-node)'}}></span>
            <span className="text-mono">Decision</span>
          </div>
          <div className="graph-legend__item">
            <span className="graph-legend__color" style={{background: 'var(--graph-problem-node)'}}></span>
            <span className="text-mono">Problem</span>
          </div>
          <div className="graph-legend__item">
            <span className="graph-legend__color" style={{background: 'var(--graph-solution-node)'}}></span>
            <span className="text-mono">Solution</span>
          </div>
        </div>
      </div>
      
      <div className="graph-page__content">
        <KnowledgeGraph />
      </div>
    </div>
  );
}
