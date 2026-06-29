# Implementation Guide — Fraud Explanation Feature
### UPI Fraud Detection App (XGBoost + FastAPI + React Native)

---

## Overview

This guide adds fraud explanations to your existing app. Every scan result will now include:

1. **Top contributing features** — which specific factors triggered the fraud prediction
2. **Plain English summary** — a human-readable sentence explaining why the transaction was flagged

Explanations appear on both the **Result Screen** (immediately after scanning) and the **History Screen** (when tapping a past scan).

---

## How It Works (Concept)

Your XGBoost model was trained on PCA-transformed features. After predicting, XGBoost can tell you which PCA components it weighted most heavily. You then map those components back to the original feature names, pick the top 3-5, and generate a plain English sentence from them.

The full pipeline per prediction:

```
Raw Input (17 features)
        ↓
StandardScaler → PCA → XGBoost predicts fraud/legitimate
        ↓
XGBoost also outputs: which PCA components mattered most
        ↓
Map PCA components → original feature names
        ↓
Pick top 3-5 features → generate explanation sentence
        ↓
Return prediction + risk score + top features + explanation
```

---

## Part 1 — Backend Changes (main.py)

This is the most important part. All explanation logic lives in the backend.

### Step 1 — Understand the PCA-to-Feature Mapping

When PCA transforms your 17 features into 17 principal components, each component is a weighted combination of all original features. To map back, you look at which original features have the highest absolute weight in each PCA component. This is stored in `pca.components_` — a matrix of shape (17 components × 17 features).

You do this mapping **once at server startup**, not on every request. It is computed from the already-loaded PCA object.

### Step 2 — Define Feature Display Names

Your 17 original features have technical column names. You need a dictionary that maps each column name to a short, human-readable label that will appear in the app. Define this mapping at the top of `main.py`.

The mapping should cover all 17 features:

| Column Name | Human-Readable Label |
|---|---|
| UPI_App | UPI app used |
| Transaction_Type | Transaction type |
| Transaction_Status | Transaction status |
| Transaction_State | Transaction state |
| Device_OS | Device operating system |
| Transaction_Frequency_24h | Transaction frequency (last 24h) |
| Amount_vs_User_Avg_Ratio | Amount vs user average |
| Days_Since_Last_Txn | Days since last transaction |
| Failed_PIN_Attempts | Failed PIN attempts |
| Is_New_Beneficiary | New beneficiary |
| Is_New_Device | New device |
| Is_First_Time_User | First time UPI user |
| Is_QR_Transaction | QR code transaction |
| Location_Mismatch | Location mismatch |
| Is_Weekend | Weekend transaction |
| Hour | Hour of transaction |
| amount | Transaction amount |

### Step 3 — Build the Feature Importance Extractor

At server startup (after loading scaler, pca, model), compute the mapping from PCA components to original features. For each of the 17 PCA components, find which original feature contributes most to it (highest absolute value in `pca.components_[component_index]`).

Store this as a simple list of length 17 where index `i` gives you the original feature name most associated with PCA component `i`.

### Step 4 — Extract Top Features Per Prediction

XGBoost's `predict_proba` gives you the risk score. For feature importance per individual prediction, use the model's `feature_importances_` attribute combined with the PCA component-to-feature mapping.

The process:
1. Get `model.feature_importances_` — an array of length 17 (one importance score per PCA component)
2. Sort by importance descending
3. Take the top 5 component indices
4. Map each component index to its original feature name using the mapping from Step 3
5. Return those feature names as a list

### Step 5 — Rule-Based Explanation Generator

Write a function `generate_explanation(top_features, input_data, is_fraud)` that takes the list of top feature names and the original input values and returns a plain English string.

The function works by checking each feature name and building a sentence based on the actual value:

**Logic for each feature:**

