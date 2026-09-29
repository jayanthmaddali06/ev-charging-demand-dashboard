const dataService = require('./dataService');

class AiContextService {
  detectIntent(question) {
    const text = (question || '').toLowerCase().replace(/[-_]/g, ' ');
    const hasPrediction = /\b(prediction|predictions|forecast|forecasts|predicted)\b/.test(text);

    if (hasPrediction && /\b(performance|metric|mae|mse|rmse|r2|accuracy|model)\b/.test(text)) {
      return 'predictions-and-model-evaluation';
    }
    if (/\b(anomal(?:y|ies|ous)|outlier|abnormal|unexpected|irregular|exception|spike)\b/.test(text)) return 'anomalies';
    if (/\b(cluster(?:s|ing)?|segment(?:s|ation)?|groups?|behavior)\b/.test(text)) return 'clusters';
    if (hasPrediction || /\b(machine learning|regression|random forest)\b/.test(text)) return 'predictions';
    if (/\b(model|performance|metric|mae|mse|rmse|r2|accuracy)\b/.test(text)) return 'model-evaluation';
    if (/\b(peak hour|peak hours|hourly|peak period)\b/.test(text)) return 'peak-hours';
    if (/\b(time series|trend|trends|daily|weekly|time pattern)\b/.test(text)) return 'time-series';
    if (/\b(current|currently|right now|today)\b/.test(text) && /\b(demand|charging|load)\b/.test(text)) return 'current-demand';
    if (/\b(overall|overview|summari[sz]e|summary)\b/.test(text) && /\b(charging|data|sessions|ev)\b/.test(text)) return 'overall-summary';
    if (/\b(demand|charging|load|queue|renewable|station|vehicle|location|usage|energy|fleet)\b/.test(text)) return 'demand-summary';
    return 'general';
  }

  buildSummaryContext(summary, includeDistribution = false) {
    const context = {
      totalChargingSessions: summary.totalChargingSessions,
      averageChargingDemand: summary.averageChargingDemand,
      averageStationLoad: summary.averageStationLoad,
      averageQueueLength: summary.averageQueueLength,
      detectedAnomalies: summary.detectedAnomalies,
      anomalyPercentage: summary.anomalyPercentage,
      renewableEnergyPercent: summary.renewableEnergyPercent,
      averageWaitingTimeMinutes: summary.averageWaitingTimeMinutes,
      totalEnergyDeliveredMWh: summary.totalEnergyDeliveredMWh
    };

    if (includeDistribution) {
      context.vehicleDistribution = summary.vehicleDistribution;
      context.locationDistribution = summary.locationDistribution;
    }

    return context;
  }

