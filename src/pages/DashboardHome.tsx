import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { useAuthContext } from '@/contexts/AuthContext';

const DashboardHome = () => {
  const { profile } = useAuthContext();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {profile?.name?.split(' ')[0] || 'Admin'}
        </h1>
        <p className="text-muted-foreground">
          Monitor pest detections and manage advisories across your region.
        </p>
      </div>

      {/* Stats */}
      <StatsOverview />
    </div>
  );
};

export default DashboardHome;
