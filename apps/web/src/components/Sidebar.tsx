import { NavLink } from 'react-router';
import { Network, History, Users, MessageSquare } from 'lucide-react';
import './Sidebar.css';

export function Sidebar() {
  return (
    <nav className="sidebar glass-panel">
      <div className="sidebar__logo">
        <div className="sidebar__logo-mark">E</div>
      </div>
      <div className="sidebar__nav">
        <NavLink to="/" className={({isActive}) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} title="Knowledge Graph">
          <Network size={24} />
        </NavLink>
        <NavLink to="/timeline" className={({isActive}) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} title="Timeline">
          <History size={24} />
        </NavLink>
        <NavLink to="/experts" className={({isActive}) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} title="Experts">
          <Users size={24} />
        </NavLink>
        <NavLink to="/ask" className={({isActive}) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`} title="Ask ECHO">
          <MessageSquare size={24} />
        </NavLink>
      </div>
    </nav>
  );
}
