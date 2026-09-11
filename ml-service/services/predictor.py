"""
Predictor Service
Wraps the trained scikit-learn Pipeline models for churn prediction.
All models include a ColumnTransformer preprocessor as named_steps["preprocessor"].
"""
import os
import numpy as np
import pandas as pd
from joblib import load
from typing import Dict, Any, List

from services.explainer import generate_explanations, generate_recommendations

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")


class PredictorService:
    def __init__(self):
        self.models = {}
        self.models_loaded = False
        self._load_models()

    def _load_models(self):
        """Load all three trained pipeline models safely."""
        model_files = {
            "logistic_regression": "logistic_model.pkl",
            "random_forest": "rf_model.pkl",
            "xgboost": "xgb_model.pkl"
        }
        for key, filename in model_files.items():
            path = os.path.join(MODEL_DIR, filename)
            if os.path.exists(path):
                try:
                    self.models[key] = load(path)
                    print(f"[OK] Model '{key}' loaded successfully")
                except Exception as e:
                    print(f"[WARN] Could not load '{key}': {e}")
        self.models_loaded = len(self.models) > 0

    def _build_dataframe(self, features: Dict) -> pd.DataFrame:
        """Build a pandas DataFrame from the input feature dict."""
        feature_copy = {k: v for k, v in features.items() if k != "model"}
        return pd.DataFrame([feature_copy])

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run prediction using the specified model.
        Returns probability, risk level, confidence, and explanations.
        """
        model_key = features.get("model", "random_forest")
        if model_key not in self.models:
            model_key = "random_forest"

        model = self.models[model_key]
        df = self._build_dataframe(features)

        # Predict probability
        proba = model.predict_proba(df)[0]
        churn_prob = float(proba[1])
        no_churn_prob = float(proba[0])

        # Risk level
        if churn_prob >= 0.7:
            risk_level = "HIGH"
        elif churn_prob >= 0.4:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Confidence: how certain the model is
        confidence = float(max(proba))

        # Get SHAP/feature-based explanations
        explanations = generate_explanations(
            model=model,
            df=df,
            model_key=model_key,
            churn_prob=churn_prob,
            features=features
        )

        # Business rule recommendations
        recommendations = generate_recommendations(features, churn_prob, risk_level)

        return {
            "churn_probability": round(churn_prob, 4),
            "no_churn_probability": round(no_churn_prob, 4),
            "risk_level": risk_level,
            "confidence": round(confidence, 4),
            "model_used": model_key,
            "explanations": explanations,
            "recommendations": recommendations
        }

    def simulate(self, base_features: Dict[str, Any], modifications: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs What-If scenario simulation comparing baseline customer profile with hypothetical changes.
        """
        model_key = base_features.get("model", "random_forest")
        if model_key not in self.models:
            model_key = "random_forest"

        base_pred = self.predict(base_features)
        
        # Merge modifications onto base features
        modified_features = {**base_features, **modifications}
        sim_pred = self.predict(modified_features)

        prob_delta = sim_pred["churn_probability"] - base_pred["churn_probability"]
        pct_change = ((sim_pred["churn_probability"] - base_pred["churn_probability"]) / max(base_pred["churn_probability"], 0.0001)) * 100

        return {
            "baseline": {
                "churn_probability": base_pred["churn_probability"],
                "risk_level": base_pred["risk_level"],
                "features": base_features
            },
            "simulated": {
                "churn_probability": sim_pred["churn_probability"],
                "risk_level": sim_pred["risk_level"],
                "features": modified_features
            },
            "delta": {
                "probability_change": round(prob_delta, 4),
                "percentage_change": round(pct_change, 2),
                "direction": "REDUCED" if prob_delta < 0 else "INCREASED" if prob_delta > 0 else "NO_CHANGE",
                "impact_summary": f"Churn risk {'decreased' if prob_delta < 0 else 'increased'} by {abs(round(pct_change, 1))}%"
            }
        }

    def get_feature_importance(self) -> Dict[str, Any]:
        """Return feature importance from Random Forest model."""
        rf_model = self.models.get("random_forest")
        if not rf_model:
            return {"error": "Random Forest model not loaded"}

        preprocessor = rf_model.named_steps.get("preprocessor")
        classifier = rf_model.named_steps.get("model") or rf_model.named_steps.get("classifier")

        feature_names = list(preprocessor.get_feature_names_out())
        importances = classifier.feature_importances_.tolist()

        # Pair and sort
        paired = sorted(
            zip(feature_names, importances),
            key=lambda x: x[1],
            reverse=True
        )

        return {
            "features": [
                {"feature": name.replace("cat__", "").replace("num__", "").replace("_", " "), "raw_feature": name, "importance": round(imp, 4)}
                for name, imp in paired[:20]
            ],
            "model": "Random Forest"
        }