- `Amount_vs_User_Avg_Ratio` → if value > 2: *"Amount is {value}x higher than your usual spending"* / if value < 0.3: *"Amount is unusually low"*
- `Is_New_Device` → if 1: *"Transaction initiated from an unrecognized device"*
- `Location_Mismatch` → if 1: *"Transaction location does not match your registered location"*
- `Is_New_Beneficiary` → if 1: *"First time paying this recipient"*
- `Failed_PIN_Attempts` → if > 0: *"There were {value} failed PIN attempts before this transaction"*
- `Transaction_Frequency_24h` → if > 5: *"Unusually high number of transactions in the last 24 hours"*
- `Is_First_Time_User` → if 1: *"Account has no prior UPI transaction history"*
- `Days_Since_Last_Txn` → if > 30: *"No transactions in over {value} days before this"*
- `Hour` → if < 5 or > 23: *"Transaction made at an unusual hour ({value}:00)"*
- `Is_Weekend` → if 1: *"Transaction made on a weekend"*
- `Transaction_Status` → if "failed": *"Transaction had a failed status"*

For features that are categorical or have neutral values, skip them and move to the next one.

Build a list of triggered reason strings, take the top 3, and join them into a sentence:

- 1 reason: return it as-is with a period
- 2 reasons: join with *" and "*
- 3 reasons: join with *", "* and *", and "* before the last one

**For legitimate transactions**, use a softer tone:
- *"No major risk factors detected."*
- Or if some mild factors exist: *"Minor flag: {reason}, but overall risk is low."*

### Step 6 — Update the API Response

In your `/predict` endpoint, after getting the prediction and risk score, call both new functions and add their output to the response:

The updated response should look like this:

```json
{
  "prediction": "fraud",
  "risk_score": 0.91,
  "is_fraud": true,
  "top_features": [
    "Amount vs user average",
    "New device",
    "Location mismatch"
  ],
  "explanation": "Amount is 8x higher than your usual spending, transaction initiated from an unrecognized device, and transaction location does not match your registered location."
}
```

### Step 7 — Redeploy to Render.com

After updating `main.py`:
1. Save the file
2. `git add .` → `git commit -m "Add fraud explanation to predict endpoint"` → `git push`
3. Render.com will auto-redeploy within 1-2 minutes
4. Test the updated endpoint by visiting `https://your-api.onrender.com/docs` — Swagger UI lets you send a test request and see the new fields in the response

---

## Part 2 — Firestore Changes

You need to save the explanation alongside the existing scan data so it can be shown in the History screen later.

### What to Add to saveScan()

In your `historyService.js`, update the `saveScan()` function to also store:
- `topFeatures` — the array of top feature label strings
- `explanation` — the plain English explanation string

Both values come from the API response, which now includes them. Pass them from the Result Screen just like you pass `riskScore` and `prediction`.

No changes needed to Firestore rules or indexes — you are just adding two new fields to existing documents.

---

## Part 3 — Result Screen Changes

The Result Screen already shows verdict (fraud/legitimate) and risk score. You now add an explanation section below the risk score.

### New UI Section — "Why this looks suspicious"

Add a new card/section below the risk score area with:

**Header:**
- If fraud: *"Why this looks suspicious"* with a warning icon
- If legitimate: *"Why this appears safe"* with a checkmark icon

**Top Features List:**
Display each item in `top_features` as a row with:
- A colored dot or icon (red for fraud, green for legitimate)
- The feature label text

**Explanation Text:**
Below the feature list, show the full `explanation` string in a smaller font as a paragraph.

### Visual Layout for Result Screen

```
┌─────────────────────────────────┐
│  ⚠️  FRAUD DETECTED             │
│  Risk Score: 91%                │
│                                 │
│  ── Why this looks suspicious ──│
│  🔴 Amount vs user average      │
│  🔴 New device                  │
│  🔴 Location mismatch           │
│                                 │
│  Amount is 8x higher than your  │
│  usual spending, transaction     │
│  from unrecognized device, and  │
│  location mismatch detected.    │
│                                 │
│       [ Scan Another ]          │
└─────────────────────────────────┘
```

### Handling Loading State

The explanation arrives with the API response — there is no separate loading step. The entire result (verdict + score + features + explanation) arrives together, so your existing loading screen covers it automatically.

### Handling Missing Explanation

In case the API response does not include `explanation` or `top_features` (e.g., older responses stored before this update), always check for their existence before rendering. Show nothing rather than crashing if they are absent.

---

