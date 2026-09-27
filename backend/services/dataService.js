const { parseCsvFile } = require('../utils/csvParser');

class DataService {
  /**
   * Get overarching KPI and summary statistics
   */
  getSummary() {
    const anomalyData = parseCsvFile('ev_charging_anomaly_results.csv');
    const totalSessions = anomalyData.length;

    let totalDemand = 0;
    let totalStationLoad = 0;
    let totalQueueLength = 0;
    let totalRenewable = 0;
    let anomalyCount = 0;
    let totalWaitingTime = 0;

    const vehicleCounts = {};
    const locationCounts = {};

    anomalyData.forEach(row => {
      const demand = Number(row.charging_demand) || 0;
      const load = Number(row.station_load) || 0;
      const queue = Number(row.queue_length) || 0;
      const renewable = Number(row.renewable_energy_ratio) || 0;
      const waiting = Number(row.waiting_time) || 0;

      totalDemand += demand;
      totalStationLoad += load;
      totalQueueLength += queue;
      totalRenewable += renewable;
      totalWaitingTime += waiting;

      if (Number(row.anomaly_label) === -1) {
        anomalyCount++;
      }

      const vType = row.vehicle_type || 'Unknown';
      vehicleCounts[vType] = (vehicleCounts[vType] || 0) + 1;

      const lType = row.location_type || 'Unknown';
      locationCounts[lType] = (locationCounts[lType] || 0) + 1;
    });

    const avgDemand = totalSessions > 0 ? totalDemand / totalSessions : 0;
    const avgStationLoad = totalSessions > 0 ? totalStationLoad / totalSessions : 0;
    const avgQueueLength = totalSessions > 0 ? totalQueueLength / totalSessions : 0;
    const avgRenewable = totalSessions > 0 ? totalRenewable / totalSessions : 0;
    const avgWaitingTime = totalSessions > 0 ? totalWaitingTime / totalSessions : 0;
    const anomalyPercentage = totalSessions > 0 ? (anomalyCount / totalSessions) * 100 : 0;

    return {
      totalChargingSessions: totalSessions,
      averageChargingDemand: Number(avgDemand.toFixed(2)),
      averageStationLoad: Number(avgStationLoad.toFixed(2)),
      averageQueueLength: Number(avgQueueLength.toFixed(2)),
      detectedAnomalies: anomalyCount,
      anomalyPercentage: Number(anomalyPercentage.toFixed(2)),
      renewableEnergyRatio: Number(avgRenewable.toFixed(4)),
      renewableEnergyPercent: Number((avgRenewable * 100).toFixed(1)),
      averageWaitingTimeMinutes: Number(avgWaitingTime.toFixed(1)),
      totalEnergyDeliveredMWh: Number((totalDemand / 1000).toFixed(2)),
      vehicleDistribution: vehicleCounts,
      locationDistribution: locationCounts
    };
  }

