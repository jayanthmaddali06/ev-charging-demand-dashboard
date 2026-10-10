# EV Charging Demand Prediction & Smart Charging Analytics Platform

![License](https://img.shields.io/badge/License-MIT-emerald.svg)
![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18.3+-cyan.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-sky.svg)
![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.6.1-orange.svg)

A production-grade, full-stack intelligence platform for smart electric
vehicle (EV) charging stations. VoltPulse unifies empirical machine
learning pipelines, temporal demand analytics, unsupervised behavioral
clustering, telemetry anomaly detection, location-aware charging
intelligence, and AI-assisted insights into an interactive dashboard.

------------------------------------------------------------------------

## 📌 Executive Summary & Problem Statement

As electric vehicles (EVs) scale exponentially, public and commercial
charging infrastructure experiences acute challenges:

- **Unpredictable Energy Demand Spikes**: High load variability
  straining distribution transformers.
- **Queue Bottlenecks**: Extended waiting times during peak commuter
  rush hours.
- **Dynamic Grid Tariffs**: Fluctuating time-of-use (TOU) electricity
  pricing.
- **Renewable Energy Integration**: Suboptimal utilization of
  intermittent local solar and wind generation.
- **Operational Anomalies**: Undetected charging failures and severe
  congestion events.
- **Charging Infrastructure Gaps**: Difficulty identifying suitable
  areas for additional charging infrastructure.
- **Location-Aware Decision Making**: Need for nearby charging-station
  information and map-based intelligence.

### The Solution

VoltPulse bridges offline machine learning research developed in Google
Colab into a live, decoupled three-tier web application. It integrates:

1.  **Supervised Regression Pipelines**: Random Forest Regressor
    ($R^2 = 0.9888$) and Linear Regression benchmark ($R^2 = 0.9895$).
2.  **Unsupervised Behavioral Segmentation**: K-Means clustering
    identifying 4 distinct charging archetypes across 6,683 sessions.
3.  **Telemetry Anomaly Screening**: Isolation Forest model detecting
    418 critical congestion and equipment outliers (5.0% contamination).
4.  **Temporal Demand Analytics**: 88-day rolling-average trends, 7-day
    rolling averages, and 24-hour diurnal demand profiles.
5.  **Live Intelligence**: Browser-controlled live location, Google Maps
    visualization, nearby Google Places charging-station discovery,
    navigation, temporal demand intelligence, and ML-assisted
    charging-gap analysis.
6.  **AI Assistance**: An intelligent assistance layer for explaining
    project analytics and providing insights based on the functionality
    and data available in the application.

------------------------------------------------------------------------

## 🏗️ System Architecture

VoltPulse is engineered with a modern, decoupled architecture:

``` text
                     ┌─────────────────────────────────────────┐
                     │      React 18 + Vite Web Client         │
                     │   Tailwind CSS • Recharts • Motion      │
                     │         Port: 3000 (Proxy /api)         │
                     └────────────────────┬────────────────────┘
                                          │
                         REST API Calls / Google APIs
                                          │
                 ┌────────────────────────┴──────────────────────┐
                 │                                               │
                 ▼                                               ▼
     ┌──────────────────────────────┐              ┌──────────────────────────┐
     │ Node.js + Express Backend    │              │ Google Maps Platform     │
     │ In-Memory CSV Cache          │              │ Maps JavaScript API      │
     │ Controller / API Logic       │              │ Places API               │
     └──────────────┬───────────────┘              │ Maps / Navigation       │
                    │                              └──────────────────────────┘
                    │ Forward /predict Payload
                    ▼
     ┌─────────────────────────────────────────────┐
     │        FastAPI Python ML Service             │
     │ Pydantic Validation • Joblib Pipeline       │
     └──────────────────────┬──────────────────────┘
                            │
                       Loads on Boot
                            ▼
     ┌──────────────────────────────────────────────────────────────┐
     │ ev_charging_random_forest_pipeline.joblib                    │
     │ ev_charging_kmeans_results.csv                               │
     │ ev_charging_anomaly_results.csv                              │
     │ ev_charging_time_series_results.csv                          │
     │ ev_charging_model_evaluation.csv                             │
     │ ev_charging_ml_predictions.csv                               │
     └──────────────────────────────────────────────────────────────┘

                 ┌─────────────────────────────────────────┐
                 │ AI Assistance / Intelligence Layer      │
                 │ Project insights • explanations         │
                 │ recommendations based on available data│
                 └─────────────────────────────────────────┘
```

### Main Technology Stack

| Layer           | Technology                                                   |
|:----------------|:-------------------------------------------------------------|
| Frontend        | React 18, Vite, Tailwind CSS, Recharts, Motion               |
| Backend         | Node.js, Express                                             |
| ML Service      | Python, FastAPI, scikit-learn, Joblib                        |
| Data Access     | Existing CSV analytical datasets and backend in-memory cache |
| Maps            | Google Maps Platform                                         |
| Places          | Google Places API                                            |
| ML Algorithms   | Random Forest, Linear Regression, K-Means, Isolation Forest  |
| Deployment      | Render                                                       |
| Version Control | GitHub                                                       |

------------------------------------------------------------------------

## ⚡ Key Dashboard Pages & Features

| Page                      | Description                          | Core Capabilities                                                                                                                                                               |
|:--------------------------|:-------------------------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Overview Dashboard**    | Real-time operations center          | Animated KPI counters, Fleet mix donut chart, Urban vs Highway distribution, Quick navigation cards.                                                                            |
| **Demand Prediction**     | Live ML inference console            | Interactive parameter controls for 16 input features, Preset scenarios, Animated demand gauge, Tariff and green-energy calculations.                                            |
| **Time-Series Analytics** | Temporal demand trends               | 88-day timeline, 7-day rolling average, 24-hour diurnal curve, Day-of-week profile, Peak-hour markers.                                                                          |
| **K-Means Clustering**    | Unsupervised segmentation            | 4 cluster profiles, 2D feature scatter plot, Segment distribution.                                                                                                              |
| **Anomaly Detection**     | Outlier detection                    | Normal vs anomaly ratio, Feature divergence comparison, Searchable incident log.                                                                                                |
| **Model Performance**     | Empirical validation                 | MAE, MSE, RMSE, and $R^2$ metrics, Actual vs Predicted regression chart.                                                                                                        |
| **Prediction Results**    | Granular evaluation table            | 1,671 test samples with search, sorting, pagination, and residual indicators.                                                                                                   |
| **Live Intelligence**     | Location-aware charging intelligence | Live browser location, Google Maps, nearby charging-station discovery, nearest stations, navigation, Temporal Demand Intelligence, and suggested new charging-station location. |
| **AI Assistance**         | Intelligent analytics assistance     | AI-assisted explanations, project insights, interpretation of analytics, and recommendations using available application information.                                           |
| **About Project**         | Engineering reference                | Problem statement, methodology, ML algorithm breakdown, architecture, and project documentation.                                                                                |

------------------------------------------------------------------------

## 📍 Live Intelligence

The **Live Intelligence** module extends the existing ML dashboard with
location-aware charging intelligence.

It combines:

- User-controlled browser location.
- Google Maps visualization.
- Google Places charging-station discovery.
- Existing ML demand prediction and temporal analytics.
- Charging-gap decision support for suggesting a potential new station
  area.

### Live Intelligence Flow

``` text
User clicks "USE MY LIVE LOCATION"
                 ↓
Browser obtains current location
                 ↓
Google Maps displays user location
                 ↓
Google Places searches nearby EV charging stations
                 ↓
Nearest charging stations are identified
                 ↓
Existing ML / temporal analytics are evaluated
                 ↓
Temporal Demand Intelligence
                 ↓
Charging Gap / Location Decision Support
                 ↓
Suggested New EV Charging Station Location
```

### Live Map Features

The Live Intelligence map provides:

- **Blue marker**: User’s current location.
- **Green markers**: Nearest charging stations.
- **Red markers**: Other nearby charging stations.
- **Orange marker**: Suggested charging-gap area when the
  decision-support logic identifies one.
- Station cards with available Google Places information.
- Distance from the user’s current location.
- Rating when supplied by Google Places.
- Google Maps navigation/open-in-maps actions.

The application should not claim live occupancy, queue length, connector
availability, waiting time, or pricing unless the connected data source
actually supplies that information.

### Temporal Demand Intelligence

Temporal Demand Intelligence uses the existing demand-prediction
functionality and temporal information to provide contextual demand
information for the current situation.

The interface can present:

- Current date/day.
- Weekday or weekend classification.
- Current demand period such as peak/off-peak where applicable.
- Predicted charging demand.
- Demand status/category.
- Supporting ML-derived context.

This is an integration of the existing ML and temporal analytics
functionality rather than a claim of a separate forecasting algorithm
such as ARIMA, Prophet, or LSTM.

### Suggested New EV Charging Station Location

The suggested-location component provides **ML-assisted decision
support** rather than claiming a separately trained station-location
model.

The decision-support output can include:

- Approximate distance from the current location.
- Gap priority.
- Urban/area profile.
- Charging Gap Score.
- Data-driven reasons supporting the recommendation.
- Relationship to nearby existing charging infrastructure.
- Localized demand-related indicators from the existing project
  intelligence.

The purpose is to help identify a potential charging-infrastructure gap
using the project’s available demand and location information.

------------------------------------------------------------------------

## 🤖 AI Assistance

The **AI Assistance** functionality provides an additional intelligent
interface on top of the project’s existing analytics.

It can be used to:

- Explain ML predictions and analytics.
- Interpret dashboard results.
- Provide project-related insights.
- Help users understand charging-demand patterns.
- Explain clustering and anomaly results.
- Assist with interpretation of Live Intelligence information.
- Provide recommendations based on the information available to the
  application.

### Important Architecture Note

AI Assistance is an application-level intelligence feature. It should
not be described as a new machine-learning training algorithm unless a
separately trained AI/ML model is actually implemented.

The core predictive ML algorithms remain:

- Random Forest Regressor
- Linear Regression
- K-Means
- Isolation Forest

The AI Assistance layer works alongside these components rather than
replacing them.

------------------------------------------------------------------------

## 🔬 Machine Learning Pipeline Details

### 1. Production Inference Model: `ev_charging_random_forest_pipeline.joblib`

- **Architecture**: `sklearn.pipeline.Pipeline`
  - Step 1: `ColumnTransformer`
    - Numerical Pipeline (`StandardScaler`): `battery_capacity_kWh`,
      `initial_soc`, `charging_power_kW`, `queue_length`,
      `station_load`, `electricity_price`, `renewable_energy_ratio`,
      `hour`, `day_of_week_num`, `is_weekend`, `is_peak_hour`.
    - Categorical Pipeline (`OneHotEncoder`): `traffic_density`,
      `weather_condition`, `vehicle_type`, `location_type`,
      `charging_priority`.
  - Step 2: `RandomForestRegressor` with 100 estimators.
- **Test Performance**:
  - $R^2$: **0.9888**
  - MAE: **2.5245 kWh**
  - RMSE: **2.9463 kWh**

### 2. Baseline Model: `ev_charging_linear_regression.joblib`

- $R^2$: **0.9895**
- MAE: **2.4724 kWh**
- RMSE: **2.8460 kWh**

The Linear Regression model is retained as a benchmark. The documented
production inference pipeline remains the Random Forest pipeline.

### 3. Clustering: `ev_charging_kmeans_results.csv`

Identified 4 charging profiles:

- **Cluster 0 — Urban Commuter**: Moderate load, fast charging sessions,
  low queue pressure.
- **Cluster 1 — High-Load Fast Transit**: Highway transit, high charging
  power, peak demand.
- **Cluster 2 — Standard Off-Peak**: Extended overnight charging, higher
  initial battery capacity.
- **Cluster 3 — Peak Hour Surge**: High queue congestion, urgent
  priority ratings.

### 4. Anomaly Detection: `ev_charging_anomaly_results.csv`

- **Model**: Isolation Forest
- Normal Sessions: **7,936 (95.0%)**
- Anomalous Sessions: **418 (5.0%)**

------------------------------------------------------------------------

## 📊 Time-Series / Temporal Analytics

The project provides temporal analytics based on the existing analytical
results.

Features include:

- 88-day demand timeline.
- 7-day rolling average.
- 24-hour diurnal demand profile.
- Day-of-week demand profile.
- Peak-hour markers.
- Temporal context used by Live Intelligence.

This module is documented as **temporal analytics**, not as a separately
trained deep-learning or statistical forecasting model.

------------------------------------------------------------------------

## 📁 Repository Structure

``` text
Project Final Files/
│
├── frontend/                     # React 18 + Vite + Tailwind Client
│   ├── src/
│   │   ├── components/           # KPICard, ChartCard, Navbar, Sidebar, etc.
│   │   ├── pages/                # Dashboard Views
│   │   ├── context/              # ThemeContext, NotificationContext
│   │   ├── services/             # Axios API Client / application services
│   │   ├── utils/                # Number & unit formatters
│   │   ├── App.jsx               # Page routing & transitions
│   │   ├── main.jsx              # DOM entrypoint
│   │   └── index.css             # Tailwind base & styling
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                      # Node.js + Express REST API Server
│   ├── controllers/              # Analytics & Prediction Controllers
│   ├── routes/                   # REST Endpoints
│   ├── services/                 # CSV DataService & ML Client
│   ├── utils/                    # Caching CSV Parser
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── ml-service/                   # Python FastAPI ML Inference Microservice
│   ├── main.py
│   ├── requirements.txt
│   └── start_ml.bat
│
├── data/                         # Existing Analytical Result Datasets
│   ├── ev_charging_anomaly_results.csv
│   ├── ev_charging_dataset.csv
│   ├── ev_charging_final_ml_results.csv
│   ├── ev_charging_kmeans_results.csv
│   ├── ev_charging_ml_predictions.csv
│   ├── ev_charging_model_evaluation.csv
│   └── ev_charging_time_series_results.csv
│
├── models/                       # Serialized Scikit-Learn Models
│   ├── ev_charging_linear_regression.joblib
│   ├── ev_charging_preprocessor.joblib
│   ├── ev_charging_random_forest.joblib
│   └── ev_charging_random_forest_pipeline.joblib
│
├── start_all.bat
├── README.md
└── .gitignore
```

------------------------------------------------------------------------

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js**: v18.0 or newer
- **Python**: v3.10, 3.11, 3.12, or 3.13
- **scikit-learn**: 1.6.1
- Google Maps Platform API key for Live Intelligence map/Places
  functionality.

### Option A: One-Click Launch (Windows)

Double-click `start_all.bat` in the root folder, or execute:

``` cmd
start_all.bat
```

This launches the application services and opens the frontend.

### Option B: Manual Launch

#### 1. Start Python FastAPI ML Service

``` bash
cd ml-service
python main.py
```

The ML service listens on:

``` text
http://localhost:8000
```

Swagger UI:

``` text
http://localhost:8000/docs
```

#### 2. Start Node.js Express Backend

``` bash
cd backend
npm install
node server.js
```

The Express backend listens on:

``` text
http://localhost:5000
```

#### 3. Start React Frontend

``` bash
cd frontend
npm install
npm run dev
```

The Vite frontend listens on:

``` text
http://localhost:3000
```

------------------------------------------------------------------------

## 🗺️ Google Maps Configuration

Live Intelligence uses Google Maps Platform for map visualization and
charging-station discovery.

The frontend environment configuration should contain:

``` env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

For deployment, `VITE_API_URL` should point to the deployed backend.

The Google API key should be restricted to the application’s authorized
domains and only the required Google APIs.

**Do not commit a real API key to GitHub.**

------------------------------------------------------------------------

## 📡 REST API Documentation

### Node.js Backend API

| Method | Endpoint                | Description                                                        |
|:-------|:------------------------|:-------------------------------------------------------------------|
| `GET`  | `/api/health`           | Status check for backend and connected ML service                  |
| `GET`  | `/api/summary`          | Aggregate KPI statistics, sessions, averages, and distributions    |
| `GET`  | `/api/time-series`      | Daily demand timeline, rolling average, hourly and weekly profiles |
| `GET`  | `/api/clusters`         | K-Means cluster profiles, sizes, and scatter coordinates           |
| `GET`  | `/api/anomalies`        | Isolation Forest telemetry and feature comparisons                 |
| `GET`  | `/api/model-evaluation` | MAE, MSE, RMSE, and $R^2$ benchmark metrics                        |
| `GET`  | `/api/predictions`      | Test predictions with filters, sorting, and pagination             |
| `POST` | `/api/predict`          | Proxies prediction payload to the FastAPI ML service               |

Live Intelligence may also use application-specific endpoints for
location-aware analysis depending on the deployed backend
implementation.

### FastAPI ML Microservice

| Method | Endpoint      | Description                                                                |
|:-------|:--------------|:---------------------------------------------------------------------------|
| `GET`  | `/`           | Root information and model loading status                                  |
| `GET`  | `/health`     | Health probe confirming pipeline readiness                                 |
| `GET`  | `/model-info` | Feature list and categorical vocabulary                                    |
| `POST` | `/predict`    | Computes charging demand from 16 features using the Random Forest pipeline |

------------------------------------------------------------------------

## 🧮 Prediction Inputs

The production model uses the following 16 input features:

1.  `battery_capacity_kWh`
2.  `initial_soc`
3.  `charging_power_kW`
4.  `queue_length`
5.  `station_load`
6.  `electricity_price`
7.  `renewable_energy_ratio`
8.  `traffic_density`
9.  `weather_condition`
10. `vehicle_type`
11. `location_type`
12. `charging_priority`
13. `hour`
14. `day_of_week`
15. `is_weekend`
16. `is_peak_hour`

------------------------------------------------------------------------

## 📤 Sample Prediction Response

``` json
{
  "predicted_charging_demand": 44.21,
  "predicted_charging_demand_raw": 44.2145,
  "unit": "kWh",
  "status": "success",
  "model": "Random Forest Pipeline (Trained Model)",
  "estimated_cost": 552.68,
  "estimated_duration_minutes": 53.1,
  "energy_breakdown": {
    "renewable_kwh": 19.9,
    "grid_kwh": 24.31,
    "renewable_percentage": 45.0
  }
}
```

------------------------------------------------------------------------

## 🔄 End-to-End Project Workflow

``` text
Historical EV Charging Dataset
            ↓
Data Preprocessing
            ↓
Feature Engineering
            ↓
┌───────────────────────────────────────────────┐
│ Machine Learning / Analytics                  │
│                                               │
│ Random Forest → Demand Prediction             │
│ Linear Regression → Benchmark                 │
│ K-Means → Charging Behavior Segmentation      │
│ Isolation Forest → Anomaly Detection          │
│ Temporal Analytics → Demand Patterns          │
└───────────────────────────────────────────────┘
            ↓
FastAPI ML Service
            ↓
Node.js / Express Backend
            ↓
React Dashboard
            ↓
┌───────────────────────────────────────────────┐
│ User-Facing Intelligence                      │
│                                               │
│ Demand Prediction                             │
│ Time-Series Analytics                         │
│ Clustering                                    │
│ Anomaly Detection                             │
│ Model Performance                             │
│ Live Intelligence                             │
│ AI Assistance                                 │
└───────────────────────────────────────────────┘
```

### Live Intelligence Workflow

``` text
Browser Location
      ↓
Google Maps
      ↓
Google Places Charging Stations
      ↓
Nearby Station Information
      ↓
Existing ML Demand Intelligence
      ↓
Temporal Demand Intelligence
      ↓
Charging Gap Decision Support
      ↓
Suggested New Charging Station Location
```

------------------------------------------------------------------------

## 🛡️ Error Handling & Reliability

- **Graceful Service Degradation**: If the ML service is offline, the
  frontend displays an informative service-unavailable message.
- **Data Safety**: Dataset queries return user-friendly error states
  rather than exposing raw server stack traces.
- **In-Memory Caching**: Existing CSV datasets are parsed and cached by
  the backend for efficient access.
- **External API Dependency Handling**: Live map and station-discovery
  functionality depends on the availability and configuration of Google
  Maps Platform services.
- **AI Assistance Availability**: AI features should clearly indicate
  when the configured AI provider/service is unavailable rather than
  presenting fabricated AI results.

------------------------------------------------------------------------

## 📈 Key Results

| Component                      | Result                  |
|:-------------------------------|:------------------------|
| Production Model               | Random Forest Regressor |
| Random Forest Estimators       | 100                     |
| Random Forest $R^2$            | 0.9888                  |
| Random Forest MAE              | 2.5245 kWh              |
| Random Forest RMSE             | 2.9463 kWh              |
| Linear Regression $R^2$        | 0.9895                  |
| Linear Regression MAE          | 2.4724 kWh              |
| Linear Regression RMSE         | 2.8460 kWh              |
| K-Means Clusters               | 4                       |
| Isolation Forest Anomalies     | 418                     |
| Isolation Forest Contamination | 5.0%                    |
| Held-out Prediction Samples    | 1,671                   |
| Temporal Analytics             | 88 days                 |
| Rolling Average                | 7 days                  |
| Diurnal Profile                | 24 hours                |

------------------------------------------------------------------------

## ⚠️ Important Technical Notes

1.  **Random Forest remains the documented production inference model**,
    even though the Linear Regression benchmark has slightly better
    reported test metrics.
2.  **Google Maps is an external mapping/data service, not an ML
    algorithm.**
3.  **Live Intelligence is an integration layer** combining location
    services, Google Places data, and the project’s existing ML/temporal
    analytics.
4.  **Suggested New Charging Station Location is ML-assisted decision
    support**, unless a separately trained station-location model is
    added and documented.
5.  **Temporal Demand Intelligence is temporal analytics plus existing
    demand prediction**, not automatically a separate ARIMA, Prophet,
    LSTM, or other forecasting model.
6.  Live station information should only contain fields actually
    supplied by the connected Google Places/data services.
7.  AI Assistance should only claim capabilities actually implemented
    and connected in the deployed application.
8.  API keys and secrets must remain in environment variables and must
    never be committed to GitHub.

------------------------------------------------------------------------

## 🔮 Future Enhancements

- [ ] Integration of real-time Open Charge Point Protocol (OCPP 2.0.1)
  telemetry streams.
- [ ] Reinforcement Learning dynamic pricing optimization based on
  day-ahead renewable forecasts.
- [ ] Real-time charger occupancy and stall availability from supported
  station operators/data providers.
- [ ] More advanced geospatial optimization using verified
  charging-infrastructure datasets.
- [ ] Mobile companion Progressive Web App (PWA) with push notifications
  for charging-complete events.
- [ ] Expanded AI assistance with verified real-time project data and
  controlled tool integration.

------------------------------------------------------------------------

## 📄 License

This project is open-source under the MIT License. Developed for smart
EV infrastructure research, academic presentations, and technical
demonstrations.
