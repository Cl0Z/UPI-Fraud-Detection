"""
UPI Fraud Detection — FastAPI Backend
Loads pre-trained ML pipeline (.pkl files) and exposes a /predict endpoint.
Includes XAI: per-prediction feature importance + plain English explanations.
"""

import os
from datetime import datetime
from typing import List, Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── Paths ────────────────────────────────────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "model")

# ─── Load pipeline components at startup ──────────────────────────────────────
model        = joblib.load(os.path.join(MODEL_DIR, "xgboost_model.pkl"))
imputer      = joblib.load(os.path.join(MODEL_DIR, "imputer.pkl"))
scaler       = joblib.load(os.path.join(MODEL_DIR, "scaler.pkl"))
pca          = joblib.load(os.path.join(MODEL_DIR, "pca.pkl"))
le_dict      = joblib.load(os.path.join(MODEL_DIR, "label_encoders.pkl"))
FEATURE_COLS = joblib.load(os.path.join(MODEL_DIR, "feature_cols.pkl"))
threshold    = joblib.load(os.path.join(MODEL_DIR, "threshold.pkl"))

print(f"[OK] Model loaded  |  Features: {len(FEATURE_COLS)}  |  Threshold: {threshold:.4f}")
print(f"[OK] Feature order: {FEATURE_COLS}")

# ─── XAI: Human-readable feature labels ──────────────────────────────────────
FEATURE_DISPLAY_NAMES = {
    "UPI_App":                   "UPI app used",
    "Transaction_Type":          "Transaction type",
    "Transaction_Status":        "Transaction status",
    "Transaction_State":         "Transaction state",
    "Device_OS":                 "Device operating system",
    "Transaction_Frequency_24h": "Transaction frequency (last 24h)",
    "Amount_vs_User_Avg_Ratio":  "Amount vs user average",
    "Days_Since_Last_Txn":       "Days since last transaction",
    "Failed_PIN_Attempts":       "Failed PIN attempts",
    "Is_New_Beneficiary":        "New beneficiary",
    "Is_New_Device":             "New device",
    "Is_First_Time_User":        "First time UPI user",
    "Is_QR_Transaction":         "QR code transaction",
    "Location_Mismatch":         "Location mismatch",
    "Is_Weekend":                "Weekend transaction",
    "IsWeekend":                 "Weekend transaction",
    "Hour":                      "Hour of transaction",
    "amount":                    "Transaction amount",
    "DayOfWeek":                 "Day of week",
    "Month":                     "Month of transaction",
}

# ─── XAI: PCA component → dominant original feature mapping ──────────────────
# For each PCA component, find which original feature contributes most to it
pca_component_to_feature = []
for i in range(pca.components_.shape[0]):
    dominant_idx = int(np.argmax(np.abs(pca.components_[i])))
    feature_name = FEATURE_COLS[dominant_idx] if dominant_idx < len(FEATURE_COLS) else f"feature_{dominant_idx}"
    pca_component_to_feature.append(feature_name)

print(f"[OK] PCA->Feature mapping: {pca_component_to_feature}")


def get_top_features(n: int = 5) -> List[str]:
    """Return top N most important original feature names based on model feature importances."""
    importances = model.feature_importances_
    sorted_indices = np.argsort(importances)[::-1]

    # Features to hide from the user-facing explanation
    EXCLUDED = {"Failed PIN attempts", "Weekend transaction", "QR code transaction"}

    seen = set()
    top = []
    for idx in sorted_indices:
        if idx < len(pca_component_to_feature):
            feat = pca_component_to_feature[idx]
            if feat not in seen:
                seen.add(feat)
                display = FEATURE_DISPLAY_NAMES.get(feat, feat)
                if display in EXCLUDED:
                    continue
                top.append(display)
                if len(top) >= n:
                    break
    return top


