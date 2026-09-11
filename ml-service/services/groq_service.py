"""
Groq LLM Retention Strategy Service — RetainPulse AI
Generates sub-second personalized retention recommendations & outreach copy using Groq Cloud (Llama 3).
Includes resilient offline fallback for interview demos or disconnected environments.
"""
import os
import json
from typing import Dict, Any, List, Optional
import httpx

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqRetentionService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "")

    def generate_strategy(
        self,
        customer: Dict[str, Any],
        churn_prob: float,
        risk_level: str,
        top_shap_factors: Optional[List[Dict[str, Any]]] = None,
        model_name: str = "qwen/qwen3.8-27b"
    ) -> Dict[str, Any]:
        """
        Generate structured retention action plan using Groq Llama-3 or offline fallback.
        """
        top_factors_str = ""
        if top_shap_factors:
            top_factors_str = ", ".join([
                f"{f.get('feature', 'Feature')} ({f.get('impact', 'HIGH')} impact)"
                for f in top_shap_factors[:3]
            ])

        # If no key available, generate rich deterministic fallback
        if not self.api_key:
            return self._generate_fallback(customer, churn_prob, risk_level)

        prompt = f"""You are the Customer Retention Director at RetainPulse AI Telecom.
Analyze this subscriber profile and output a tailored, highly actionable retention playbook.

SUBSCRIBER DETAILS:
- Contract: {customer.get('Contract', 'Month-to-month')}
- Tenure: {customer.get('tenure', 1)} months
- Monthly Charges: ${customer.get('MonthlyCharges', 70)}
- Internet Service: {customer.get('InternetService', 'Fiber optic')}
- Tech Support: {customer.get('TechSupport', 'No')}
- Online Security: {customer.get('OnlineSecurity', 'No')}
- Payment Method: {customer.get('PaymentMethod', 'Electronic check')}
- Churn Risk: {risk_level} ({(churn_prob * 100):.1f}% churn probability)
- Key Risk Drivers from SHAP: {top_factors_str or 'Month-to-month contract, High monthly charges'}

INSTRUCTIONS:
1. Provide a concise 2-sentence executive risk diagnostic.
2. Formulate a specific, commercially viable retention incentive (e.g. 15-20% discount on 1-yr contract conversion, or 6 months free Tech Support bundle).
3. Write a personalized, professional outreach email signed by Sarah Jenkins, Customer Success Director, RetainPulse AI Telecom (NO generic placeholders).
4. Provide 4 concrete sequential action steps for the retention representative.

Return ONLY a valid JSON object matching this schema:
{{
  "risk_diagnostic": "string",
  "recommended_incentive": "string",
  "projected_churn_reduction": "string",
  "outreach_email": "string",
  "action_steps": ["step 1", "step 2", "step 3", "step 4"]
}}"""

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1000,
                "temperature": 0.6,
                "response_format": {"type": "json_object"}
            }

            with httpx.Client(timeout=15.0) as client:
                resp = client.post(GROQ_API_URL, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    return {
                        "success": True,
                        "source": f"Groq Cloud ({model_name})",
                        "data": parsed
                    }
                else:
                    return self._generate_fallback(customer, churn_prob, risk_level)
        except Exception:
            return self._generate_fallback(customer, churn_prob, risk_level)

    def _generate_fallback(
        self,
        customer: Dict[str, Any],
        churn_prob: float,
        risk_level: str
    ) -> Dict[str, Any]:
        """Hardened rule-based fallback strategy."""
        monthly = customer.get("MonthlyCharges", 70.0)
        contract = customer.get("Contract", "Month-to-month")
        tenure = customer.get("tenure", 1)
        prob_pct = f"{(churn_prob * 100):.1f}%"

        discount_monthly = round(monthly * 0.8, 2)
        annual_savings = round((monthly - discount_monthly) * 12, 2)

        if contract == "Month-to-month":
            incentive = f"Upgrade to 1-Year Contract with 20% loyalty discount (${discount_monthly}/mo, saving ${annual_savings}/yr) + 6 months free TechSupport"
            reduction = "Reduces estimated churn risk by ~30–35%"
            action_1 = "Call subscriber to present 1-year loyalty agreement with guaranteed rate lock"
        else:
            incentive = f"Apply 15% VIP Loyalty Credit (${round(monthly*0.85, 2)}/mo for 6 months) and complimentary security bundle"
            reduction = "Reduces estimated churn risk by ~20–25%"
            action_1 = "Apply VIP account credit and schedule satisfaction review"

        diagnostic = (
            f"Subscriber exhibits a {prob_pct} churn probability ({risk_level} Risk). "
            f"Key risk triggers include {contract.lower()} commitment, {tenure} months tenure, "
            f"and unbundled monthly spend of ${monthly}."
        )

        email = (
            f"Subject: Special Loyalty Savings on Your RetainPulse Plan\n\n"
            f"Dear Valued Customer,\n\n"
            f"Thank you for being a subscriber with RetainPulse. As part of our customer commitment program, "
            f"we would like to offer you an exclusive renewal package:\n\n"
            f"• Rate Guarantee: {incentive}\n"
            f"• 24/7 Priority Support: Free 6-month access to our dedicated technical team\n\n"
            f"To activate this offer immediately, please reply to this email or reach out to our team.\n\n"
            f"Sincerely,\n\n"
            f"Sarah Jenkins\n"
            f"Customer Success Director\n"
            f"RetainPulse AI Telecom"
        )

        return {
            "success": True,
            "source": "RetainPulse Expert Strategy Engine (Offline / Fallback)",
            "data": {
                "risk_diagnostic": diagnostic,
                "recommended_incentive": incentive,
                "projected_churn_reduction": reduction,
                "outreach_email": email,
                "action_steps": [
                    action_1,
                    "Activate complimentary Security & Tech Support package in CRM",
                    "Assist subscriber in enrolling in paperless auto-pay for an additional $5/mo credit",
                    "Log retention outreach status in audit logs and schedule 30-day follow-up"
                ]
            }
        }