  /**
   * Get time-series analytics (daily, 7-day rolling, hourly)
   */
  getTimeSeries() {
    const timeSeriesData = parseCsvFile('ev_charging_time_series_results.csv');
    const anomalyData = parseCsvFile('ev_charging_anomaly_results.csv');

    // Parse daily data
    const dailySeries = timeSeriesData.map(row => ({
      date: row.date,
      dailyAverageDemand: row.daily_average_demand !== '' ? Number(Number(row.daily_average_demand).toFixed(2)) : null,
      sevenDayRollingAverage: row.seven_day_rolling_average !== '' && row.seven_day_rolling_average !== undefined && row.seven_day_rolling_average !== null
        ? Number(Number(row.seven_day_rolling_average).toFixed(2))
        : null
    }));

    // Aggregate hourly demand from the full sessions
    const hourMap = {};
    for (let h = 0; h < 24; h++) {
      hourMap[h] = { hour: h, totalDemand: 0, totalLoad: 0, count: 0 };
    }

    // Aggregate day of week
    const dowMap = {};
    const dowOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    dowOrder.forEach(d => {
      dowMap[d] = { day: d, totalDemand: 0, count: 0 };
    });

    anomalyData.forEach(row => {
      const h = Number(row.hour);
      const demand = Number(row.charging_demand) || 0;
      const load = Number(row.station_load) || 0;
      const dow = row.day_of_week;

      if (!isNaN(h) && hourMap[h]) {
        hourMap[h].totalDemand += demand;
        hourMap[h].totalLoad += load;
        hourMap[h].count++;
      }

      if (dow && dowMap[dow]) {
        dowMap[dow].totalDemand += demand;
        dowMap[dow].count++;
      }
    });

    const hourlyProfile = Object.values(hourMap).map(item => ({
      hour: item.hour,
      hourLabel: `${String(item.hour).padStart(2, '0')}:00`,
      averageDemand: item.count > 0 ? Number((item.totalDemand / item.count).toFixed(2)) : 0,
      averageStationLoad: item.count > 0 ? Number((item.totalLoad / item.count).toFixed(2)) : 0,
      sessionCount: item.count
    }));

    const weeklyProfile = dowOrder.map(dayName => {
      const item = dowMap[dayName];
      return {
        day: dayName,
        averageDemand: item && item.count > 0 ? Number((item.totalDemand / item.count).toFixed(2)) : 0,
        sessionCount: item ? item.count : 0
      };
    });

    // Summary insights
    const sortedDaily = [...dailySeries].filter(d => d.dailyAverageDemand !== null).sort((a, b) => b.dailyAverageDemand - a.dailyAverageDemand);
    const peakDay = sortedDaily[0] || null;
    const lowestDay = sortedDaily[sortedDaily.length - 1] || null;

    const sortedHourly = [...hourlyProfile].sort((a, b) => b.averageDemand - a.averageDemand);
    const peakHour = sortedHourly[0] || null;

    return {
      dailySeries,
      hourlyProfile,
      weeklyProfile,
      insights: {
        totalDaysTracked: dailySeries.length,
        peakDay: peakDay ? { date: peakDay.date, demand: peakDay.dailyAverageDemand } : null,
        lowestDay: lowestDay ? { date: lowestDay.date, demand: lowestDay.dailyAverageDemand } : null,
        peakHour: peakHour ? { hourLabel: peakHour.hourLabel, demand: peakHour.averageDemand } : null
      }
    };
  }

