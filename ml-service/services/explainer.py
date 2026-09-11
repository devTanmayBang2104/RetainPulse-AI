"""
Explainer Service
Generates SHAP-based and business-rule-based explanations for churn predictions.
Also provides business retention recommendations.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, List


def generate_explanations(
    model,
    df: pd.DataFrame,
    model_key: str,
    churn_prob: float,
    features: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Generate human-readable explanations for why a customer is predicted to churn.
    Uses SHAP for tree-based models, falls back to business rules for others.
    """
    try:
        if model_key in ["random_forest", "xgboost"]:
            return _shap_explanations(model, df, features)
        else:
            return _rule_based_explanations(features, churn_prob)
    except Exception:
        return _rule_based_explanations(features, churn_prob)


def _shap_explanations(model, df: pd.DataFrame, features: Dict) -> List[Dict]:
    """SHAP-based explanations using the preprocessor + classifier."""
    import shap

    preprocessor = model.named_steps.get("preprocessor")
    classifier = model.named_steps.get("model") or model.named_steps.get("classifier")

    feature_names = list(preprocessor.get_feature_names_out())
    X_transformed = preprocessor.transform(df)
    X_df = pd.DataFrame(X_transformed, columns=feature_names)

    explainer = shap.Explainer(classifier)
    shap_values = explainer(X_df)

    # For binary classification, index 1 = churn class
    if len(shap_values.values.shape) == 3:
        vals = shap_values.values[0, :, 1]
    else:
        vals = shap_values.values[0, :]

    paired = sorted(zip(feature_names, vals), key=lambda x: abs(x[1]), reverse=True)

    explanations = []
    for feat, shap_val in paired[:8]:
        direction = "increases" if shap_val > 0 else "decreases"
        # Clean feature name (remove transformer prefix)
        clean = feat.split("__")[-1].replace("_", " ").title()
        explanations.append({
            "feature": clean,
            "raw_feature": feat,
            "shap_value": round(float(shap_val), 4),
            "direction": direction,
            "impact": "HIGH" if abs(shap_val) > 0.12 else "MEDIUM" if abs(shap_val) > 0.04 else "LOW",
            "message": f"{clean} {direction} churn risk by {abs(round(float(shap_val)*100, 1))}%"
        })

    return explanations


def _rule_based_explanations(features: Dict, churn_prob: float) -> List[Dict]:
    """Business rule-based explanations when SHAP is unavailable."""
    explanations = []

    rules = [
        {
            "condition": features.get("Contract") == "Month-to-month",
            "feature": "Contract Type",
            "shap_value": 0.18,
            "direction": "increases",
            "impact": "HIGH",
            "message": "Month-to-month contract strongly increases churn probability"
        },
        {
            "condition": features.get("tenure", 72) < 12,
            "feature": "Customer Tenure",
            "shap_value": 0.15,
            "direction": "increases",
            "impact": "HIGH",
            "message": "Short tenure (new customer) increases churn probability"
        },
        {
            "condition": features.get("MonthlyCharges", 0) > 70,
            "feature": "Monthly Charges",
            "shap_value": 0.12,
            "direction": "increases",
            "impact": "HIGH",
            "message": "High monthly charges increase churn probability"
        },
        {
            "condition": features.get("TechSupport") in ["No", "No internet service"],
            "feature": "Tech Support",
            "shap_value": 0.09,
            "direction": "increases",
            "impact": "MEDIUM",
            "message": "Absence of tech support increases churn probability"
        },
        {
            "condition": features.get("InternetService") == "Fiber optic",
            "feature": "Internet Service",
            "shap_value": 0.08,
            "direction": "increases",
            "impact": "MEDIUM",
            "message": "Fiber optic service correlates with higher churn rates"
        },
        {
            "condition": features.get("OnlineSecurity") in ["No", "No internet service"],
            "feature": "Online Security",
            "shap_value": 0.07,
            "direction": "increases",
            "impact": "MEDIUM",
            "message": "No online security increases churn risk"
        },
        {
            "condition": features.get("PaymentMethod") == "Electronic check",
            "feature": "Payment Method",
            "shap_value": 0.06,
            "direction": "increases",
            "impact": "LOW",
            "message": "Electronic check payment method correlates with churn"
        },
        {
            "condition": features.get("PaperlessBilling") == "Yes",
            "feature": "Paperless Billing",
            "shap_value": 0.04,
            "direction": "increases",
            "impact": "LOW",
            "message": "Paperless billing customers show slightly higher churn"
        }
    ]

    for rule in rules:
        if rule["condition"]:
            explanations.append({
                "feature": rule["feature"],
                "raw_feature": rule["feature"].lower().replace(" ", "_"),
                "shap_value": rule["shap_value"],
                "direction": rule["direction"],
                "impact": rule["impact"],
                "message": rule["message"]
            })

    # Sort by impact
    impact_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    explanations.sort(key=lambda x: impact_order.get(x["impact"], 3))

    return explanations[:5] if explanations else [{
        "feature": "Overall Profile",
        "shap_value": round(churn_prob - 0.27, 4),
        "direction": "increases" if churn_prob > 0.27 else "decreases",
        "impact": "MEDIUM",
        "message": "Customer profile indicates elevated churn risk"
    }]


