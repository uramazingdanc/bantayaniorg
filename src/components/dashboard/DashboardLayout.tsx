import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';

export const DashboardLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
};