  /**
   * Get K-Means clustering analytics
   */
  getClusters() {
    const kmeansData = parseCsvFile('ev_charging_kmeans_results.csv');
    const clusterMap = {};

    kmeansData.forEach(row => {
      const cId = String(row.cluster);
      if (!clusterMap[cId]) {
        clusterMap[cId] = {
          clusterId: cId,
          count: 0,
          totalDemand: 0,
          totalLoad: 0,
          totalQueue: 0,
          totalInitialSoc: 0,
          totalBatteryCap: 0,
          totalWaiting: 0,
          totalRenewable: 0,
          vehicleTypes: {},
          locationTypes: {}
        };
      }

      const c = clusterMap[cId];
      c.count++;
      c.totalDemand += Number(row.charging_demand) || 0;
      c.totalLoad += Number(row.station_load) || 0;
      c.totalQueue += Number(row.queue_length) || 0;
      c.totalInitialSoc += Number(row.initial_soc) || 0;
      c.totalBatteryCap += Number(row.battery_capacity_kWh) || 0;
      c.totalWaiting += Number(row.waiting_time) || 0;
      c.totalRenewable += Number(row.renewable_energy_ratio) || 0;

      const vt = row.vehicle_type || 'Unknown';
      c.vehicleTypes[vt] = (c.vehicleTypes[vt] || 0) + 1;

      const lt = row.location_type || 'Unknown';
      c.locationTypes[lt] = (c.locationTypes[lt] || 0) + 1;
    });

    const clusterNames = {
      '0': { name: 'Cluster 0: Urban Commuter Charging', desc: 'Frequent mid-day urban sessions with moderate station load and low waiting times.' },
      '1': { name: 'Cluster 1: High-Load Fast Transit', desc: 'Heavy demand highway sessions with maximum charging power and queue pressure.' },
      '2': { name: 'Cluster 2: Standard Night / Off-Peak', desc: 'Extended low-rate sessions with high initial battery capacities.' },
      '3': { name: 'Cluster 3: Peak Hour Fast Top-Up', desc: 'Urgent priority charging sessions with short durations and high congestion.' }
    };

    const totalPoints = kmeansData.length;
    const clusterProfiles = Object.keys(clusterMap).sort().map(cId => {
      const c = clusterMap[cId];
      const count = c.count;

      const topVehicle = Object.entries(c.vehicleTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Car';
      const topLocation = Object.entries(c.locationTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Urban';

      return {
        clusterId: cId,
        name: clusterNames[cId]?.name || `Cluster ${cId}`,
        description: clusterNames[cId]?.desc || 'Distinct charging behavior pattern',
        size: count,
        percentage: Number(((count / totalPoints) * 100).toFixed(1)),
        avgDemand: Number((c.totalDemand / count).toFixed(2)),
        avgStationLoad: Number((c.totalLoad / count).toFixed(2)),
        avgQueueLength: Number((c.totalQueue / count).toFixed(2)),
        avgInitialSoc: Number((c.totalInitialSoc / count).toFixed(1)),
        avgBatteryCapacity: Number((c.totalBatteryCap / count).toFixed(1)),
        avgWaitingTime: Number((c.totalWaiting / count).toFixed(1)),
        avgRenewableRatio: Number((c.totalRenewable / count).toFixed(2)),
        primaryVehicleType: topVehicle,
        primaryLocation: topLocation
      };
    });

    // Sample representative points for 2D scatter visualization (Station Load vs Charging Demand)
    // Downsample evenly across clusters to keep payload light and rendering ultra smooth
    const step = Math.max(1, Math.floor(kmeansData.length / 300));
    const scatterPoints = [];

    for (let i = 0; i < kmeansData.length; i += step) {
      const row = kmeansData[i];
      scatterPoints.push({
        id: i,
        cluster: Number(row.cluster),
        stationLoad: Number(Number(row.station_load).toFixed(1)),
        chargingDemand: Number(Number(row.charging_demand).toFixed(1)),
        batteryCapacity: Number(row.battery_capacity_kWh),
        queueLength: Number(row.queue_length),
        vehicleType: row.vehicle_type,
        locationType: row.location_type,
        weather: row.weather_condition
      });
    }

    return {
      totalClusters: clusterProfiles.length,
      totalRecords: totalPoints,
      clusterProfiles,
      scatterPoints
    };
  }

  /**
   * Get Anomaly Detection records and distribution
   */
  getAnomalies(page = 1, limit = 20, filter = 'all') {
    const anomalyData = parseCsvFile('ev_charging_anomaly_results.csv');
    const totalRecords = anomalyData.length;

    let normalCount = 0;
    let anomalousCount = 0;

    let normalLoadSum = 0;
    let anomLoadSum = 0;
    let normalWaitingSum = 0;
    let anomWaitingSum = 0;
    let normalQueueSum = 0;
    let anomQueueSum = 0;

    const anomaliesList = [];
    const locationDist = { Urban: { normal: 0, anomaly: 0 }, Highway: { normal: 0, anomaly: 0 } };
    const vehicleDist = { Car: { normal: 0, anomaly: 0 }, Bus: { normal: 0, anomaly: 0 }, 'Two-Wheeler': { normal: 0, anomaly: 0 } };

    anomalyData.forEach((row, idx) => {
      const isAnom = Number(row.anomaly_label) === -1;
      const load = Number(row.station_load) || 0;
      const waiting = Number(row.waiting_time) || 0;
      const queue = Number(row.queue_length) || 0;

      if (isAnom) {
        anomalousCount++;
        anomLoadSum += load;
        anomWaitingSum += waiting;
        anomQueueSum += queue;

        anomaliesList.push({
          id: idx + 1,
          stationId: row.station_id,
          vehicleId: row.vehicle_id,
          vehicleType: row.vehicle_type,
          locationType: row.location_type,
          timestamp: row.timestamp,
          chargingDemand: Number(Number(row.charging_demand).toFixed(2)),
          stationLoad: Number(Number(row.station_load).toFixed(2)),
          queueLength: Number(row.queue_length),
          waitingTime: Number(row.waiting_time),
          batteryCapacity: Number(row.battery_capacity_kWh),
          electricityPrice: Number(row.electricity_price),
          renewableRatio: Number(row.renewable_energy_ratio),
          anomalyLabel: -1,
          reason: (queue > 5 || load > 85 || waiting > 30)
            ? 'Severe Congestion / Extreme Load Spike'
            : (Number(row.charging_demand) > 90 || Number(row.charging_demand) < 10)
            ? 'Irregular Charging Demand Outlier'
            : 'Multi-feature Isolation Anomaly'
        });
      } else {
        normalCount++;
        normalLoadSum += load;
        normalWaitingSum += waiting;
        normalQueueSum += queue;
      }

      const loc = row.location_type;
      if (loc && locationDist[loc]) {
        if (isAnom) locationDist[loc].anomaly++;
        else locationDist[loc].normal++;
      }

      const veh = row.vehicle_type;
      if (veh && vehicleDist[veh]) {
        if (isAnom) vehicleDist[veh].anomaly++;
        else vehicleDist[veh].normal++;
      }
    });

    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.min(100, Math.max(5, parseInt(limit, 10)));
    const startIndex = (parsedPage - 1) * parsedLimit;
    const paginatedAnomalies = anomaliesList.slice(startIndex, startIndex + parsedLimit);

    return {
      totalRecords,
      normalCount,
      anomalousCount,
      anomalyPercentage: Number(((anomalousCount / totalRecords) * 100).toFixed(2)),
      comparison: {
        averageStationLoad: {
          normal: normalCount > 0 ? Number((normalLoadSum / normalCount).toFixed(2)) : 0,
          anomaly: anomalousCount > 0 ? Number((anomLoadSum / anomalousCount).toFixed(2)) : 0
        },
        averageWaitingTime: {
          normal: normalCount > 0 ? Number((normalWaitingSum / normalCount).toFixed(1)) : 0,
          anomaly: anomalousCount > 0 ? Number((anomWaitingSum / anomalousCount).toFixed(1)) : 0
        },
        averageQueueLength: {
          normal: normalCount > 0 ? Number((normalQueueSum / normalCount).toFixed(2)) : 0,
          anomaly: anomalousCount > 0 ? Number((anomQueueSum / anomalousCount).toFixed(2)) : 0
        }
      },
      distributionByLocation: locationDist,
      distributionByVehicle: vehicleDist,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalItems: anomaliesList.length,
        totalPages: Math.ceil(anomaliesList.length / parsedLimit)
      },
      anomalies: paginatedAnomalies
    };
  }

  /**
   * Get Model Evaluation metrics
   */
  getModelEvaluation() {
    const evalData = parseCsvFile('ev_charging_model_evaluation.csv');
    return {
      source: 'Google Colab Test Dataset Evaluation',
      models: evalData.map(row => ({
        modelName: row.Model,
        mae: Number(Number(row.MAE).toFixed(4)),
        mse: Number(Number(row.MSE).toFixed(4)),
        rmse: Number(Number(row.RMSE).toFixed(4)),
        r2Score: Number(Number(row.R2_Score).toFixed(4))
      }))
    };
  }

  /**
   * Get ML Predictions table and sample data for charts
   */
  getPredictions(page = 1, limit = 20, search = '', sortField = 'id', sortOrder = 'asc') {
    let rows;
    try {
      rows = parseCsvFile('ev_charging_final_ml_results.csv');
    } catch {
      rows = parseCsvFile('ev_charging_ml_predictions.csv');
    }

    const totalRows = rows.length;

    // Map rows with clean numbers
    const processed = rows.map((r, idx) => {
      const actual = Number(r.Actual_Charging_Demand);
      const lr = Number(r.Linear_Regression_Prediction);
      const rf = Number(r.Random_Forest_Prediction);
      const lrError = r.Linear_Regression_Error !== undefined ? Number(r.Linear_Regression_Error) : Number((lr - actual).toFixed(4));
      const rfError = r.Random_Forest_Error !== undefined ? Number(r.Random_Forest_Error) : Number((rf - actual).toFixed(4));

      return {
        id: idx + 1,
        actualDemand: Number(actual.toFixed(2)),
        linearRegressionPrediction: Number(lr.toFixed(2)),
        randomForestPrediction: Number(rf.toFixed(2)),
        linearRegressionError: Number(lrError.toFixed(2)),
        randomForestError: Number(rfError.toFixed(2)),
        rfAbsoluteError: Number(Math.abs(rfError).toFixed(2))
      };
    });

    // Sample for Actual vs Predicted line chart (first 80 points)
    const chartSample = processed.slice(0, 80).map((p, i) => ({
      index: i + 1,
      actual: p.actualDemand,
      randomForest: p.randomForestPrediction,
      linearRegression: p.linearRegressionPrediction
    }));

    // Sorting
    processed.sort((a, b) => {
      let valA = a[sortField] !== undefined ? a[sortField] : a.id;
      let valB = b[sortField] !== undefined ? b[sortField] : b.id;
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.min(100, Math.max(5, parseInt(limit, 10)));
    const startIndex = (parsedPage - 1) * parsedLimit;
    const paginatedItems = processed.slice(startIndex, startIndex + parsedLimit);

    return {
      totalRecords: totalRows,
      chartSample,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(totalRows / parsedLimit),
        totalItems: totalRows
      },
      records: paginatedItems
    };
  }
}

module.exports = new DataService();
