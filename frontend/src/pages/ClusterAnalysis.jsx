import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Network, 
  Layers, 
  Zap, 
  Activity, 
  MapPin, 
  Car, 
  TrendingUp, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis,
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import PageHeader from '../components/PageHeader';
import ChartCard from '../components/ChartCard';
import KPICard from '../components/KPICard';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import { api } from '../services/api';

const CLUSTER_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6'];

const ClusterAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchClusters = async () => {
      try {
        setLoading(true);
        const res = await api.getClusters();
        if (isMounted && res.success) {
          setData(res.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Unable to load cluster analytics.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchClusters();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <DashboardSkeleton message="Grouping sessions via K-Means clustering algorithm..." />;
  }

  if (error) {
    return (
      <div className="p-8 rounded-3xl glass-panel border border-rose-200 dark:border-rose-900/50 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Unable to load clustering data</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  const { totalClusters = 4, totalRecords = 6683, clusterProfiles = [], scatterPoints = [] } = data || {};

  // Separate scatter points by cluster for distinct series colors
  const cluster0Points = scatterPoints.filter(p => p.cluster === 0);
  const cluster1Points = scatterPoints.filter(p => p.cluster === 1);
  const cluster2Points = scatterPoints.filter(p => p.cluster === 2);
  const cluster3Points = scatterPoints.filter(p => p.cluster === 3);

  const distributionBarData = clusterProfiles.map((cp, idx) => ({
    name: `Cluster ${cp.clusterId}`,
    size: cp.size,
    percentage: cp.percentage,
    color: CLUSTER_COLORS[idx % CLUSTER_COLORS.length]
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="K-Means Cluster Analysis"
        subtitle="Unsupervised machine learning segmentation of charging sessions into distinct behavioral patterns."
        badge="Unsupervised Clustering"
      />

      {/* Cluster Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {clusterProfiles.map((cp, idx) => {
          const color = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
          const isSelected = selectedCluster === cp.clusterId;

          return (
            <motion.div
              key={cp.clusterId}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedCluster(isSelected ? null : cp.clusterId)}
              className={`cursor-pointer rounded-2xl glass-panel p-5 border transition-all ${
                isSelected 
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg' 
                  : 'border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {cp.percentage}% share
                </span>
              </div>

              <h3 className="mt-3 font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                {cp.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {cp.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Demand:</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{cp.avgDemand} kWh</p>
                </div>
                <div>
                  <span className="text-slate-400">Station Load:</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{cp.avgStationLoad}%</p>
                </div>
                <div>
                  <span className="text-slate-400">Queue:</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{cp.avgQueueLength} EVs</p>
                </div>
                <div>
                  <span className="text-slate-400">Primary:</span>
                  <p className="font-medium text-slate-800 dark:text-slate-200 truncate">{cp.primaryVehicleType}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Cluster Scatter Plot & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scatter Plot: Station Load vs Demand (8 cols) */}
        <div className="lg:col-span-8">
          <ChartCard
            title="Cluster Scatter Distribution: Station Load vs Charging Demand"
            subtitle="2D feature space projection colored by K-Means cluster assignment (300 representative sessions)"
            badge="2D Feature Space"
            height="h-96"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis 
                  type="number" 
                  dataKey="stationLoad" 
                  name="Station Load" 
                  unit="%" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  label={{ value: 'Station Load (%)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="chargingDemand" 
                  name="Demand" 
                  unit=" kWh" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  label={{ value: 'Charging Demand (kWh)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                />
                <ZAxis range={[30, 90]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(51, 65, 85, 0.8)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(val, name) => [val, name]}
                />
                <Legend verticalAlign="top" height={36} />
                <Scatter name="Cluster 0 (Urban Commuter)" data={cluster0Points} fill={CLUSTER_COLORS[0]} opacity={0.75} />
                <Scatter name="Cluster 1 (Fast Transit)" data={cluster1Points} fill={CLUSTER_COLORS[1]} opacity={0.75} />
                <Scatter name="Cluster 2 (Off-Peak Fleet)" data={cluster2Points} fill={CLUSTER_COLORS[2]} opacity={0.75} />
                <Scatter name="Cluster 3 (Peak Surge)" data={cluster3Points} fill={CLUSTER_COLORS[3]} opacity={0.75} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Cluster Distribution Bar Chart (4 cols) */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Cluster Volume Distribution"
            subtitle="Share of sessions per cluster"
            badge="Distribution"
            height="h-96"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionBarData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                <Tooltip
                  formatter={(value, name, props) => [`${value.toLocaleString()} sessions (${props.payload.percentage}%)`, 'Volume']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderColor: 'rgba(51, 65, 85, 0.8)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="size" radius={[0, 8, 8, 0]}>
                  {distributionBarData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Cluster Detailed Comparison Table */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-md overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Cluster Profiles & Strategic Takeaways
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Quantitative comparison of core features derived across all {totalRecords.toLocaleString()} cluster records
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <tr>
                <th className="py-3 px-4">Cluster Segment</th>
                <th className="py-3 px-4">Sessions</th>
                <th className="py-3 px-4">Avg Demand</th>
                <th className="py-3 px-4">Avg Station Load</th>
                <th className="py-3 px-4">Avg Queue</th>
                <th className="py-3 px-4">Battery Cap</th>
                <th className="py-3 px-4">Primary Vehicle</th>
                <th className="py-3 px-4">Primary Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
              {clusterProfiles.map((cp, idx) => (
                <tr key={cp.clusterId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }} />
                    <span>{cp.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400">{cp.size.toLocaleString()} ({cp.percentage}%)</td>
                  <td className="py-3.5 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{cp.avgDemand} kWh</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">{cp.avgStationLoad}%</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">{cp.avgQueueLength} EVs</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">{cp.avgBatteryCapacity} kWh</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{cp.primaryVehicleType}</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{cp.primaryLocation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClusterAnalysis;
