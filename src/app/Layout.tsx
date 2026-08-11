import { Outlet } from 'react-router-dom';
import { BottomTabBar } from '../components/BottomTabBar';

export function Layout() {
  return (
    <div className="app-layout">
      <main className="app-main">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}
