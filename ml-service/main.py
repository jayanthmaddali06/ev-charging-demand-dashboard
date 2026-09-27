import os
import sys
from pathlib import Path
from typing import Optional, Literal
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="EV Charging Demand Prediction API",
    description="ML Inference service powered by Scikit-Learn Random Forest Pipeline",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model holder
model_pipeline = None
model_path_used = None

def find_model_path():
    candidate_paths = [
        Path(__file__).parent.parent / "models" / "ev_charging_random_forest_pipeline.joblib",
        Path(__file__).parent / "models" / "ev_charging_random_forest_pipeline.joblib",
        Path(__file__).parent.parent / "ev_charging_random_forest_pipeline.joblib",
        Path(__file__).parent / "ev_charging_random_forest_pipeline.joblib",
        Path("models/ev_charging_random_forest_pipeline.joblib"),
        Path("ev_charging_random_forest_pipeline.joblib")
    ]
    for p in candidate_paths:
        if p.exists():
            return p.resolve()
    return None

@app.on_event("startup")
def load_model():
    global model_pipeline, model_path_used
    path = find_model_path()
    if path and path.exists():
        try:
            print(f"[ML Service] Loading model from: {path}")
            model_pipeline = joblib.load(str(path))
            model_path_used = str(path)
            print("[ML Service] Model pipeline loaded successfully.")
        except Exception as e:
            print(f"[ML Service] Error loading model: {e}", file=sys.stderr)
            model_pipeline = None
    else:
        print("[ML Service] Warning: ev_charging_random_forest_pipeline.joblib not found in candidate paths.")

DAY_NAME_TO_NUM = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6
}

class PredictionInput(BaseModel):
    battery_capacity_kWh: float = Field(..., ge=1.0, le=500.0, description="Battery capacity in kWh")
    initial_soc: float = Field(..., ge=0.0, le=100.0, description="Initial State of Charge (%)")
    charging_power_kW: float = Field(..., ge=1.0, le=500.0, description="Charging station power in kW")
    queue_length: int = Field(..., ge=0, le=100, description="Number of EVs currently in queue")
    station_load: float = Field(..., ge=0.0, le=200.0, description="Current station load percentage")
    electricity_price: float = Field(..., ge=0.0, le=100.0, description="Tariff price per kWh")
    renewable_energy_ratio: float = Field(..., ge=0.0, le=1.0, description="Ratio of green energy (0.0 - 1.0)")
    traffic_density: Literal["Low", "Medium", "High"] = Field("Medium", description="Surrounding traffic density")
    weather_condition: Literal["Clear", "Cloudy", "Rainy"] = Field("Clear", description="Weather condition")
    vehicle_type: Literal["Two-Wheeler", "Car", "Bus"] = Field("Car", description="Vehicle classification")
    location_type: Literal["Urban", "Highway"] = Field("Urban", description="Station location profile")
    charging_priority: Literal["Low", "Medium", "High"] = Field("Medium", description="User charging urgency")
    hour: int = Field(..., ge=0, le=23, description="Hour of the day (0-23)")
    day_of_week: Optional[str] = Field("Wednesday", description="Day of the week name or num")
    day_of_week_num: Optional[int] = Field(None, ge=0, le=6, description="Day of week index (0=Monday, 6=Sunday)")
    is_weekend: Optional[int] = Field(None, ge=0, le=1, description="1 if weekend else 0")
    is_peak_hour: Optional[int] = Field(None, ge=0, le=1, description="1 if peak hour else 0")

    class Config:
        json_schema_extra = {
            "example": {
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
                "day_of_week_num": 2,
                "is_weekend": 0,
                "is_peak_hour": 1
            }
        }

@app.get("/")
def read_root():
    return {
        "service": "EV Charging Demand Prediction ML Service",
        "status": "online",
        "model_loaded": model_pipeline is not None,
        "model_file": model_path_used
    }

@app.get("/health")
def health_check():
    if model_pipeline is None:
        return {"status": "degraded", "model_loaded": False, "message": "Model not loaded"}
    return {
        "status": "healthy",
        "model_loaded": True,
        "model_path": model_path_used,
        "model_type": "RandomForestRegressor Pipeline"
    }

