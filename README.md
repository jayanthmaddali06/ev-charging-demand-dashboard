# EV Charging Demand Prediction & Smart Charging Analytics Platform

![License](https://img.shields.io/badge/License-MIT-emerald.svg)
![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18.3+-cyan.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-sky.svg)
![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.6.1-orange.svg)

A production-grade, full-stack intelligence platform for smart electric vehicle (EV) charging stations. VoltPulse unifies empirical machine learning pipelines, time-series forecasting, unsupervised spatial-temporal clustering, and telemetry anomaly detection into an animated dashboard.

---

## 📌 Executive Summary & Problem Statement

As electric vehicles (EVs) scale exponentially, public and commercial charging infrastructure experiences acute challenges:
- **Unpredictable Energy Demand Spikes**: High load variability straining distribution transformers.
- **Queue Bottlenecks**: Extended waiting times during peak commuter rush hours.
- **Dynamic Grid Tariffs**: Fluctuating time-of-use (TOU) electricity pricing.
- **Renewable Energy Integration**: Suboptimal utilization of intermittent local solar and wind generation.
- **Operational Anomalies**: Undetected charging failures and severe congestion events.

### The Solution:
VoltPulse bridges offline machine learning research developed in Google Colab into a live, decoupled three-tier web application. It integrates:
1. **Supervised Regression Pipelines**: Random Forest Regressor ($R^2 = 0.9888$) and Linear Regression benchmark ($R^2 = 0.9895$).
2. **Unsupervised Behavioral Segmentation**: K-Means clustering identifying 4 distinct charging archetypes across 6,683 sessions.
3. **Telemetry Anomaly Screening**: Isolation Forest model detecting 418 critical congestion and equipment outliers ($5.0\%$ contamination).
4. **Temporal Diurnal Analytics**: 88-day rolling average trends and 24-hour diurnal demand profiles.

---

## 🏗️ System Architecture

VoltPulse is engineered with a modern, decoupled microservice architecture:

```
                    ┌─────────────────────────────────────────┐
                    │      React 18 + Vite Web Client         │
                    │   Tailwind CSS • Recharts • Motion      │
                    │         Port: 3000 (Proxy /api)         │
                    └────────────────────┬────────────────────┘
                                         │
                                   REST API Calls
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │       Node.js + Express Backend         │
                    │  In-Memory CSV Cache • Controller Logic │
                    │               Port: 5000                │
                    └────────────────────┬────────────────────┘
                                         │
                              Forward /predict Payload
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │        FastAPI Python ML Service        │
                    │  Pydantic Validation • Joblib Pipeline  │
                    │               Port: 8000                │
                    └────────────────────┬────────────────────┘
                                         │
                                   Loads on Boot
                                         │
                                         ▼
      ┌──────────────────────────────────────────────────────────────────────┐
      │  ev_charging_random_forest_pipeline.joblib (Preprocessing + Forest) │
      │  ev_charging_kmeans_results.csv (Clustering Telemetry)              │
      │  ev_charging_anomaly_results.csv (Isolation Forest Telemetry)       │
      │  ev_charging_time_series_results.csv (88-Day Temporal Records)       │
      │  ev_charging_model_evaluation.csv (Held-out Test Benchmarks)        │
      │  ev_charging_ml_predictions.csv (Actual vs Predicted Pairs)         │
      └──────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Dashboard Pages & Features

| Page | Description | Core Capabilities |
| :--- | :--- | :--- |
| **Overview Dashboard** | Real-time operations center | Animated KPI counters, Fleet mix donut chart, Urban vs Highway distribution, Quick navigation cards. |
| **Demand Prediction** | Live ML inference console | Interactive parameter sliders for 16 input features, Preset scenarios, Animated demand gauge, Tariff & green energy calculations. |
| **Time-Series Analytics** | Temporal demand trends | 88-day timeline with 7-day rolling average, 24-hour diurnal curve, Day-of-week profile, Peak hour markers. |
| **K-Means Clustering** | Unsupervised segmentation | 4 cluster profiles, 2D feature scatter plot (Station Load vs Demand), Segment distribution bar chart. |
| **Anomaly Detection** | Outlier detection | 95/5 Normal vs Anomaly ratio, Feature divergence comparison, Searchable and paginated incident log with pulse status badges. |
| **Model Performance** | Empirical validation | Side-by-side MAE, MSE, RMSE, and $R^2$ metrics, Actual vs Predicted regression line chart on test set. |
| **Prediction Results** | Granular evaluation table | 1,671 test samples with search, column sorting, pagination, error residual badges (+ / -). |
| **About Project** | Engineering reference | Problem statement, methodology, ML algorithm breakdown, and architectural documentation. |

---

## 🔬 Machine Learning Pipeline Details

### 1. Production Inference Model: `ev_charging_random_forest_pipeline.joblib`
- **Architecture**: `sklearn.pipeline.Pipeline`
  - Step 1: `ColumnTransformer`
    - Numerical Pipeline (`StandardScaler`): `battery_capacity_kWh`, `initial_soc`, `charging_power_kW`, `queue_length`, `station_load`, `electricity_price`, `renewable_energy_ratio`, `hour`, `day_of_week_num`, `is_weekend`, `is_peak_hour`.
    - Categorical Pipeline (`OneHotEncoder`): `traffic_density`, `weather_condition`, `vehicle_type`, `location_type`, `charging_priority`.
  - Step 2: `RandomForestRegressor` (100 estimators)
- **Test Performance**:
  - $R^2$ Score: **0.9888**
  - MAE: **2.5245 kWh**
  - RMSE: **2.9463 kWh**

### 2. Baseline Model: `ev_charging_linear_regression.joblib`
- $R^2$ Score: **0.9895**
- MAE: **2.4724 kWh**
- RMSE: **2.8460 kWh**

### 3. Clustering: `ev_charging_kmeans_results.csv`
- Identified 4 optimal clusters:
  - **Cluster 0 (Urban Commuter)**: Moderate load, fast charging sessions, low queue pressure.
  - **Cluster 1 (High-Load Fast Transit)**: Highway transit, high charging power, peak demand.
  - **Cluster 2 (Standard Off-Peak)**: Extended overnight charging, higher initial battery capacity.
  - **Cluster 3 (Peak Hour Surge)**: High queue congestion, urgent priority ratings.

### 4. Anomaly Detection: `ev_charging_anomaly_results.csv`
- Model: **Isolation Forest**
- Normal Sessions: 7,936 (95.0%)
- Anomalous Sessions: 418 (5.0%)

---

## 📁 Repository Structure

```
Project Final Files/
│
├── frontend/                     # React 18 + Vite + Tailwind Client
│   ├── src/
│   │   ├── components/           # KPICard, ChartCard, Navbar, Sidebar, etc.
│   │   ├── pages/                # 8 Dashboard Views
│   │   ├── context/              # ThemeContext (dark/light), NotificationContext
│   │   ├── services/             # Axios API Client
│   │   ├── utils/                # Number & unit formatters
│   │   ├── App.jsx               # Page routing & Framer Motion transitions
│   │   ├── main.jsx              # DOM entrypoint
│   │   └── index.css             # Tailwind base & Glassmorphism styles
│   ├── package.json
│   ├── vite.config.js            # Port 3000 & /api Proxy
│   └── tailwind.config.js
│
├── backend/                      # Node.js + Express REST API Server
│   ├── controllers/              # Analytics & Prediction Controllers
│   ├── routes/                   # REST Endpoints
│   ├── services/                 # CSV In-Memory DataService & ML Client
│   ├── utils/                    # Caching CSV Parser
│   ├── server.js                 # Express Entrypoint (Port 5000)
│   ├── package.json
│   └── .env
│
├── ml-service/                   # Python FastAPI ML Inference Microservice
│   ├── main.py                   # FastAPI Application & Pydantic Schema (Port 8000)
│   ├── requirements.txt          # Python Dependencies
│   └── start_ml.bat              # Batch launch helper
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
├── start_all.bat                 # One-click Windows Launcher
├── README.md
└── .gitignore
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0 or newer
- **Python**: v3.10, 3.11, 3.12, or 3.13 (with `scikit-learn==1.6.1`)

---

### Option A: One-Click Launch (Windows)

Simply double-click `start_all.bat` in the root folder, or execute:
```cmd
start_all.bat
```
This automatically launches all three services in separate command windows and opens `http://localhost:3000` in your default browser.

---

### Option B: Manual Step-by-Step Launch

#### 1. Start Python FastAPI ML Service
```bash
cd ml-service
python main.py
```
> The ML service loads the pipeline and listens on `http://localhost:8000`. Test via `http://localhost:8000/docs` (Swagger UI).

#### 2. Start Node.js Express Backend
```bash
cd backend
npm install
node server.js
```
> The Express backend will start on `http://localhost:5000`.

#### 3. Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
> The Vite frontend will start on `http://localhost:3000`.

---

## 📡 REST API Documentation

### Node.js Backend API (`http://localhost:5000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Status check for backend and connected ML service |
| `GET` | `/api/summary` | Aggregate KPI statistics, sessions, averages, and distributions |
| `GET` | `/api/time-series` | Daily demand timeline, 7-day rolling average, hourly and weekly profiles |
| `GET` | `/api/clusters` | K-Means cluster profiles, sizes, and 2D scatter coordinates |
| `GET` | `/api/anomalies` | Isolation Forest telemetry with pagination and feature comparisons |
| `GET` | `/api/model-evaluation` | MAE, MSE, RMSE, and $R^2$ benchmark metrics from test set |
| `GET` | `/api/predictions` | 1,671 test predictions with filters, sorting, and pagination |
| `POST` | `/api/predict` | Proxies prediction payload to the FastAPI ML service |

### FastAPI ML Microservice (`http://localhost:8000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Root info & model loading status |
| `GET` | `/health` | Health probe confirming pipeline readiness |
| `GET` | `/model-info` | Feature list and categorical vocabulary |
| `POST` | `/predict` | Computes charging demand from 16 features via `ev_charging_random_forest_pipeline.joblib` |

#### Sample Prediction Request Payload:
```json
{
  "battery_capacity_kWh": 60.0,
  "initial_soc": 20.0,
  "charging_power_kW": 50.0,
  "queue_length": 2,
  "station_load": 45.0,
  "electricity_price": 12.5,
  "renewable_energy_ratio": 0.45,
  "traffic_density": "Medium",
  "weather_condition": "Clear",
  "vehicle_type": "Car",
  "location_type": "Urban",
  "charging_priority": "High",
  "hour": 14,
  "day_of_week": "Wednesday",
  "is_weekend": 0,
  "is_peak_hour": 1
}
```

#### Sample Prediction Response:
```json
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

---

## 🛡️ Error Handling & Reliability

- **Graceful Service Degradation**: If the ML service is offline, the frontend displays an informative banner: `"Prediction service is currently unavailable. Please start the ML service and try again."`
- **Data Safety**: All dataset queries fallback with user-friendly messages rather than exposing raw server stack traces.
- **In-Memory Caching**: CSV datasets are parsed once and cached in-memory on the backend server for instant responses (< 5ms response times).

---

## 🔮 Future Enhancements
- [ ] Integration of real-time Open Charge Point Protocol (OCPP 2.0.1) telemetry streams.
- [ ] Reinforcement Learning dynamic pricing optimization based on day-ahead renewable forecasts.
- [ ] Interactive station map with live geolocated charging stall availability.
- [ ] Mobile companion Progressive Web App (PWA) with push notifications for charging complete events.

---

## 📄 License
This project is open-source under the MIT License. Developed for smart EV infrastructure research, academic presentations, and technical demonstrations.
