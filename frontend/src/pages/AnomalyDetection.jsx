import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  ShieldCheck, 
  AlertOctagon, 
  Activity, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  BatteryCharging,
  Zap,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import PageHeader from '../components/PageHeader';
import ChartCard from '../components/ChartCard';
import KPICard from '../components/KPICard';
import { DashboardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import { api } from '../services/api';

const AnomalyDetection = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAnomalies = async (currentPage) => {
    try {
      setLoading(true);
      const res = await api.getAnomalies({ page: currentPage, limit: 15 });
      if (res && res.success) {
        setData(res.data);
        setError(null);
      }
    } catch (err) {
      setError(err.message || 'Unable to load anomaly detection data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies(page);
  }, [page]);

  if (loading && !data) {
    return <DashboardSkeleton message="Scanning isolation forest records for anomalous events..." />;
  }

  const {
    totalRecords = 8354,
    normalCount = 7936,
    anomalousCount = 418,
    anomalyPercentage = 5.0,
    comparison = {},
    distributionByLocation = {},
    distributionByVehicle = {},
    pagination = {},
    anomalies = []
  } = data || {};

  const pieData = [
    { name: 'Normal Sessions', value: normalCount, color: '#10b981' },
    { name: 'Anomalous Sessions', value: anomalousCount, color: '#ef4444' }
  ];

  const comparisonBarData = [
    {
      metric: 'Station Load (%)',
      Normal: comparison?.averageStationLoad?.normal || 47.9,
      Anomaly: comparison?.averageStationLoad?.anomaly || 63.8
    },
    {
      metric: 'Waiting Time (m)',
      Normal: comparison?.averageWaitingTime?.normal || 8.2,
      Anomaly: comparison?.averageWaitingTime?.anomaly || 19.5
    },
    {
      metric: 'Queue Length',
      Normal: comparison?.averageQueueLength?.normal || 2.2,
      Anomaly: comparison?.averageQueueLength?.anomaly || 4.8
    }
  ];

  const filteredAnomalies = anomalies.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      a.stationId?.toLowerCase().includes(term) ||
      a.vehicleId?.toLowerCase().includes(term) ||
      a.vehicleType?.toLowerCase().includes(term) ||
      a.locationType?.toLowerCase().includes(term) ||
      a.reason?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Anomaly Detection"
        subtitle="Isolation Forest ML telemetry screening to identify irregular charging sessions, station overload spikes, and queue bottlenecks."
        badge="Isolation Forest Model"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Scanned Sessions"
          value={totalRecords}
          unit="sessions"
          icon={Activity}
          colorScheme="cyan"
        />
        <KPICard
          title="Normal Sessions"
          value={normalCount}
          unit={`${(100 - anomalyPercentage).toFixed(1)}%`}
          icon={ShieldCheck}
          trend="normal"
          trendValue="Healthy"
          colorScheme="emerald"
          delay={0.05}
        />
        <KPICard
          title="Anomalies Detected"
          value={anomalousCount}
          unit="events"
          icon={AlertTriangle}
          trend="down"
          trendValue="Flagged"
          colorScheme="rose"
          delay={0.1}
        />
        <KPICard
          title="Anomaly Contamination"
          value={anomalyPercentage}
          unit="%"
          icon={AlertOctagon}
          trend="normal"
          trendValue="5.0% threshold"
          colorScheme="amber"
          delay={0.15}
        />
      </div>

      {/* Visual Charts: Normal vs Anomaly Pie & Metric Comparison Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pie Chart (4 cols) */}
        <div className="lg:col-span-5">
          <ChartCard
            title="Normal vs Anomalous Distribution"
            subtitle="Isolation Forest classification ratio"
            badge="95% / 5% Ratio"
            height="h-72"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`anom-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(51, 65, 85, 0.8)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Feature Comparison Chart (7 cols) */}
        <div className="lg:col-span-7">
          <ChartCard
            title="Feature Divergence: Normal vs Anomaly Profiles"
            subtitle="Comparing key indicators that characterize anomalies"
            badge="Feature Divergence"
            height="h-72"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonBarData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(51, 65, 85, 0.8)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="Normal" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Anomaly" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Anomalies Table Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Detected Anomaly Event Log
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-500 border border-rose-500/30">
                {anomalousCount} Outliers
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Sessions flagged by Isolation Forest requiring station manager attention
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search station, vehicle, reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Station ID</th>
                <th className="py-3 px-4">Vehicle ID & Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Station Load</th>
                <th className="py-3 px-4">Queue</th>
                <th className="py-3 px-4">Waiting Time</th>
                <th className="py-3 px-4">Demand</th>
                <th className="py-3 px-4">Flagged Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
              {filteredAnomalies.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>ANOMALY</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">{a.stationId}</td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-800 dark:text-slate-200">{a.vehicleId}</div>
                    <div className="text-[11px] text-slate-400">{a.vehicleType}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{a.locationType}</td>
                  <td className="py-3 px-4 font-mono font-bold text-rose-500">{a.stationLoad}%</td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{a.queueLength} EVs</td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{a.waitingTime} min</td>
                  <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{a.chargingDemand} kWh</td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {a.reason}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing page <span className="font-bold text-slate-800 dark:text-slate-200">{pagination.page || page}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{pagination.totalPages || 28}</span> ({anomalousCount} total anomalies)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-mono font-bold text-slate-900 dark:text-white">
              {page}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(pagination.totalPages || 28, prev + 1))}
              disabled={page >= (pagination.totalPages || 28)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnomalyDetection;
