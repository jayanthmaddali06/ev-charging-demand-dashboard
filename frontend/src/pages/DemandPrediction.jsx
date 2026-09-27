import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  BatteryCharging, 
  Gauge, 
  DollarSign, 
  Clock, 
  Leaf, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw,
  Sliders,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import PageHeader from '../components/PageHeader';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';

const PRESET_SCENARIOS = {
  urban_commuter: {
    label: "Urban Commuter",
    description: "Daily city driver charging during lunch hours",
    data: {
      battery_capacity_kWh: 60,
      initial_soc: 25,
      charging_power_kW: 50,
      queue_length: 2,
      station_load: 48,
      electricity_price: 13.5,
      renewable_energy_ratio: 0.45,
      traffic_density: "Medium",
      weather_condition: "Clear",
      vehicle_type: "Car",
      location_type: "Urban",
      charging_priority: "Medium",
      hour: 13,
      day_of_week: "Wednesday",
      is_weekend: 0,
      is_peak_hour: 0
    }
  },
  highway_fast: {
    label: "Highway Transit",
    description: "High-speed rapid top-up along motorway corridor",
    data: {
      battery_capacity_kWh: 85,
      initial_soc: 15,
      charging_power_kW: 120,
      queue_length: 4,
      station_load: 75,
      electricity_price: 18.0,
      renewable_energy_ratio: 0.30,
      traffic_density: "High",
      weather_condition: "Cloudy",
      vehicle_type: "Car",
      location_type: "Highway",
      charging_priority: "High",
      hour: 17,
      day_of_week: "Friday",
      is_weekend: 0,
      is_peak_hour: 1
    }
  },
  green_night: {
    label: "Eco Off-Peak",
    description: "Night charging powered by high renewable share",
    data: {
      battery_capacity_kWh: 50,
      initial_soc: 30,
      charging_power_kW: 22,
      queue_length: 0,
      station_load: 25,
      electricity_price: 8.5,
      renewable_energy_ratio: 0.85,
      traffic_density: "Low",
      weather_condition: "Clear",
      vehicle_type: "Two-Wheeler",
      location_type: "Urban",
      charging_priority: "Low",
      hour: 2,
      day_of_week: "Sunday",
      is_weekend: 1,
      is_peak_hour: 0
    }
  },
  bus_depot: {
    label: "Fleet Bus Transit",
    description: "Heavy capacity municipal bus fast charge",
    data: {
      battery_capacity_kWh: 250,
      initial_soc: 20,
      charging_power_kW: 180,
      queue_length: 3,
      station_load: 65,
      electricity_price: 15.0,
      renewable_energy_ratio: 0.50,
      traffic_density: "High",
      weather_condition: "Rainy",
      vehicle_type: "Bus",
      location_type: "Urban",
      charging_priority: "High",
      hour: 9,
      day_of_week: "Monday",
      is_weekend: 0,
      is_peak_hour: 1
    }
  }
};

