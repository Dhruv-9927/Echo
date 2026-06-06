import './LoadingPulse.css';

export function LoadingPulse() {
  return (
    <div className="loading-pulse">
      <div className="loading-pulse__core"></div>
      <div className="loading-pulse__ring"></div>
      <div className="loading-pulse__text text-mono">ECHO IS THINKING</div>
    </div>
  );
}