def generate_recommendations(
    features: Dict[str, Any],
    churn_prob: float,
    risk_level: str
) -> List[Dict[str, Any]]:
    """
    Generate business retention recommendations based on customer profile and risk.
    Pure business-rule engine — no external API required.
    """
    recommendations = []

    # Rule 1: Month-to-month → offer long-term contract
    if features.get("Contract") == "Month-to-month":
        recommendations.append({
            "id": "CONTRACT_UPGRADE",
            "title": "Offer Annual Contract Upgrade",
            "description": "Provide a 15-20% discount for switching to a 1-year or 2-year contract.",
            "category": "Contract",
            "priority": "HIGH",
            "estimated_impact": "Reduces churn probability by ~25%",
            "action": "CONTACT_CUSTOMER"
        })

    # Rule 2: High monthly charges → offer discount
    if features.get("MonthlyCharges", 0) > 70:
        recommendations.append({
            "id": "PRICE_DISCOUNT",
            "title": "Apply Loyalty Pricing Discount",
            "description": "Offer a 10-15% reduction on monthly charges or a bundled services discount.",
            "category": "Pricing",
            "priority": "HIGH",
            "estimated_impact": "Reduces churn probability by ~20%",
            "action": "APPLY_DISCOUNT"
        })

    # Rule 3: Low tenure → welcome offer
    if features.get("tenure", 72) < 12:
        recommendations.append({
            "id": "WELCOME_OFFER",
            "title": "Activate New Customer Retention Program",
            "description": "Enroll customer in a 90-day welcome program with dedicated support and exclusive benefits.",
            "category": "Engagement",
            "priority": "HIGH",
            "estimated_impact": "Reduces early churn by ~30%",
            "action": "ENROLL_PROGRAM"
        })

    # Rule 4: No tech support
    if features.get("TechSupport") in ["No", "No internet service"]:
        recommendations.append({
            "id": "TECH_SUPPORT_UPSELL",
            "title": "Offer Complimentary Tech Support Trial",
            "description": "Provide 3 months of free premium tech support to demonstrate value.",
            "category": "Service",
            "priority": "MEDIUM",
            "estimated_impact": "Reduces churn probability by ~15%",
            "action": "ACTIVATE_TRIAL"
        })

    # Rule 5: No online security
    if features.get("OnlineSecurity") in ["No", "No internet service"]:
        recommendations.append({
            "id": "SECURITY_BUNDLE",
            "title": "Recommend Security & Protection Bundle",
            "description": "Offer online security and device protection bundle at a discounted rate.",
            "category": "Service",
            "priority": "MEDIUM",
            "estimated_impact": "Increases service stickiness by ~18%",
            "action": "SEND_OFFER"
        })

    # Rule 6: Electronic check → auto payment
    if features.get("PaymentMethod") == "Electronic check":
        recommendations.append({
            "id": "PAYMENT_AUTOPAY",
            "title": "Incentivize Auto-Pay Enrollment",
            "description": "Offer $5/month discount for switching to automatic bank transfer or credit card payment.",
            "category": "Billing",
            "priority": "LOW",
            "estimated_impact": "Reduces churn probability by ~8%",
            "action": "SEND_AUTOPAY_LINK"
        })

    # Rule 7: Fiber optic + high charges → value reinforcement
    if features.get("InternetService") == "Fiber optic" and features.get("MonthlyCharges", 0) > 60:
        recommendations.append({
            "id": "FIBER_VALUE",
            "title": "Reinforce Fiber Service Value",
            "description": "Send personalized usage report showing speed benefits and savings vs competitors.",
            "category": "Engagement",
            "priority": "MEDIUM",
            "estimated_impact": "Improves satisfaction score by ~12%",
            "action": "SEND_VALUE_REPORT"
        })

    # High risk — always add escalation
    if risk_level == "HIGH" and len(recommendations) > 0:
        recommendations.insert(0, {
            "id": "PRIORITY_ESCALATION",
            "title": "Escalate to Retention Specialist",
            "description": "Customer is at HIGH risk. Assign to a dedicated retention agent for immediate outreach.",
            "category": "Escalation",
            "priority": "URGENT",
            "estimated_impact": "Increases retention rate by ~35% for high-risk customers",
            "action": "ESCALATE_NOW"
        })

    return recommendations[:5]
