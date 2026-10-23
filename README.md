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

All models evaluated via **5-Fold Stratified Cross-Validation on the training split (n=5,634)** and verified on an **unseen holdout (n=1,409)** at the standard $p \ge 0.5$ operating threshold:

| Model Architecture | 5-Fold CV ROC-AUC | Holdout ROC-AUC | Holdout Precision | Holdout Recall | Holdout F1 | Operating Profile |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Logistic Regression** | 0.846 ± 0.012 | 0.841 | 0.503 | **0.783** | 0.613 | High recall; broader boundary with higher false alarm rate. |
| **Random Forest** | 0.847 ± 0.010 | 0.843 | 0.520 | **0.789** | 0.627 | Strong recall with non-linear tree splits. |
| **Regularized XGBoost** | 0.849 ± 0.011 | **0.846** | **0.563** | 0.741 | **0.640** | L1/L2 regularization (`reg_alpha=0.6`, `reg_lambda=1.5`) suppresses noise. |
| **RF + XGBoost Soft-Voting Ensemble** ⭐ | **0.849 ± 0.010** | **0.846** | **0.558** | 0.743 | **0.638** | **Production Deployed**: Balanced operating point with optimal F1 stability. |

### 💡 Interview Defense: Model Selection & Empirical Findings
- **Statistical Parity on Ranking Quality**: All models achieve nearly identical cross-validation ROC-AUC ($0.85 \pm 0.01$), meaning global rank-ordering capability is comparable across architectures.
- **Operating Trade-offs**: The true differentiator is position on the precision-recall curve. Tree models (RF) capture more raw churners (~79% recall at ~0.52 precision), while regularized XGBoost and the soft-voting ensemble tighten the boundary (~74% recall at ~0.56 precision), reducing unneeded retention offers.
- **Production Choice**: The **Soft-Voting Ensemble** is deployed as default for balanced operating performance, with the ability to tune the decision threshold dynamically based on acquisition-to-retention cost ratios.

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
RetainPulse-AI/
├── backend/                        # Node.js + Express Gateway
│   ├── src/
│   │   ├── config/                 # MongoDB Atlas connection (db.js)
│   │   ├── controllers/            # AI, Customer, Prediction, Analytics controllers
│   │   ├── middleware/             # Error handlers, rate limiters, security
│   │   ├── models/                 # Mongoose schemas (Customer, Prediction, ActivityLog)
│   │   ├── routes/                 # Express REST API routes (dashboard, customers, predictions, reports, ai)
│   │   └── scripts/                # Database seeding pipeline (seed.js)
│   ├── package.json
│   └── server.js                   # Express server entry point & middleware configuration
├── frontend/                       # React 18 + Vite Frontend
│   ├── src/
│   │   ├── components/             # UI components (Header, Sidebar, Layout, MetricCard)
│   │   ├── pages/                  # Dashboard, Customers, Predict, Simulator, ModelStudio, Copilot, Reports
│   │   ├── services/               # Centralized Axios API service layer (api.js)
│   │   ├── App.jsx                 # Client-side routing & page providers
│   │   └── main.jsx
│   ├── index.html                  # Single-page application entry point
│   ├── package.json
│   └── vite.config.js              # Vite bundler configuration
├── ml-service/                     # FastAPI Python Microservice
│   ├── services/
│   │   ├── predictor.py            # Multi-model inference & What-If simulation engine
│   │   ├── explainer.py            # SHAP value extraction & feature attribution
│   │   ├── groq_service.py         # Groq Cloud LLM retention co-pilot & fallback engine
│   │   └── analytics.py            # Churn statistical aggregations
│   ├── main.py                     # FastAPI microservice bootstrap & REST endpoints
│   └── requirements.txt            # Python dependencies (FastAPI, scikit-learn, shap, groq)
├── data/
│   └── Telco_Customer_Churn.csv    # Authentic IBM Telco dataset (7,043 records, 21 attributes)
├── models/
│   ├── logistic_model.pkl          # Serialized Logistic Regression pipeline
│   ├── rf_model.pkl                # Serialized Random Forest pipeline (Production default)
│   └── xgb_model.pkl               # Serialized XGBoost pipeline
├── notebooks/
│   └── Customer_Churn_Prediction.ipynb  # End-to-end EDA, SMOTE, and model experimentation
├── train.py                        # Standalone pipeline training & ColumnTransformer serialization
├── requirements.txt                # Root Python dependencies
└── README.md                       # Complete platform documentation & setup guide
```

---

## 📄 License
MIT License — Built for placement presentation and portfolio showcase.