  buildTimeoutAnswer(intent, context) {
    if (intent === 'peak-hours') {
      const peak = context.timeSeries?.hourlyDemandRanked?.[0];
      return peak
        ? `Charging demand peaks at ${peak.hourLabel}, averaging ${peak.averageDemand} kW across ${peak.sessionCount} sessions in the historical data.`
        : 'The available time-series data does not include hourly demand details.';
    }

    if (intent === 'current-demand') {
      const average = context.summary?.averageChargingDemand;
      const peak = context.demand?.busiestHours?.[0];
      const answer = `The available data is historical, so it cannot confirm live demand. Average recorded charging demand is ${average} kW.`;
      return peak ? `${answer} The busiest recorded hour is ${peak.hourLabel}, averaging ${peak.averageDemand} kW.` : answer;
    }

    if (intent === 'anomalies') {
      const anomalies = context.anomalies;
      const comparison = anomalies?.comparison;
      const answer = `${anomalies.anomalyCount} of ${anomalies.totalRecords} records (${anomalies.anomalyPercentage}%) were flagged as anomalies.`;
      return comparison
        ? `${answer} Average station load was ${comparison.averageStationLoad.anomaly} for anomalies versus ${comparison.averageStationLoad.normal} for normal records; average queue length was ${comparison.averageQueueLength.anomaly} versus ${comparison.averageQueueLength.normal}.`
        : answer;
    }

    if (intent === 'clusters') {
      const clusters = context.clusters;
      const descriptions = (clusters?.profiles || []).map(cluster =>
        `${cluster.name}: ${cluster.size} records (${cluster.percentage}%), average demand ${cluster.avgDemand} kW`
      );
      return `The data contains ${clusters.totalClusters} charging-behavior clusters across ${clusters.totalRecords} records. ${descriptions.join('; ')}.`;
    }

    if (intent === 'predictions' || intent === 'predictions-and-model-evaluation') {
      const predictions = context.predictions;
      const examples = (predictions?.sample || []).slice(0, 3).map(sample =>
        `actual ${sample.actual}, random forest ${sample.randomForest}, linear regression ${sample.linearRegression}`
      );
      const answer = `The prediction results contain ${predictions.totalRecords} records. A few actual versus predicted examples are: ${examples.join('; ')}.`;
      if (intent === 'predictions-and-model-evaluation') {
        return `${answer} Model evaluation metrics are included separately in the supplied evaluation results.`;
      }
      return answer;
    }

    if (intent === 'time-series') {
      const series = context.timeSeries;
      const recent = (series?.recentDailyDemand || []).map(day => `${day.date}: ${day.dailyAverageDemand}`).join('; ');
      return `The supplied time series tracks ${series?.recentDailyDemand?.length || 0} recent daily demand values. Its highest daily average is ${series?.peakDay?.demand} on ${series?.peakDay?.date}, and its lowest is ${series?.lowestDay?.demand} on ${series?.lowestDay?.date}. Recent values (date: average kW): ${recent}.`;
    }

    if (intent === 'model-evaluation') {
      const models = (context.modelEvaluation?.models || []).map(model =>
        `${model.modelName}: MAE ${model.mae}, RMSE ${model.rmse}, R² ${model.r2Score}`
      );
      return `The supplied model evaluation reports ${models.join('; ')}.`;
    }

    if (intent === 'overall-summary' || intent === 'demand-summary') {
      const summary = context.summary;
      return `Across ${summary.totalChargingSessions} charging sessions, average demand was ${summary.averageChargingDemand} kW and average station load was ${summary.averageStationLoad}%. There were ${summary.detectedAnomalies} detected anomalies (${summary.anomalyPercentage}%), average queue length was ${summary.averageQueueLength}, and average waiting time was ${summary.averageWaitingTimeMinutes} minutes.`;
    }

    return null;
  }

  isAnswerGrounded(intent, answer, context) {
    const normalized = answer.replace(/,/g, '');
    const includes = value => value !== undefined && value !== null && normalized.includes(String(value));

    if (intent === 'peak-hours') {
      const peak = context.timeSeries?.hourlyDemandRanked?.[0];
      return !!peak && includes(peak.hourLabel) && includes(peak.averageDemand) && /\b(kW|kilowatts?)\b/i.test(answer);
    }

    if (intent === 'current-demand') {
      const average = context.summary?.averageChargingDemand;
      const peak = context.demand?.busiestHours?.[0];
      return includes(average) && /\b(kW|kilowatts?)\b/i.test(answer)
        && (!peak || (includes(peak.hourLabel) && includes(peak.averageDemand)));
    }

    if (intent === 'anomalies') {
      const anomalies = context.anomalies;
      return includes(anomalies.anomalyCount) && includes(anomalies.anomalyPercentage)
        && includes(anomalies.comparison.averageStationLoad.anomaly)
        && includes(anomalies.comparison.averageStationLoad.normal);
    }

    if (intent === 'clusters') {
      const profiles = context.clusters?.profiles || [];
      return includes(context.clusters?.totalClusters) && profiles.every(cluster =>
        includes(cluster.name) && includes(cluster.size) && includes(cluster.avgDemand)
      );
    }

    if (intent === 'predictions') {
      const sample = context.predictions?.sample?.[0];
      return !!sample && includes(sample.actual) && includes(sample.randomForest) && includes(sample.linearRegression);
    }

    if (intent === 'time-series') {
      const series = context.timeSeries;
      return !!series?.peakDay && !!series?.lowestDay && includes(series.peakDay.date)
        && includes(series.peakDay.demand) && includes(series.lowestDay.date) && includes(series.lowestDay.demand);
    }

    if (intent === 'model-evaluation') {
      const models = context.modelEvaluation?.models || [];
      return models.every(model => includes(model.modelName) && includes(model.mae) && includes(model.rmse) && includes(model.r2Score));
    }

    if (intent === 'overall-summary' || intent === 'demand-summary') {
      return includes(context.summary?.totalChargingSessions)
        && includes(context.summary?.averageChargingDemand)
        && includes(context.summary?.detectedAnomalies);
    }

    return true;
  }

