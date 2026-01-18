import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { LiveDetectionFeed } from '@/components/dashboard/LiveDetectionFeed';
import { useAuthStore } from '@/store/authStore';

const DashboardHome = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
        </h1>
        <p className="text-muted-foreground">
          Monitor pest detections and manage advisories across your region.
        </p>
      </div>

      {/* Stats */}
      <StatsOverview />

      {/* Live Feed */}
      <div className="h-[500px]">
        <LiveDetectionFeed />
      </div>
    </div>
  );
};

export default DashboardHome;
