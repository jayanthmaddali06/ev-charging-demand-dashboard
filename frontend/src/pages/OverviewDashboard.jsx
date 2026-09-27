import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Activity, 
  Clock, 
  AlertTriangle, 
  Leaf, 
  Users, 
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import PageHeader from '../components/PageHeader';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import { api } from '../services/api';

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899'];

const OverviewDashboard = ({ setActivePage }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await api.getSummary();
        if (isMounted && res.success) {
          setSummary(res.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to load analytics data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSummary();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <DashboardSkeleton message="Loading dashboard analytics & station KPIs..." />;
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl glass-panel border border-rose-200 dark:border-rose-900/50 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Unable to load analytics data</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const vehicleChartData = summary?.vehicleDistribution
    ? Object.entries(summary.vehicleDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const locationChartData = summary?.locationDistribution
    ? Object.entries(summary.locationDistribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <PageHeader
        title="EV Charging Analytics"
        subtitle="Predict, analyze and understand electric vehicle charging demand, station load, and green energy utilization in real-time."
        badge="Enterprise Energy Intelligence"
        actionButton={
          <button
            onClick={() => setActivePage('prediction')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Simulate Charging Demand</span>
          </button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Total Sessions"
          value={summary?.totalChargingSessions || 8354}
          unit="sessions"
          icon={Users}
          trend="up"
          trendValue="+12.4%"
          colorScheme="emerald"
          delay={0.05}
        />
        <KPICard
          title="Avg Demand"
          value={summary?.averageChargingDemand || 52.12}
          unit="kWh"
          icon={Zap}
          trend="up"
          trendValue="+4.2%"
          colorScheme="cyan"
          delay={0.1}
        />
        <KPICard
          title="Avg Station Load"
          value={summary?.averageStationLoad || 48.74}
          unit="%"
          icon={Activity}
          trend="normal"
          trendValue="Optimal"
          colorScheme="indigo"
          delay={0.15}
        />
        <KPICard
          title="Avg Queue Length"
          value={summary?.averageQueueLength || 2.45}
          unit="vehicles"
          icon={Clock}
          trend="down"
          trendValue="-0.3"
          colorScheme="amber"
          delay={0.2}
        />
        <KPICard
          title="Detected Anomalies"
          value={summary?.detectedAnomalies || 418}
          unit={`(${summary?.anomalyPercentage || 5.0}%)`}
          icon={AlertTriangle}
          trend="normal"
          trendValue="5.0% rate"
          colorScheme="rose"
          delay={0.25}
        />
        <KPICard
          title="Renewable Ratio"
          value={summary?.renewableEnergyPercent || 49.3}
          unit="%"
          icon={Leaf}
          trend="up"
          trendValue="+8.1%"
          colorScheme="violet"
          delay={0.3}
        />
      </div>

      {/* Distribution Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Distribution Chart */}
        <ChartCard
          title="Fleet Composition by Vehicle Type"
          subtitle="Breakdown of EV charging requests across vehicle segments"
          badge="Fleet Mix"
          height="h-72"
          delay={0.35}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={vehicleChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {vehicleChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  borderColor: 'rgba(51, 65, 85, 0.8)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Location Type Distribution Chart */}
        <ChartCard
          title="Station Load by Location Profile"
          subtitle="Distribution of sessions between Urban Hubs and Highway Transit Corridors"
          badge="Infrastructure"
          height="h-72"
          delay={0.4}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={locationChartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'rgba(16, 185, 129, 0.05)' }}
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  borderColor: 'rgba(51, 65, 85, 0.8)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="value" name="Sessions" radius={[8, 8, 0, 0]}>
                {locationChartData.map((entry, index) => (
                  <Cell key={`loc-cell-${index}`} fill={index === 0 ? '#10b981' : '#06b6d4'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Highlights & Quick Analytics Navigation Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div 
          onClick={() => setActivePage('timeseries')}
          className="cursor-pointer group p-5 rounded-2xl glass-panel hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                Time-Series Trends
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                88 days of charging demand & rolling averages
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>

        <div 
          onClick={() => setActivePage('clustering')}
          className="cursor-pointer group p-5 rounded-2xl glass-panel hover:border-cyan-500/50 transition-all shadow-sm hover:shadow-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-500 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                K-Means Clusters
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                4 distinct charging behavioral patterns
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>

        <div 
          onClick={() => setActivePage('performance')}
          className="cursor-pointer group p-5 rounded-2xl glass-panel hover:border-violet-500/50 transition-all shadow-sm hover:shadow-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-violet-500 transition-colors">
                Model Evaluation
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Random Forest vs Linear Regression R² = 0.9888
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-violet-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
      </motion.div>
    </div>
  );
};

export default OverviewDashboard;
