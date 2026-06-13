import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import './AppShell.css';

const AppShell = () => {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-shell__main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppShell;
