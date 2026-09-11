"""
RetainPulse AI — ML & Retention Intelligence Service
FastAPI microservice wrapping trained scikit-learn & XGBoost pipelines, SHAP explainability, and Groq Llama-3 AI retention playbooks.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import uvicorn

from services.predictor import PredictorService
from services.analytics import AnalyticsService
from services.groq_service import GroqRetentionService

app = FastAPI(
    title="RetainPulse AI — ML & Retention Intelligence Service",
    description="Enterprise ML microservice providing multi-model churn classification, SHAP explainability, What-If scenario simulations, and Groq LLM retention playbooks.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
predictor = PredictorService()
analytics = AnalyticsService()
groq_service = GroqRetentionService()


class CustomerInput(BaseModel):
    gender: str = Field(..., example="Male")
    SeniorCitizen: int = Field(..., ge=0, le=1, example=0)
    Partner: str = Field(..., example="Yes")
    Dependents: str = Field(..., example="No")
    tenure: int = Field(..., ge=0, le=72, example=12)
    PhoneService: str = Field(..., example="Yes")
    MultipleLines: str = Field(..., example="No")
    InternetService: str = Field(..., example="Fiber optic")
    OnlineSecurity: str = Field(..., example="No")
    OnlineBackup: str = Field(..., example="No")
    DeviceProtection: str = Field(..., example="No")
    TechSupport: str = Field(..., example="No")
    StreamingTV: str = Field(..., example="No")
    StreamingMovies: str = Field(..., example="No")
    Contract: str = Field(..., example="Month-to-month")
    PaperlessBilling: str = Field(..., example="Yes")
    PaymentMethod: str = Field(..., example="Electronic check")
    MonthlyCharges: float = Field(..., ge=0, le=200, example=79.85)
    TotalCharges: float = Field(..., ge=0, le=10000, example=958.2)
    model: Optional[str] = Field(default="random_forest", example="random_forest")


class SimulationInput(BaseModel):
    base_customer: CustomerInput
    modifications: Dict[str, Any] = Field(..., example={"Contract": "One year", "TechSupport": "Yes", "MonthlyCharges": 65.0})


class RetentionStrategyInput(BaseModel):
    customer: CustomerInput
    churn_probability: float = Field(..., ge=0.0, le=1.0, example=0.78)
    risk_level: str = Field(..., example="HIGH")
    top_shap_factors: Optional[List[Dict[str, Any]]] = None
    llm_model: Optional[str] = Field(default="llama-3.3-70b-versatile", example="llama-3.3-70b-versatile")


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "models_loaded": predictor.models_loaded,
        "service": "RetainPulse AI ML Service v2.0",
        "models_available": list(predictor.models.keys())
    }


@app.post("/predict")
def predict_churn(customer: CustomerInput):
    try:
        result = predictor.predict(customer.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/simulate")
def simulate_scenario(payload: SimulationInput):
    """
    Simulate What-If parameter changes and compute churn probability delta.
    """
    try:
        base_dict = payload.base_customer.dict()
        result = predictor.simulate(base_dict, payload.modifications)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/retention-strategy")
def generate_retention_strategy(payload: RetentionStrategyInput):
    """
    Generate tailored AI retention playbook using Groq Llama-3 or offline rule engine.
    """
    try:
        result = groq_service.generate_strategy(
            customer=payload.customer.dict(),
            churn_prob=payload.churn_probability,
            risk_level=payload.risk_level,
            top_shap_factors=payload.top_shap_factors,
            model_name=payload.llm_model or "llama-3.3-70b-versatile"
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/feature-importance")
def get_feature_importance():
    try:
        return predictor.get_feature_importance()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model-performance")
def get_model_performance():
    return {
        "models": [
            {
                "name": "Logistic Regression",
                "key": "logistic_regression",
                "roc_auc": 0.86,
                "f1_score": 0.64,
                "precision": 0.52,
                "recall": 0.84,
                "description": "Baseline interpretable model with highest aggregate recall (0.84), but lower precision due to false positive rate."
            },
            {
                "name": "Random Forest",
                "key": "random_forest",
                "roc_auc": 0.85,
                "f1_score": 0.65,
                "precision": 0.56,
                "recall": 0.78,
                "description": "Ensemble tree classifier delivering the highest precision (0.56) and F1-score (0.65), minimizing wasted retention incentives."
            },
            {
                "name": "XGBoost",
                "key": "xgboost",
                "roc_auc": 0.85,
                "f1_score": 0.63,
                "precision": 0.55,
                "recall": 0.75,
                "description": "Gradient boosting pipeline with scale_pos_weight for handling customer churn class imbalance."
            }
        ],
        "recommended": "random_forest",
        "business_rationale": "In retention operations, false positives incur direct financial waste ($15–$30/mo retention credits). At the operating decision threshold (p >= 0.5), Random Forest delivers the highest Precision (0.56) and F1-Score (0.65), saving budget while capturing 78% of genuine churners."
    }


@app.get("/analytics-summary")
def get_analytics_summary():
    try:
        return analytics.get_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/churn-by-feature/{feature}")
def get_churn_by_feature(feature: str):
    try:
        return analytics.get_churn_by_feature(feature)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
