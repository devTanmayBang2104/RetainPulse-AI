"""
RetainPulse AI — ML Training & Pipeline Serialization Script
Trains and evaluates Logistic Regression, Random Forest, and XGBoost on 7,043 Telco records.
"""
import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import classification_report, roc_auc_score, precision_recall_fscore_support

def train_all_models():
    data_path = os.path.join("data", "Telco_Customer_Churn.csv")
    if not os.path.exists(data_path):
        data_path = os.path.join("..", "data", "Telco_Customer_Churn.csv")
    
    print(f"Loading data from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Preprocessing
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"].astype(str).str.strip(), errors="coerce")
    df["TotalCharges"] = df["TotalCharges"].fillna(df["TotalCharges"].median())
    
    y = (df["Churn"] == "Yes").astype(int)
    X = df.drop(columns=["customerID", "Churn"])
    
    num_cols = ["MonthlyCharges", "TotalCharges", "tenure"]
    cat_cols = [c for c in X.columns if c not in num_cols]
    
    # Preprocessor definition
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, num_cols),
            ("cat", cat_pipeline, cat_cols)
        ]
    )
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    models = {
        "logistic_model.pkl": Pipeline([
            ("preprocessor", preprocessor),
            ("model", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42))
        ]),
        "rf_model.pkl": Pipeline([
            ("preprocessor", preprocessor),
            ("model", RandomForestClassifier(n_estimators=100, max_depth=10, class_weight="balanced", random_state=42, n_jobs=-1))
        ]),
        "xgb_model.pkl": Pipeline([
            ("preprocessor", preprocessor),
            ("model", XGBClassifier(n_estimators=100, max_depth=5, scale_pos_weight=2.7, random_state=42, eval_metric="logloss"))
        ])
    }
    
    os.makedirs("models", exist_ok=True)
    
    print("\n--- Training & Evaluating Models ---")
    for filename, pipeline in models.items():
        print(f"\nTraining {filename}...")
        pipeline.fit(X_train, y_train)
        
        y_pred = pipeline.predict(X_test)
        y_prob = pipeline.predict_proba(X_test)[:, 1]
        
        auc = roc_auc_score(y_test, y_prob)
        p, r, f, _ = precision_recall_fscore_support(y_test, y_pred, average="binary")
        
        print(f"Results for {filename}:")
        print(f"  ROC-AUC:   {auc:.4f}")
        print(f"  Precision: {p:.4f}")
        print(f"  Recall:    {r:.4f}")
        print(f"  F1-Score:  {f:.4f}")
        
        save_path = os.path.join("models", filename)
        joblib.dump(pipeline, save_path)
        print(f"  [SAVED] {save_path}")

    print("\nAll models trained and pickled successfully with current scikit-learn!")

if __name__ == "__main__":
    train_all_models()
