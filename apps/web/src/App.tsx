import { Routes, Route } from 'react-router';
import { Sidebar } from './components/Sidebar';
import { GraphPage } from './pages/GraphPage';
import { TimelinePage } from './pages/TimelinePage';
import { ExpertsPage } from './pages/ExpertsPage';
import { AskPage } from './pages/AskPage';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<GraphPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/experts" element={<ExpertsPage />} />
          <Route path="/ask" element={<AskPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
