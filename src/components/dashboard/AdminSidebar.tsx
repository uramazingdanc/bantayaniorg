import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Map,
  Bug,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { BantayAniLogo } from '@/components/BantayAniLogo';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'User Management', path: '/dashboard/users' },
  { icon: Map, label: 'GIS Map', path: '/dashboard/map' },
  { icon: Bug, label: 'Pest Reports', path: '/dashboard/reports' },
  { icon: Bell, label: 'Advisories', path: '/dashboard/advisories' },
];

export const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      className={cn(
        'h-screen sidebar-gradient border-r border-sidebar-border flex flex-col transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <BantayAniLogo size={collapsed ? 'sm' : 'md'} showText={!collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
                'hover:bg-sidebar-accent group',
                isActive
                  ? 'bg-primary/20 text-primary shadow-glow'
                  : 'text-sidebar-foreground'
              )
            }
          >
            <item.icon
              className={cn(
                'w-5 h-5 flex-shrink-0 transition-colors',
                'group-hover:text-primary'
              )}
            />
            {!collapsed && (
              <span className="font-medium text-sm">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-sidebar-accent text-muted-foreground transition-all"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
};
