import { useDetectionStore } from '@/store/detectionStore';
import { useAdvisoryStore } from '@/store/advisoryStore';
import {
  Bug,
  Users,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const StatsOverview = () => {
  const { detections } = useDetectionStore();
  const { advisories } = useAdvisoryStore();

  const pending = detections.filter((d) => d.status === 'pending').length;
  const verified = detections.filter((d) => d.status === 'verified').length;
  const rejected = detections.filter((d) => d.status === 'rejected').length;
  const activeAdvisories = advisories.filter((a) => a.isActive).length;

  const stats = [
    {
      label: 'Total Reports',
      value: detections.length,
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

  // Mock trend data
  const trendData = [
    { day: 'Mon', reports: 12 },
    { day: 'Tue', reports: 19 },
    { day: 'Wed', reports: 15 },
    { day: 'Thu', reports: 25 },
    { day: 'Fri', reports: 22 },
    { day: 'Sat', reports: 18 },
    { day: 'Sun', reports: 28 },
  ];

  const pieData = [
    { name: 'Rice Stem Borer', value: 35, color: '#4CAF50' },
    { name: 'Fall Armyworm', value: 28, color: '#66BB6A' },
    { name: 'Aphids', value: 20, color: '#81C784' },
    { name: 'Others', value: 17, color: '#A5D6A7' },
  ];

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
                  <span className="text-xs text-muted-foreground flex-1">
                    {item.name}
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
