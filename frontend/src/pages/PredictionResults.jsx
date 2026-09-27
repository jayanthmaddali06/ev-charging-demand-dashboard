import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Table2, 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Layers, 
  Download,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
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
import { TableSkeleton } from '../components/LoadingSkeleton';
import { api } from '../services/api';

const PredictionResults = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const res = await api.getPredictions({
        page,
        limit,
        sortField,
        sortOrder
      });
      if (res && res.success) {
        setData(res.data);
        setError(null);
      }
    } catch (err) {
      setError(err.message || 'Unable to load prediction results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, [page, limit, sortField, sortOrder]);

  const { totalRecords = 1671, chartSample = [], records = [], pagination = {} } = data || {};

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredRecords = records.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      String(r.id).includes(term) ||
      String(r.actualDemand).includes(term) ||
      String(r.randomForestPrediction).includes(term)
    );
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Prediction Results & Telemetry"
        subtitle="Granular evaluation dataset comparing ground truth test records against machine learning inferences."
        badge="1,671 Evaluation Samples"
      />

      {/* Chart Section */}
      <ChartCard
        title="Test Subset: Ground Truth vs Random Forest vs Linear Regression"
        subtitle="Inference fidelity plotted across 80 sequential test evaluation records"
        badge="Inference Comparison"
        height="h-80"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartSample} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="index" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={['auto', 'auto']} />
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
            <Line type="monotone" dataKey="actual" name="Actual Demand (kWh)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="randomForest" name="Random Forest (kWh)" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="linearRegression" name="Linear Regression (kWh)" stroke="#06b6d4" strokeWidth={1.5} dot={{ r: 1.5 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Table Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Evaluation Record Matrix
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Browse actual values, individual predictions, and error residuals
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search demand, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-52"
              />
            </div>

            {/* Limit Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>Rows:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <TableSkeleton rows={limit} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <tr>
                  <th onClick={() => handleSort('id')} className="py-3 px-4 cursor-pointer hover:text-emerald-500">
                    <div className="flex items-center gap-1">
                      <span># Sample ID</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('actualDemand')} className="py-3 px-4 cursor-pointer hover:text-emerald-500">
                    <div className="flex items-center gap-1">
                      <span>Actual Demand</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('randomForestPrediction')} className="py-3 px-4 cursor-pointer hover:text-emerald-500">
                    <div className="flex items-center gap-1">
                      <span>RF Prediction</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('linearRegressionPrediction')} className="py-3 px-4 cursor-pointer hover:text-emerald-500">
                    <div className="flex items-center gap-1">
                      <span>LR Prediction</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th onClick={() => handleSort('randomForestError')} className="py-3 px-4 cursor-pointer hover:text-emerald-500">
                    <div className="flex items-center gap-1">
                      <span>RF Residual Error</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Abs Deviation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
                {filteredRecords.map((r) => {
                  const isOver = r.randomForestError > 0;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 font-bold">#{r.id}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-500">{r.actualDemand} kWh</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-500">{r.randomForestPrediction} kWh</td>
                      <td className="py-3 px-4 font-mono text-cyan-500">{r.linearRegressionPrediction} kWh</td>
                      <td className="py-3 px-4 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          Math.abs(r.randomForestError) < 2
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : isOver
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-indigo-500/10 text-indigo-500'
                        }`}>
                          {isOver ? `+${r.randomForestError}` : r.randomForestError} kWh
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {r.rfAbsoluteError} kWh
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-bold text-slate-800 dark:text-slate-200">{(page - 1) * limit + 1}</span> to <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(page * limit, totalRecords)}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{totalRecords.toLocaleString()}</span> entries
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
              {page} / {pagination.totalPages || Math.ceil(totalRecords / limit)}
            </span>
            <button
              onClick={() => setPage(prev => Math.min(pagination.totalPages || Math.ceil(totalRecords / limit), prev + 1))}
              disabled={page >= (pagination.totalPages || Math.ceil(totalRecords / limit))}
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

export default PredictionResults;
