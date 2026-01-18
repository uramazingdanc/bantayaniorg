import { useDetections } from '@/hooks/useDetections';
import { useAdvisories } from '@/hooks/useAdvisories';
import {
  Bug,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  Loader2,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const StatsOverview = () => {
  const { detections, isLoading: detectionsLoading, getStats } = useDetections();
  const { advisories, isLoading: advisoriesLoading } = useAdvisories();

  if (detectionsLoading || advisoriesLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { total, pending, verified, rejected } = getStats();
  const activeAdvisories = advisories.filter((a) => a.is_active).length;

  const stats = [
    {
      label: 'Total Reports',
      value: total,
      icon: Bug,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Pending Review',
      value: pending,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      label: 'Verified',
      value: verified,
      icon: CheckCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Active Advisories',
      value: activeAdvisories,
      icon: AlertTriangle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
  ];

  // Group detections by day for trend chart
  const trendData = (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);
    
    detections.forEach((d) => {
      const day = new Date(d.created_at).getDay();
      counts[day]++;
    });

    return days.map((day, index) => ({
      day,
      reports: counts[index],
    }));
  })();

  // Group detections by pest type for pie chart
  const pieData = (() => {
    const pestCounts: Record<string, number> = {};
    detections.forEach((d) => {
      pestCounts[d.pest_type] = (pestCounts[d.pest_type] || 0) + 1;
    });

    const colors = ['#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9'];
    const sorted = Object.entries(pestCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    const total = sorted.reduce((sum, [, count]) => sum + count, 0);

    return sorted.map(([name, count], index) => ({
      name,
      value: total > 0 ? Math.round((count / total) * 100) : 0,
      color: colors[index] || colors[0],
    }));
  })();

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Trend Chart */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Weekly Detection Trend</h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(120, 25%, 8%)',
                    border: '1px solid hsl(120, 20%, 20%)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="reports"
                  stroke="#4CAF50"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReports)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pest Distribution */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bug className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Pest Distribution</h3>
          </div>
          <div className="h-48 flex items-center">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-muted-foreground flex-1 truncate">
                        {item.name}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full text-center text-muted-foreground">
                No detection data yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
