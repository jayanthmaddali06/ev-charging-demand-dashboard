import React from 'react';
import { motion } from 'framer-motion';
import { 
  Info, 
  BatteryCharging, 
  Cpu, 
  Network, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  CheckCircle2, 
  Terminal, 
  ArrowRight,
  ShieldCheck,
  Server,
  Code2
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

const AboutProject = () => {
  const algorithms = [
    {
      title: "Random Forest Regressor Pipeline",
      category: "Supervised Regression",
      desc: "Deployed as the primary inference engine (`ev_charging_random_forest_pipeline.joblib`). Encapsulates full pre-processing (StandardScaler and OneHotEncoder) across 16 dynamic input features.",
      metric: "R² = 0.9888 | MAE = 2.52 kWh",
      icon: Cpu,
      color: "emerald"
    },
    {
      title: "Linear Regression Baseline",
      category: "Supervised Regression",
      desc: "Serves as an interpretable baseline model to benchmark the non-linear multi-tree ensemble against classical linear weights.",
      metric: "R² = 0.9895 | MAE = 2.47 kWh",
      icon: TrendingUp,
      color: "cyan"
    },
    {
      title: "K-Means Clustering",
      category: "Unsupervised Clustering",
      desc: "Discovers 4 natural behavioral charging clusters (Urban Commuter, Fast Transit, Off-Peak Fleet, and Peak Surge) based on load, waiting time, and vehicle attributes.",
      metric: "k = 4 Optimal Clusters",
      icon: Network,
      color: "amber"
    },
    {
      title: "Isolation Forest Anomaly Detection",
      category: "Unsupervised Outlier Detection",
      desc: "Isolates abnormal charging spikes, sudden station congestions, and grid anomalies with a 5.0% contamination parameter.",
      metric: "418 Outliers Flagged (5.0%)",
      icon: AlertTriangle,
      color: "rose"
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="About The Project"
        subtitle="Architecture, methodology, machine learning models, and smart grid engineering principles."
        badge="Engineering Documentation"
      />

      {/* Problem & Solution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 space-y-3"
        >
          <div className="flex items-center gap-2.5 text-rose-500 font-bold text-sm uppercase tracking-wider">
            <AlertTriangle className="w-5 h-5" />
            <span>The Challenge & Problem Statement</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Grid Stress & Unpredictable EV Charging Surges
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            As electric vehicle adoption surges, public charging stations face severe challenges: unpredictable peak demand spikes, lengthy queue bottlenecks, dynamic time-of-use tariffs, fluctuating renewable energy integration, and station overload risks. Without intelligent predictive telemetry, grid operators and EV drivers suffer extended wait times and high infrastructure costs.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/40 dark:border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-transparent space-y-3"
        >
          <div className="flex items-center gap-2.5 text-emerald-500 font-bold text-sm uppercase tracking-wider">
            <CheckCircle2 className="w-5 h-5" />
            <span>The Solution & Value Proposition</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            VoltPulse: Multi-Stage Machine Learning Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            VoltPulse bridges machine learning research and enterprise cloud software. By leveraging trained Random Forest pipelines, unsupervised K-Means behavioral clustering, Isolation Forest anomaly telemetry, and 7-day rolling time-series forecasting, the platform enables real-time demand prediction, dynamic tariff scheduling, and anomaly prevention.
          </p>
        </motion.div>
      </div>

      {/* Multi-tier Architecture Flowchart */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
          End-to-End System Architecture
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
          Decoupled three-tier architecture separating interactive UI, analytical aggregation, and asynchronous ML inference.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Frontend Tier */}
          <div className="p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-cyan-500 font-bold text-xs uppercase tracking-wider">
              <Code2 className="w-4 h-4" />
              <span>Client Presentation Tier</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">React.js + Tailwind CSS</h4>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Component-driven dashboard</li>
              <li>Framer Motion physics animations</li>
              <li>Recharts interactive SVG analytics</li>
              <li>Dark/Light mode theme switching</li>
            </ul>
          </div>

          {/* Backend Tier */}
          <div className="p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
              <Server className="w-4 h-4" />
              <span>Application Server Tier</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Node.js + Express REST API</h4>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li>In-memory CSV data caching</li>
              <li>Aggregation & statistical computing</li>
              <li>Payload validation & error guards</li>
              <li>Asynchronous ML request proxy</li>
            </ul>
          </div>

          {/* ML Inference Tier */}
          <div className="p-5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
              <Cpu className="w-4 h-4" />
              <span>Inference Engine Tier</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Python 3 + FastAPI Service</h4>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li>FastAPI Pydantic schema validation</li>
              <li>Serialized Joblib pipeline loader</li>
              <li>ColumnTransformer preprocessing</li>
              <li>Real-time sub-15ms inference latency</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Machine Learning Methodology Grid */}
      <div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4">
          Machine Learning Models & Algorithms
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {algorithms.map((algo, i) => {
            const Icon = algo.icon;
            return (
              <div key={i} className="glass-panel p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {algo.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-500">
                    {algo.metric}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {algo.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {algo.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AboutProject;
