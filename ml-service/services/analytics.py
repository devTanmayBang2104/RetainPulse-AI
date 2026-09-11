"""
Analytics Service
Reads the Telco CSV dataset and computes aggregated analytics
for the dashboard and analytics page.
"""
import os
import pandas as pd
import numpy as np
from typing import Dict, Any

DATA_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "data", "Telco_Customer_Churn.csv"
)


class AnalyticsService:
    def __init__(self):
        self.df = None
        self._load_data()

    def _load_data(self):
        try:
            self.df = pd.read_csv(DATA_PATH)
            # Fix TotalCharges — can have spaces
            self.df["TotalCharges"] = pd.to_numeric(
                self.df["TotalCharges"], errors="coerce"
            )
            self.df.dropna(subset=["TotalCharges"], inplace=True)
            print(f"[OK] Dataset loaded: {len(self.df)} records")
        except Exception as e:
            print(f"[WARN] Error loading dataset: {e}")

    def get_summary(self) -> Dict[str, Any]:
        if self.df is None:
            return {}

        df = self.df
        total = len(df)
        churned = (df["Churn"] == "Yes").sum()
        retained = total - churned
        churn_rate = round(churned / total * 100, 2)

        avg_monthly = round(df["MonthlyCharges"].mean(), 2)
        avg_tenure = round(df["tenure"].mean(), 1)
        revenue_at_risk = round(
            df[df["Churn"] == "Yes"]["MonthlyCharges"].sum(), 2
        )

        return {
            "total_customers": int(total),
            "churned_customers": int(churned),
            "retained_customers": int(retained),
            "churn_rate": churn_rate,
            "avg_monthly_charges": avg_monthly,
            "avg_tenure_months": avg_tenure,
            "revenue_at_risk": float(revenue_at_risk),
            "dataset_source": "Telco Customer Churn (IBM Sample)"
        }

    def get_churn_by_feature(self, feature: str) -> Dict[str, Any]:
        if self.df is None:
            return {}

        ALLOWED_FEATURES = [
            "Contract", "InternetService", "PaymentMethod",
            "gender", "SeniorCitizen", "Partner",
            "Dependents", "PhoneService", "PaperlessBilling"
        ]

        if feature not in ALLOWED_FEATURES:
            return {"error": f"Feature '{feature}' not available"}

        df = self.df.copy()
        grouped = df.groupby(feature)["Churn"].apply(
            lambda x: (x == "Yes").sum()
        )
        total_grouped = df.groupby(feature)["Churn"].count()

        result = []
        for cat in grouped.index:
            churned_count = int(grouped[cat])
            total_count = int(total_grouped[cat])
            result.append({
                "category": str(cat),
                "churned": churned_count,
                "retained": total_count - churned_count,
                "total": total_count,
                "churn_rate": round(churned_count / total_count * 100, 2)
            })

        return {"feature": feature, "data": result}

    def get_monthly_charges_distribution(self) -> Dict[str, Any]:
        if self.df is None:
            return {}

        bins = [0, 20, 40, 60, 80, 100, 120]
        labels = ["0-20", "20-40", "40-60", "60-80", "80-100", "100+"]

        df = self.df.copy()
        df["charge_bin"] = pd.cut(
            df["MonthlyCharges"], bins=bins, labels=labels, right=False
        )

        result = []
        for label in labels:
            subset = df[df["charge_bin"] == label]
            churned = (subset["Churn"] == "Yes").sum()
            result.append({
                "range": label,
                "total": len(subset),
                "churned": int(churned),
                "retained": len(subset) - int(churned)
            })

        return {"data": result}

    def get_tenure_distribution(self) -> Dict[str, Any]:
        if self.df is None:
            return {}

        bins = [0, 12, 24, 36, 48, 60, 72]
        labels = ["0-12", "12-24", "24-36", "36-48", "48-60", "60-72"]

        df = self.df.copy()
        df["tenure_bin"] = pd.cut(
            df["tenure"], bins=bins, labels=labels, right=False
        )

        result = []
        for label in labels:
            subset = df[df["tenure_bin"] == label]
            churned = (subset["Churn"] == "Yes").sum()
            result.append({
                "range": label,
                "total": len(subset),
                "churned": int(churned),
                "retained": len(subset) - int(churned)
            })

        return {"data": result}