def generate_explanation(top_features: List[str], raw_input: dict, is_fraud: bool) -> str:
    """Generate a plain English explanation based on top features and actual input values."""
    reasons = []

    # Map display names back for value lookups
    ratio = raw_input.get("Amount_vs_User_Avg_Ratio", 1.0)
    amount = raw_input.get("amount", 0)
    new_device = raw_input.get("Is_New_Device", 0)
    loc_mismatch = raw_input.get("Location_Mismatch", 0)
    new_beneficiary = raw_input.get("Is_New_Beneficiary", 0)
    failed_pin = raw_input.get("Failed_PIN_Attempts", 0)
    freq_24h = raw_input.get("Transaction_Frequency_24h", 1)
    first_time = raw_input.get("Is_First_Time_User", 0)
    days_since = raw_input.get("Days_Since_Last_Txn", 1)
    hour = raw_input.get("Hour", 12)
    is_weekend = raw_input.get("Is_Weekend", 0) or raw_input.get("IsWeekend", 0)

    # Check each feature for trigger conditions
    if ratio > 2:
        reasons.append(f"Amount is {ratio:.1f}x higher than your usual spending")
    elif ratio < 0.3 and ratio > 0:
        reasons.append("Amount is unusually low compared to your average")

    if new_device == 1:
        reasons.append("Transaction initiated from an unrecognized device")

    if loc_mismatch == 1:
        reasons.append("Transaction location does not match your registered location")

    if new_beneficiary == 1:
        reasons.append("First time paying this recipient")


    if freq_24h > 5:
        reasons.append("Unusually high number of transactions in the last 24 hours")

    if first_time == 1:
        reasons.append("Account has no prior UPI transaction history")

    if days_since > 30:
        reasons.append(f"No transactions in over {int(days_since)} days before this")

    if hour < 5 or hour > 23:
        reasons.append(f"Transaction made at an unusual hour ({hour}:00)")


    if amount > 10000:
        reasons.append(f"High transaction amount (₹{amount:,.0f})")

    if not is_fraud:
        if not reasons:
            return "No major risk factors detected."
        else:
            return f"Minor flag: {reasons[0].lower()}, but overall risk is low."

    # For fraud: pick top 3 reasons
    reasons = reasons[:3]

    if not reasons:
        return "The model detected suspicious patterns in the transaction data."

    if len(reasons) == 1:
        return reasons[0] + "."
    elif len(reasons) == 2:
        return f"{reasons[0]} and {reasons[1].lower()}."
    else:
        return f"{reasons[0]}, {reasons[1].lower()}, and {reasons[2].lower()}."


# ─── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="UPI Fraud Detection API",
    description="Real-time UPI transaction fraud detection using XGBoost",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response schemas ───────────────────────────────────────────────
class TransactionInput(BaseModel):
    """
    Transaction features sent from the mobile app.
    DayOfWeek, Month, IsWeekend are auto-computed from the current timestamp.
    """

    # Numerical features
    amount: float = Field(..., description="Transaction amount in INR")
    Amount_vs_User_Avg_Ratio: float = Field(
        1.0, description="Ratio of this txn to user's 30-day average"
    )
    Transaction_Frequency_24h: int = Field(
        1, description="Transactions from same device in last 24h"
    )
    Days_Since_Last_Txn: float = Field(
        1.0, description="Days since account's last transaction"
    )
    Failed_PIN_Attempts: int = Field(
        0, description="Failed PIN/OTP attempts before success"
    )
    Hour: int = Field(..., description="Hour of transaction (0-23)")

    # Binary features (0 or 1)
    Is_New_Beneficiary: int = Field(0)
    Is_New_Device: int = Field(0)
    Is_First_Time_User: int = Field(0)
    Is_QR_Transaction: int = Field(1)
    Location_Mismatch: int = Field(0)
    Is_Weekend: int = Field(0)

    # Categorical features
    UPI_App: str = Field("PhonePe")
    Transaction_Type: str = Field("Merchant_Payment")
    Transaction_Status: str = Field("Success")
    Transaction_State: str = Field("Maharashtra")
    Device_OS: str = Field("Android")


class PredictionResponse(BaseModel):
    prediction: str
    probability: float
    risk: str
    top_features: List[str]
    explanation: str


# ─── Prediction logic ────────────────────────────────────────────────────────
def run_prediction(data: TransactionInput) -> dict:
    """Run the full ML pipeline on a single transaction + generate explanation."""

    raw = data.model_dump()

    # Auto-compute time-derived features from current moment
    now = datetime.now()
    raw["DayOfWeek"] = now.weekday()          # 0=Mon … 6=Sun
    raw["Month"]     = now.month              # 1-12
    raw["IsWeekend"] = 1 if now.weekday() >= 5 else 0

    # Build single-row DataFrame
    row = pd.DataFrame([raw])

    # Step 1 — Label-encode categoricals
    for col, le in le_dict.items():
        if col in row.columns:
            val = str(row[col].iloc[0])
            # Handle unseen labels gracefully — map to most frequent class
            if val in le.classes_:
                row[col] = le.transform([val])
            else:
                row[col] = le.transform([le.classes_[0]])

    # Step 2 — Ensure feature order matches training
    row = row[FEATURE_COLS]

    # Step 3 — Impute → Scale → PCA
    row_imp    = imputer.transform(row)
    row_scaled = scaler.transform(row_imp)
    row_pca    = pca.transform(row_scaled)

    # Step 4 — Predict
    prob  = float(model.predict_proba(row_pca)[0, 1])
    label = "FRAUD" if prob >= threshold else "LEGITIMATE"
    risk  = "HIGH" if prob >= 0.7 else ("MEDIUM" if prob >= threshold else "LOW")
    is_fraud = label == "FRAUD"

    # Step 5 — XAI: top features + explanation
    top_features = get_top_features(5)
    explanation  = generate_explanation(top_features, raw, is_fraud)

    return {
        "prediction":   label,
        "probability":  round(prob, 4),
        "risk":         risk,
        "top_features": top_features,
        "explanation":  explanation,
    }


# ─── Endpoints ────────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": True,
        "threshold": float(threshold),
        "features": len(FEATURE_COLS),
    }


@app.post("/predict", response_model=PredictionResponse)
def predict(transaction: TransactionInput):
    try:
        result = run_prediction(transaction)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
