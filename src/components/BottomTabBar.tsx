import { NavLink } from 'react-router-dom';
import { Timer, CheckSquare, FileQuestion, BarChart3 } from 'lucide-react';

const tabs = [
  { path: '/', icon: Timer, label: 'Timer' },
  { path: '/tarefas', icon: CheckSquare, label: 'Tarefas' },
  { path: '/simulados', icon: FileQuestion, label: 'Simulados' },
  { path: '/progresso', icon: BarChart3, label: 'Progresso' },
];

export function BottomTabBar() {
  return (
    <nav className="bottom-tab-bar">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `tab-item ${isActive ? 'tab-item--active' : ''}`
          }
        >
          <tab.icon size={22} className="tab-icon" />
          <span className="tab-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