const DemandPrediction = () => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState(PRESET_SCENARIOS.urban_commuter.data);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto update is_weekend if day_of_week changes
      if (field === 'day_of_week') {
        const isWknd = ['Saturday', 'Sunday'].includes(value) ? 1 : 0;
        updated.is_weekend = isWknd;
      }

      // Auto update is_peak_hour if hour changes
      if (field === 'hour') {
        const h = parseInt(value, 10);
        const isPeak = (h >= 9 && h <= 11) || (h >= 17 && h <= 21) ? 1 : 0;
        updated.is_peak_hour = isPeak;
      }

      return updated;
    });
  };

  const applyScenario = (key) => {
    const sc = PRESET_SCENARIOS[key];
    if (sc) {
      setFormData(sc.data);
      showNotification(`Loaded scenario: ${sc.label}`, 'info');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsPredicting(true);
    setError(null);

    try {
      const payload = {
        battery_capacity_kWh: parseFloat(formData.battery_capacity_kWh),
        initial_soc: parseFloat(formData.initial_soc),
        charging_power_kW: parseFloat(formData.charging_power_kW),
        queue_length: parseInt(formData.queue_length, 10),
        station_load: parseFloat(formData.station_load),
        electricity_price: parseFloat(formData.electricity_price),
        renewable_energy_ratio: parseFloat(formData.renewable_energy_ratio),
        traffic_density: formData.traffic_density,
        weather_condition: formData.weather_condition,
        vehicle_type: formData.vehicle_type,
        location_type: formData.location_type,
        charging_priority: formData.charging_priority,
        hour: parseInt(formData.hour, 10),
        day_of_week: formData.day_of_week,
        is_weekend: parseInt(formData.is_weekend, 10),
        is_peak_hour: parseInt(formData.is_peak_hour, 10)
      };

      const res = await api.predictDemand(payload);
      if (res && res.success && res.data) {
        setPredictionResult(res.data);
        showNotification(`Predicted Demand: ${res.data.predicted_charging_demand} kWh`, 'success');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err) {
      const msg = err.message || 'Prediction service is currently unavailable. Please start the ML service and try again.';
      setError(msg);
      showNotification(msg, 'error');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Charging Demand Prediction"
        subtitle="Estimate real-time EV charging energy demand (kWh) using the trained Random Forest Pipeline model."
        badge="Scikit-Learn ML Inference"
      />

      {/* Preset Scenarios Pill Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Compass className="w-4 h-4 text-emerald-500" />
          <span>Quick Scenario Presets:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(PRESET_SCENARIOS).map(([key, sc]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyScenario(key)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form Column (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Vehicle & Station Parameters
              </h2>
            </div>
            <span className="text-xs text-slate-400">16 Features</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Battery & SOC Group */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">
                1. Vehicle Energy State
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Battery Capacity */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <label>Battery Capacity</label>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{formData.battery_capacity_kWh} kWh</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={formData.battery_capacity_kWh}
                    onChange={(e) => handleInputChange('battery_capacity_kWh', Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>10 kWh</span>
                    <span>150 kWh</span>
                    <span>300 kWh</span>
                  </div>
                </div>

                {/* Initial SOC */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <label>Initial SOC (%)</label>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{formData.initial_soc}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    step="1"
                    value={formData.initial_soc}
                    onChange={(e) => handleInputChange('initial_soc', Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>5% (Empty)</span>
                    <span>50%</span>
                    <span>95% (Near full)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Station Dynamics Group */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">
                2. Station Power & Congestion
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Charging Power */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <label>Charger Power</label>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{formData.charging_power_kW} kW</span>
                  </div>
                  <input
                    type="range"
                    min="7"
                    max="250"
                    step="1"
                    value={formData.charging_power_kW}
                    onChange={(e) => handleInputChange('charging_power_kW', Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Queue Length */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <label>Queue Length</label>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{formData.queue_length} EVs</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={formData.queue_length}
                    onChange={(e) => handleInputChange('queue_length', Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Station Load */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <label>Station Load</label>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{formData.station_load}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.station_load}
                    onChange={(e) => handleInputChange('station_load', Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Grid Tariff & Renewable */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">
                3. Tariffs & Green Energy
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <label>Electricity Price ($/kWh)</label>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">${formData.electricity_price}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    step="0.5"
                    value={formData.electricity_price}
                    onChange={(e) => handleInputChange('electricity_price', Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <label>Renewable Energy Share</label>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{(formData.renewable_energy_ratio * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={formData.renewable_energy_ratio}
                    onChange={(e) => handleInputChange('renewable_energy_ratio', Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Categorical Selectors */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-4">
                4. Environmental & Context Attributes
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Vehicle Type */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Vehicle Type</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => handleInputChange('vehicle_type', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Car">Car</option>
                    <option value="Two-Wheeler">Two-Wheeler</option>
                    <option value="Bus">Bus</option>
                  </select>
                </div>

                {/* Location Type */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Location</label>
                  <select
                    value={formData.location_type}
                    onChange={(e) => handleInputChange('location_type', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Urban">Urban</option>
                    <option value="Highway">Highway</option>
                  </select>
                </div>

                {/* Traffic Density */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Traffic Density</label>
                  <select
                    value={formData.traffic_density}
                    onChange={(e) => handleInputChange('traffic_density', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Weather Condition */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Weather</label>
                  <select
                    value={formData.weather_condition}
                    onChange={(e) => handleInputChange('weather_condition', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Clear">Clear</option>
                    <option value="Cloudy">Cloudy</option>
                    <option value="Rainy">Rainy</option>
                  </select>
                </div>

                {/* Charging Priority */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Priority</label>
                  <select
                    value={formData.charging_priority}
                    onChange={(e) => handleInputChange('charging_priority', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                {/* Day of Week */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Day</label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => handleInputChange('day_of_week', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Hour & Timing Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <label>Arrival Hour</label>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{String(formData.hour).padStart(2, '0')}:00</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  step="1"
                  value={formData.hour}
                  onChange={(e) => handleInputChange('hour', Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Weekend</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${formData.is_weekend ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  {formData.is_weekend ? 'YES' : 'NO'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Peak Hour</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${formData.is_peak_hour ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  {formData.is_peak_hour ? 'PEAK' : 'OFF-PEAK'}
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Prediction service is currently unavailable. Please start the ML service and try again.</p>
                  <p className="mt-1 text-[11px] opacity-80">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPredicting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-bold text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPredicting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Computing Random Forest Inference...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-white" />
                  <span>Run Demand Prediction</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Output Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <AnimatePresence mode="wait">
            {predictionResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative overflow-hidden glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/40 shadow-2xl bg-gradient-to-b from-emerald-500/5 via-transparent to-teal-500/5"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>ML Pipeline Inference Result</span>
                  </span>
                  <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    RF Pipeline
                  </span>
                </div>

                {/* Primary Metric Hero Card */}
                <div className="text-center py-6 border-b border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    Predicted Charging Demand
                  </span>
                  <div className="mt-2 flex items-baseline justify-center gap-2">
                    <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                      {predictionResult.predicted_charging_demand}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-emerald-500">
                      kWh
                    </span>
                  </div>

                  {/* Circular/Linear Gauge */}
                  <div className="mt-5 max-w-xs mx-auto">
                    <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                      <span>Light Demand</span>
                      <span className="font-mono text-emerald-500">{predictionResult.predicted_charging_demand} / 120 kWh</span>
                      <span>High Demand</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (predictionResult.predicted_charging_demand / 120) * 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Calculated Insights */}
                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Estimated Tariff</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                      ${predictionResult.estimated_cost}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mb-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Est. Duration</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                      {predictionResult.estimated_duration_minutes} min
                    </div>
                  </div>
                </div>

                {/* Green Energy Breakdown */}
                {predictionResult.energy_breakdown && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                    <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Leaf className="w-4 h-4" />
                        <span>Renewable Energy Share</span>
                      </span>
                      <span>{predictionResult.energy_breakdown.renewable_percentage}%</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                      <span>Clean Solar/Wind: {predictionResult.energy_breakdown.renewable_kwh} kWh</span>
                      <span>Grid Energy: {predictionResult.energy_breakdown.grid_kwh} kWh</span>
                    </div>
                  </div>
                )}

                <div className="mt-5 text-center">
                  <button
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-evaluate with altered inputs</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="glass-panel rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800/80 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <Gauge className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Prediction Ready
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Adjust the vehicle and station parameters on the left or select a preset scenario, then click "Run Demand Prediction".
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Evaluate Default Commuter
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Model Information Card */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Model Pipeline Integrity</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Inference is executed directly through the serialized <code>ev_charging_random_forest_pipeline.joblib</code> model containing both preprocessing (StandardScaler + OneHotEncoder) and the trained 100-estimator Random Forest ensemble.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandPrediction;