@app.get("/model-info")
def model_info():
    return {
        "model_name": "Random Forest Regressor Pipeline",
        "expected_features": [
            "battery_capacity_kWh", "initial_soc", "charging_power_kW", "queue_length",
            "station_load", "electricity_price", "renewable_energy_ratio",
            "traffic_density", "weather_condition", "vehicle_type", "location_type",
            "charging_priority", "hour", "day_of_week_num", "is_weekend", "is_peak_hour"
        ],
        "categorical_options": {
            "traffic_density": ["High", "Low", "Medium"],
            "weather_condition": ["Clear", "Cloudy", "Rainy"],
            "vehicle_type": ["Bus", "Car", "Two-Wheeler"],
            "location_type": ["Highway", "Urban"],
            "charging_priority": ["High", "Low", "Medium"]
        }
    }

@app.post("/predict")
def predict(input_data: PredictionInput):
    global model_pipeline
    if model_pipeline is None:
        # Try loading on-demand if not loaded yet
        load_model()
        if model_pipeline is None:
            raise HTTPException(
                status_code=503,
                detail="Prediction model is not available. Please verify model file location."
            )

    try:
        # Resolve day_of_week_num
        dow_num = input_data.day_of_week_num
        if dow_num is None:
            if input_data.day_of_week:
                dow_str = str(input_data.day_of_week).strip().lower()
                dow_num = DAY_NAME_TO_NUM.get(dow_str, 2)
            else:
                dow_num = 2  # Default Wednesday

        # Resolve is_weekend
        is_wknd = input_data.is_weekend
        if is_wknd is None:
            is_wknd = 1 if dow_num in [5, 6] else 0

        # Resolve is_peak_hour
        is_pk = input_data.is_peak_hour
        if is_pk is None:
            # Common peak hours: 9-11 AM and 17-21 PM
            is_pk = 1 if (9 <= input_data.hour <= 11 or 17 <= input_data.hour <= 21) else 0

        # Build feature DataFrame matching exact pipeline expectation
        features = {
            "battery_capacity_kWh": float(input_data.battery_capacity_kWh),
            "initial_soc": float(input_data.initial_soc),
            "charging_power_kW": float(input_data.charging_power_kW),
            "queue_length": int(input_data.queue_length),
            "station_load": float(input_data.station_load),
            "electricity_price": float(input_data.electricity_price),
            "renewable_energy_ratio": float(input_data.renewable_energy_ratio),
            "traffic_density": str(input_data.traffic_density),
            "weather_condition": str(input_data.weather_condition),
            "vehicle_type": str(input_data.vehicle_type),
            "location_type": str(input_data.location_type),
            "charging_priority": str(input_data.charging_priority),
            "hour": int(input_data.hour),
            "day_of_week_num": int(dow_num),
            "is_weekend": int(is_wknd),
            "is_peak_hour": int(is_pk)
        }

        df_input = pd.DataFrame([features])
        prediction_val = float(model_pipeline.predict(df_input)[0])

        # Additional insightful analytics metrics based on predictions
        estimated_cost = round(prediction_val * input_data.electricity_price, 2)
        green_energy_kwh = round(prediction_val * input_data.renewable_energy_ratio, 2)
        grid_energy_kwh = round(prediction_val * (1.0 - input_data.renewable_energy_ratio), 2)
        est_duration_minutes = round((prediction_val / max(input_data.charging_power_kW, 1.0)) * 60, 1)

        return {
            "predicted_charging_demand": round(prediction_val, 2),
            "predicted_charging_demand_raw": prediction_val,
            "unit": "kWh",
            "status": "success",
            "model": "Random Forest Pipeline (Trained Model)",
            "estimated_cost": estimated_cost,
            "estimated_duration_minutes": est_duration_minutes,
            "energy_breakdown": {
                "renewable_kwh": green_energy_kwh,
                "grid_kwh": grid_energy_kwh,
                "renewable_percentage": round(input_data.renewable_energy_ratio * 100, 1)
            },
            "features_used": features
        }
    except Exception as e:
        print(f"[ML Service] Prediction error: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
