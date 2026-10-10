import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Flame, 
  Layers, 
  Activity,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
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
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import { api } from '../services/api';

const TimeSeriesAnalytics = ({ isEmbedded = false }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'hourly' | 'weekly'

  useEffect(() => {
    let isMounted = true;
    const fetchTimeSeries = async () => {
      try {
        setLoading(true);
        const res = await api.getTimeSeries();
        if (isMounted && res.success) {
          setData(res.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to load time-series data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTimeSeries();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <DashboardSkeleton message="Loading temporal trends & rolling averages..." />;
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl glass-panel border border-rose-200 dark:border-rose-900/50 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Unable to load time series</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  const { dailySeries = [], hourlyProfile = [], weeklyProfile = [], insights = {} } = data || {};

  return (
    <div className="space-y-8" id="section-timeseries">
      {!isEmbedded ? (
        <PageHeader
          title="Time-Series Analytics"
          subtitle="Temporal decomposition of electric vehicle charging demand, 7-day rolling trends, and diurnal hourly profiles."
          badge="Temporal Intelligence"
          actionButton={
            <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  viewMode === 'daily' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                88-Day Horizon
              </button>
              <button
                onClick={() => setViewMode('hourly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  viewMode === 'hourly' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hourly Profile
              </button>
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  viewMode === 'weekly' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Weekly Pattern
              </button>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Section 1 • Temporal Analytics</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Time Series Analytics
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              88-day charging demand horizon, rolling averages, and diurnal peak profiles.
            </p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 self-start sm:self-center">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'daily' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              88-Day Horizon
            </button>
            <button
              onClick={() => setViewMode('hourly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'hourly' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Hourly Profile
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'weekly' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Weekly Pattern
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Days Tracked"
          value={insights.totalDaysTracked || dailySeries.length}
          unit="days"
          icon={Calendar}
          colorScheme="emerald"
        />
        <KPICard
          title="Peak Demand Day"
          value={insights.peakDay ? `${insights.peakDay.demand}` : '56.2'}
          unit="kWh avg"
          trend="up"
          trendValue={insights.peakDay?.date || 'Peak'}
          icon={Flame}
          colorScheme="rose"
          delay={0.05}
        />
        <KPICard
          title="Lowest Demand Day"
          value={insights.lowestDay ? `${insights.lowestDay.demand}` : '47.1'}
          unit="kWh avg"
          trend="down"
          trendValue={insights.lowestDay?.date || 'Low'}
          icon={Activity}
          colorScheme="cyan"
          delay={0.1}
        />
        <KPICard
          title="Diurnal Peak Hour"
          value={insights.peakHour ? insights.peakHour.hourLabel : '18:00'}
          unit={insights.peakHour ? `${insights.peakHour.demand} kWh` : 'Evening'}
          icon={Clock}
          colorScheme="amber"
          delay={0.15}
        />
      </div>

      {/* Main Primary Chart */}
      <ChartCard
        title={
          viewMode === 'daily'
            ? 'Daily Average Demand vs 7-Day Rolling Trend'
            : viewMode === 'hourly'
            ? '24-Hour Diurnal Demand Profile'
            : 'Weekly Demand Pattern (Monday to Sunday)'
        }
        subtitle={
          viewMode === 'daily'
            ? 'Tracking seasonal shifts and weekly cycles across 88 monitored days'
            : viewMode === 'hourly'
            ? 'Identifies critical charging peaks during commuter rush hours'
            : 'Compares weekday commuter charging versus weekend recreational load'
        }
        badge={viewMode.toUpperCase()}
        height="h-96"
      >
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'daily' ? (
            <AreaChart data={dailySeries} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorRolling" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} minTickGap={25} />
              <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fill: '#94a3b8', fontSize: 11 }} />
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
              <Area
                type="monotone"
                dataKey="dailyAverageDemand"
                name="Daily Avg Demand (kWh)"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDemand)"
              />
              <Line
                type="monotone"
                dataKey="sevenDayRollingAverage"
                name="7-Day Rolling Trend (kWh)"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={false}
              />
            </AreaChart>
          ) : viewMode === 'hourly' ? (
            <BarChart data={hourlyProfile} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="hourLabel" tick={{ fill: '#94a3b8', fontSize: 11 }} />
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
              <Bar dataKey="averageDemand" name="Average Demand (kWh)" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="averageStationLoad" name="Station Load (%)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <BarChart data={weeklyProfile} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
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
              <Bar dataKey="averageDemand" name="Mean Demand (kWh)" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </ChartCard>

      {/* Hourly and Day of Week Side-by-Side Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Hourly Diurnal Demand Curve"
          subtitle="Fluctuation across 24 hours of the day"
          badge="Hourly Profile"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyProfile} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="hourLabel" tick={{ fill: '#94a3b8', fontSize: 11 }} />
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
              <Area type="monotone" dataKey="averageDemand" stroke="#06b6d4" strokeWidth={2} fill="url(#colorHourly)" name="Demand (kWh)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Day of Week Charging Profile"
          subtitle="Average demand delivered across calendar days"
          badge="Weekly Cycles"
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyProfile} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
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
              <Bar dataKey="averageDemand" fill="#10b981" radius={[6, 6, 0, 0]} name="Demand (kWh)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default TimeSeriesAnalytics;
