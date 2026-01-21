import { useNavigate, Navigate } from 'react-router-dom';
import { Camera, History, Bell, User, LogOut, ChevronRight, Wifi, WifiOff, CloudUpload, MapPin } from 'lucide-react';
import { BantayAniLogo } from '@/components/BantayAniLogo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { useDetections } from '@/hooks/useDetections';
import { useState, useEffect } from 'react';

const FarmerApp = () => {
  const navigate = useNavigate();
  const { user, profile, role, isAuthenticated, signOut } = useAuthContext();
  const { detections, getStats } = useDetections(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('pendingUploads');
    if (saved) {
      setPendingCount(JSON.parse(saved).length);
    }
  }, []);

  if (!isAuthenticated || role !== 'farmer') {
    return <Navigate to="/" replace />;
  }

  const stats = getStats();
  const displayName = profile?.name || user?.user_metadata?.name || 'Farmer';

  const menuItems = [
    {
      icon: Camera,
      title: 'Detect Pests',
      description: 'Use camera to scan for pests',
      color: 'bg-primary/20 text-primary',
      path: '/farmer/camera',
      badge: pendingCount > 0 ? `${pendingCount} pending` : undefined,
    },
    {
      icon: MapPin,
      title: 'Detection Map',
      description: 'View pest locations on map',
      color: 'bg-primary/20 text-primary',
      path: '/farmer/map',
    },
    {
      icon: History,
      title: 'Detection History',
      description: 'View past scans and results',
      color: 'bg-secondary/50 text-secondary-foreground',
      path: '/farmer/history',
    },
    {
      icon: Bell,
      title: 'Advisories',
      description: 'LGU pest alerts and warnings',
      color: 'bg-accent/20 text-accent-foreground',
      path: '/farmer/advisories',
    },
    {
      icon: User,
      title: 'Profile Settings',
      description: 'Update farm details',
      color: 'bg-muted text-muted-foreground',
      path: '/farmer/profile',
    },
  ];

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <BantayAniLogo size="sm" />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${isOnline ? 'text-green-400 border-green-400' : 'text-red-400 border-red-400'}`}>
            {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="glass-card p-5 mb-6">
        <h1 className="text-xl font-bold text-foreground mb-1">
          Welcome, {displayName.split(' ')[0]}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile?.main_crop
            ? `${profile.main_crop} Farm • ${profile.farm_location || 'Location not set'}`
            : 'Complete your profile to get started'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-primary">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Scans</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-primary">{stats.verified}</p>
          <p className="text-xs text-muted-foreground">Verified</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xl font-bold text-accent-foreground">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
      </div>

      {/* Pending Sync Alert */}
      {pendingCount > 0 && isOnline && (
        <div 
          className="glass-card p-4 mb-6 flex items-center gap-3 cursor-pointer hover:bg-primary/5 transition-colors"
          onClick={() => navigate('/farmer/camera')}
        >
          <div className="p-2 rounded-lg bg-accent/20">
            <CloudUpload className="w-5 h-5 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground text-sm">
              {pendingCount} detection{pendingCount > 1 ? 's' : ''} waiting to sync
            </p>
            <p className="text-xs text-muted-foreground">Tap to upload now</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      )}

      {/* Menu Items */}
      <div className="space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.title}
            onClick={() => navigate(item.path)}
            className="glass-card-hover w-full p-4 flex items-center gap-4 text-left"
          >
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{item.title}</h3>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
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
          onClick={() => navigate('/farmer/camera')}
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
