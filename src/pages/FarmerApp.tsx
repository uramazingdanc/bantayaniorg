import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Camera, History, Bell, User, LogOut, ChevronRight } from 'lucide-react';
import { BantayAniLogo } from '@/components/BantayAniLogo';
import { Button } from '@/components/ui/button';

const FarmerApp = () => {
  const { user, logout, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || user?.role !== 'farmer') {
    return <Navigate to="/" replace />;
  }

  const menuItems = [
    {
      icon: Camera,
      title: 'Detect Pests',
      description: 'Use camera to scan for pests',
      color: 'bg-primary/20 text-primary',
    },
    {
      icon: History,
      title: 'Detection History',
      description: 'View past scans and results',
      color: 'bg-blue-500/20 text-blue-400',
    },
    {
      icon: Bell,
      title: 'Advisories',
      description: 'LGU pest alerts and warnings',
      color: 'bg-orange-500/20 text-orange-400',
    },
    {
      icon: User,
      title: 'Profile Settings',
      description: 'Update farm details',
      color: 'bg-purple-500/20 text-purple-400',
    },
  ];

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <BantayAniLogo size="sm" />
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-muted-foreground"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Welcome */}
      <div className="glass-card p-5 mb-6">
        <h1 className="text-xl font-bold text-foreground mb-1">
          Welcome, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {user?.farmDetails?.mainCrop
            ? `${user.farmDetails.mainCrop} Farm • ${user.farmDetails.location || 'Location not set'}`
            : 'Complete your profile to get started'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Scans', value: '24' },
          { label: 'Verified', value: '18' },
          { label: 'Pending', value: '3' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-3 text-center">
            <p className="text-xl font-bold text-primary">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Menu Items */}
      <div className="space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.title}
            className="glass-card-hover w-full p-4 flex items-center gap-4 text-left"
          >
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Camera Trigger - Floating Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <Button
          size="lg"
          className="h-16 w-16 rounded-full btn-primary-glow shadow-2xl"
        >
          <Camera className="w-8 h-8" />
        </Button>
      </div>

      {/* Spacer for floating button */}
      <div className="h-24" />
    </div>
  );
};

export default FarmerApp;