## Part 4 — History Screen Changes

When a user taps a past scan in the history list, show a detail view or expanded card with the explanation.

### Option A — Expandable Card (Simpler)

Each history item in the list is a card. When tapped, it expands in place to show the explanation and top features below the existing info. Tap again to collapse. This requires no new screen or navigation.

### Option B — Detail Screen (Cleaner)

Tapping a history item navigates to a new `ScanDetailScreen` that shows the full scan information including explanation. Add this screen to your navigation stack.

**Recommended: Option A** for simplicity since you already have navigation set up and adding another screen adds complexity.

### What to Display in Expanded Card

When expanded, show below the existing verdict/score/date:

```
┌─────────────────────────────────────┐
│ Zomato  •  ₹4500  •  14 Apr, 10:30  │
│ 🔴 FRAUD  •  Risk: 91%              │
│ ▼ (tapped to expand)                │
│ ─────────────────────────────────── │
│ Why flagged:                        │
│  • Amount vs user average           │
│  • New device                       │
│  • Location mismatch                │
│                                     │
│ Amount is 8x higher than your usual │
│ spending, transaction from an       │
│ unrecognized device, and location   │
│ mismatch detected.                  │
└─────────────────────────────────────┘
```

### Handling Old Scan Records

Scans saved before this feature was added will not have `topFeatures` or `explanation` in Firestore. When rendering, check if these fields exist. If they don't, show a small note: *"Explanation not available for this scan."* Do not crash or show an empty section.

---

## Part 5 — Updated Data Flow

Here is the complete updated flow from scan to history:

```
QR Scanned
      ↓
POST /predict  →  FastAPI
      ↓
Scaler → PCA → XGBoost
      ↓
Extract top features via PCA component mapping
      ↓
Generate plain English explanation
      ↓
Return: { prediction, risk_score, is_fraud, top_features, explanation }
      ↓
Result Screen displays verdict + features + explanation
      ↓
saveScan() writes to Firestore:
  { userId, merchant, amount, prediction, riskScore,
    isFraud, timestamp, topFeatures, explanation }
      ↓
History Screen fetches scans → shows explanation on tap
```

---

## Part 6 — Testing Checklist

| # | Test | Expected Result |
|---|---|---|
| 1 | Scan a QR with high amount | Explanation mentions amount ratio |
| 2 | Scan any QR on weekend after midnight | Hour or weekend mentioned in explanation |
| 3 | Check Result Screen | Top features list and explanation paragraph both visible |
| 4 | Open History Screen | Past scans visible |
| 5 | Tap a past fraud scan | Expands to show top features and explanation |
| 6 | Tap a past legitimate scan | Expands to show safe explanation |
| 7 | Tap an old scan (before this update) | Shows "Explanation not available" gracefully |
| 8 | Test with a low-risk scan | Explanation uses softer tone |

---

## Part 7 — What Does NOT Change

- QR scanning and parsing logic
- Authentication (Firebase Auth)
- Firestore security rules
- The ML pipeline itself (scaler, PCA, XGBoost model files)
- Report fraud feature
- Navigation structure (no new screens needed if using Option A)

---

## Summary of Changes

| File | Status | What changes |
|---|---|---|
| `main.py` | Updated | PCA-to-feature mapping, top feature extractor, explanation generator, updated response |
| `services/historyService.js` | Updated | Save `topFeatures` and `explanation` to Firestore |
| `screens/ResultScreen.js` | Updated | Add explanation section UI below risk score |
| `screens/HistoryScreen.js` | Updated | Expandable card showing explanation on tap |
| Model files (`.pkl`) | No change | — |
| Firebase / Firestore | No change | — |
| `screens/ScannerScreen.js` | No change | — |
| `services/api.js` | No change | — |

---

## Why This Is Impressive for Your Viva

Explainability is a major research area in ML called **XAI (Explainable Artificial Intelligence)**. Most student projects show a black-box prediction with a number. Yours will show *why* the model made that decision in plain language. Evaluators will almost certainly ask *"how does your model work?"* — and you can point directly at the screen and explain each contributing factor. This demonstrates understanding of both the ML internals and real-world user experience design.