  buildRelevantContext(question) {
    const intent = this.detectIntent(question);
    let context = {};
    let contextSources = [];

    if (intent === 'overall-summary' || intent === 'demand-summary') {
      context = { summary: this.buildSummaryContext(dataService.getSummary(), intent === 'overall-summary') };
      contextSources = ['summary'];
    } else if (intent === 'current-demand') {
      const timeSeries = dataService.getTimeSeries();
      const busiestHours = [...(timeSeries.hourlyProfile || [])]
        .sort((left, right) => right.averageDemand - left.averageDemand)
        .slice(0, 3)
        .map(({ hourLabel, averageDemand, sessionCount }) => ({ hourLabel, averageDemand, sessionCount }));

      context = {
        summary: this.buildSummaryContext(dataService.getSummary()),
        demand: { busiestHours }
      };
      contextSources = ['summary', 'time-series'];
    } else if (intent === 'peak-hours') {
      const timeSeries = dataService.getTimeSeries();
      const hourlyDemandRanked = [...(timeSeries.hourlyProfile || [])]
        .sort((left, right) => right.averageDemand - left.averageDemand)
        .slice(0, 5)
        .map(({ hourLabel, averageDemand, sessionCount }) => ({ hourLabel, averageDemand, sessionCount }));

      context = { timeSeries: { hourlyDemandRanked } };
      contextSources = ['time-series'];
    } else if (intent === 'time-series') {
      const timeSeries = dataService.getTimeSeries();
      context = {
        timeSeries: {
          recentDailyDemand: (timeSeries.dailySeries || []).slice(-7),
          peakDay: timeSeries.insights?.peakDay || null,
          lowestDay: timeSeries.insights?.lowestDay || null
        }
      };
      contextSources = ['time-series'];
    } else if (intent === 'anomalies') {
      const anomalies = dataService.getAnomalies(1, 5, 'all');
      context = {
        anomalies: {
          totalRecords: anomalies.totalRecords,
          normalCount: anomalies.normalCount,
          anomalyCount: anomalies.anomalousCount,
          anomalyPercentage: anomalies.anomalyPercentage,
          comparison: anomalies.comparison
        }
      };
      contextSources = ['anomalies'];
    } else if (intent === 'clusters') {
      const clusters = dataService.getClusters();
      context = {
        clusters: {
          totalClusters: clusters.totalClusters,
          totalRecords: clusters.totalRecords,
          profiles: (clusters.clusterProfiles || []).map(({ clusterId, name, size, percentage, avgDemand, avgStationLoad, avgQueueLength, avgWaitingTime, primaryVehicleType, primaryLocation }) => ({
            clusterId, name, size, percentage, avgDemand, avgStationLoad, avgQueueLength, avgWaitingTime, primaryVehicleType, primaryLocation
          }))
        }
      };
      contextSources = ['clusters'];
    } else if (intent === 'predictions' || intent === 'predictions-and-model-evaluation') {
      const predictions = dataService.getPredictions(1, 5);
      context = { predictions: { totalRecords: predictions.totalRecords, sample: (predictions.chartSample || []).slice(0, 5) } };
      contextSources = ['predictions'];

      if (intent === 'predictions-and-model-evaluation') {
        const evaluation = dataService.getModelEvaluation();
        context.modelEvaluation = { models: evaluation.models };
        contextSources.push('model-evaluation');
      }
    } else if (intent === 'model-evaluation') {
      const evaluation = dataService.getModelEvaluation();
      context = { modelEvaluation: { models: evaluation.models } };
      contextSources = ['model-evaluation'];
    }

    return { intent, contextSources, context };
  }
}

module.exports = new AiContextService();
