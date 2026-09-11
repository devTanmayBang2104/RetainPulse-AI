# RetainPulse AI — Churn Prediction & AI Retention Platform

> **An enterprise-grade, full-stack machine learning and LLM retention intelligence platform** built on a **MERN + FastAPI microservices architecture**. Features multi-model classification (**Random Forest, Logistic Regression, XGBoost**), SHAP explainability, interactive What-If scenario simulations, and a **Groq-hosted Llama-3 AI retention strategy co-pilot**.

---

## 🏛️ System Architecture

```
                                  +-------------------------------------------------+
                                  |         React 18 + Vite + Tailwind CSS          |
                                  |  (Dashboard, SHAP Visualizer, What-If Studio,   |
                                  |   Customer Profiler, AI Retention Co-Pilot)     |
                                  +-----------------------+-------------------------+
                                                          |
                                            REST API / JWT Auth / Axios
                                                          |
                                                          v
                                  +-------------------------------------------------+
                                  |          Node.js + Express.js API Gateway       |
                                  |  (Auth, User/Customer CRUD, CSV Batch Pipeline, |
                                  |   Auditing, MongoDB Synchronization, Proxy)     |
                                  +------------+--------------------+---------------+
                                               |                    |
                                       Mongoose|                    | Internal REST API
                                               v                    v
                            +-----------------------+   +-------------------------------+
                            |     MongoDB Atlas     |   |       FastAPI ML Microservice |
                            | (Users, Customers,    |   | (XGBoost, Random Forest,      |
                            |  Simulations, Logs)   |   |  SHAP TreeExplainer Engine,   |
                            +-----------------------+   |  Groq Llama-3 Retention Agent)|
                                                        +---------------+---------------+
                                                                        |
                                                                        v
                                                        +-------------------------------+
                                                        |        Groq Cloud API         |
                                                        |   (Llama-3.3-70B / 8B for     |
                                                        |    Instant Action Playbooks)  |
                                                        +-------------------------------+
```

---

## ✨ Key Features & Innovation

1. **Multi-Model Benchmark & Precision Optimization**:
   - Compares **Logistic Regression**, **Random Forest**, and **XGBoost** trained on 7,043 customer records (IBM Telco Churn dataset) with SMOTE class balancing.
   - **Production Default**: Random Forest selected for superior **Precision (0.56) and F1-Score (0.65)**, drastically cutting expensive false-positive retention credits while capturing **78% of genuine churners**.
2. **SHAP-Based Explainability (XAI)**:
   - Dynamic local attribution highlighting top factors pushing customer churn risk up (e.g., *Month-to-Month contract*, *High monthly charges*) vs. down (e.g., *Long tenure*, *TechSupport bundle*).
3. **Interactive What-If Scenario Studio**:
   - Real-time parameter sliders allowing retention agents to simulate contract changes and discounts, computing the projected churn probability delta before executing an offer.
4. **Groq Llama-3 AI Retention Agent**:
   - Sub-second generation of personalized, commercial retention playbooks, ROI savings estimates, and outreach communication copy signed by Customer Success.
   - Hardened rule-based fallback ensuring zero downtime even in offline or unconfigured environments.
5. **Batch Ingestion & Executive Analytics**:
   - One-click CSV cohort scoring, exportable churn audit reports, and deep demographic segmentation.

---

## 📊 Machine Learning Model Benchmarks

| Model | ROC-AUC | F1-Score | Precision | Recall | Primary Role / Trade-off |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Logistic Regression** | **0.86** | 0.64 | 0.52 | **0.84** | Baseline interpretable linear model; catches highest raw churners but suffers from false positives. |
| **Random Forest** ⭐ | 0.85 | **0.65** | **0.56** | 0.78 | **Production Default**: Highest precision and F1-score; optimizes retention budget ROI. |
| **XGBoost** | 0.85 | 0.63 | 0.55 | 0.75 | Gradient boosting pipeline with `scale_pos_weight` for class imbalance. |

### 💡 Interview Talking Point: The "Why Random Forest over Highest AUC?" Defense
- **ROC-AUC vs. Operational Threshold**: ROC-AUC measures aggregate rank-ordering power across all possible thresholds (where Logistic Regression scores 0.86). However, in enterprise deployment, the model operates at a *fixed decision threshold ($p \ge 0.5$)*.
- **Cost Asymmetry**: In telecom customer retention, False Positives waste expensive \$15–\$30/mo retention discounts and agent outreach on customers who were never going to leave.
- **Economic Decision**: At the operating decision boundary, Random Forest delivers the highest precision (0.56) and F1-score (0.65), saving company capital while capturing 78% of genuine churners.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** >= 18
- **Python** >= 3.9
- **MongoDB** running locally or free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)

---

### Step 1: Start the FastAPI ML Microservice
```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- API Swagger Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

---

### Step 2: Start the Express Backend Gateway
```bash
cd backend
cp .env.example .env
npm install
npm run seed      # Seeds MongoDB with Telco CSV data (7,043 customers)
npm run dev
```
- API Gateway: `http://localhost:5000`
- Health Check: `http://localhost:5000/health`

---

### Step 3: Start the React + Vite Frontend
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🔑 Environment Variables Matrix

| Service | File | Key | Description |
| :--- | :--- | :--- | :--- |
| **ML Microservice** | `ml-service/.env` | `GROQ_API_KEY` | *(Optional)* Groq Cloud Key from [console.groq.com](https://console.groq.com) for Llama-3 playbooks (has offline fallback). |
| **Backend Gateway** | `backend/.env` | `MONGO_URI` | MongoDB Connection String (`mongodb://localhost:27017/retainpulse`). |
| **Backend Gateway** | `backend/.env` | `ML_SERVICE_URL` | Microservice URL (`http://localhost:8000`). |
| **Frontend** | `frontend/.env` | `VITE_API_BASE_URL` | Express API Gateway (`http://localhost:5000/api`). |

---

## 📁 Repository Structure

```
ML+DA/
├── data/
│   └── Telco_Customer_Churn.csv    # 7,043 customer records, 21 telecom attributes
├── models/
│   ├── logistic_model.pkl          # Pickled Logistic Regression pipeline
│   ├── rf_model.pkl                # Pickled Random Forest pipeline
│   └── xgb_model.pkl               # Pickled XGBoost pipeline
├── notebooks/
│   └── Customer_Churn_Prediction.ipynb  # End-to-end EDA, SMOTE, Model Training
├── ml-service/                     # FastAPI Python Microservice
│   ├── main.py                     # App bootstrap & REST endpoints
│   ├── services/
│   │   ├── predictor.py            # Model inference, What-If simulation
│   │   ├── explainer.py            # SHAP value extraction & attribution
│   │   ├── groq_service.py         # Groq Llama-3 AI retention co-pilot
│   │   └── analytics.py            # Churn statistical aggregations
│   └── requirements.txt
├── backend/                        # Node.js + Express Gateway
│   ├── server.js                   # Server bootstrap & CORS
│   └── src/
│       ├── controllers/            # AI, Customer, Prediction, Analytics controllers
│       ├── models/                 # Mongoose schemas (Customer, Prediction, ActivityLog)
│       └── routes/                 # Express API routes
└── frontend/                       # React 18 + Vite Frontend
    ├── src/
    │   ├── components/             # Reusable UI components & layouts
    │   ├── pages/                  # Dashboard, Predict, Simulator, ModelStudio, Copilot
    │   └── services/               # Axios API client
    └── package.json
```

---

## 📄 License
MIT License — Built for placement presentation and portfolio showcase.
