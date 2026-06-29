# PROJECT REPORT: UPI FRAUD DETECTION SYSTEM (THE SENTINEL)

**Project Title:** The Sentinel: Real-Time UPI Fraud Detection using XGBoost and Explainable AI  
**Version:** 1.0  
**Date:** April 2026  

---

## ABSTRACT

The rapid adoption of Unified Payments Interface (UPI) in India has led to a significant increase in digital payment frauds, including vishing, QR code scams, and account takeovers. This project proposes "The Sentinel," an end-to-end fraud detection system comprising a high-performance Machine Learning (ML) model, a FastAPI-based backend, and a cross-platform React Native mobile application. The core detection engine utilizes an XGBoost classifier trained on a synthetic dataset of 100,000 transactions, grounded in statistical distributions from RBI, NPCI, and PwC reports. To address the "black-box" nature of ML, the system integrates Explainable AI (XAI) using Principal Component Analysis (PCA) mapping to provide human-readable explanations for every fraud alert. Experimental results demonstrate a ROC-AUC of 0.9876 and an accuracy of 98.60%, providing a robust and transparent solution for securing digital transactions.

---

## I. INTRODUCTION

Unified Payments Interface (UPI) has revolutionized the Indian economy, processing billions of transactions monthly. However, this growth has been shadowed by sophisticated fraudulent activities. Traditional rule-based fraud detection systems often fail to keep pace with evolving attack vectors. This project addresses this gap by implementing a proactive, real-time fraud detection mobile application. 

The Sentinel allows users to scan any UPI QR code before authorizing a payment. The system analyzes 17 distinct features—including transaction velocity, amount ratios, device signatures, and behavioral signals—to predict fraud. Key innovations include the use of SMOTE for handling class imbalance and a custom XAI module that translates complex model weights into plain English warnings.

---

## II. SYSTEM ARCHITECTURE

The system follows a classic client-server architecture optimized for low-latency inference:

1.  **Mobile Client (Frontend):** Developed using React Native and Expo. It handles user authentication (Firebase), QR code scanning, and result visualization.
2.  **API Gateway (Backend):** Built with FastAPI and hosted on Render.com. It serves as the bridge between the mobile app and the ML model.
3.  **ML Inference Engine:** A pipeline consisting of data imputation, scaling, PCA transformation, and the XGBoost classifier.
4.  **Data Layer:** Firebase Firestore is used to store user transaction history and XAI-generated explanations.

---

## III. PROPOSED METHODOLOGY

### A. Dataset and Feature Engineering
The model is trained on a dataset of 1,00,000 transactions with a 5% fraud rate. Features were engineered to capture common UPI fraud patterns:
*   **Numerical Features:** Transaction amount, `Amount_vs_User_Avg_Ratio`, `Transaction_Frequency_24h`, `Failed_PIN_Attempts`, and `Hour`.
*   **Binary Features:** `Is_New_Device`, `Is_New_Beneficiary`, `Is_QR_Transaction`, `Location_Mismatch`, and `Is_First_Time_User`.
*   **Categorical Features:** `UPI_App`, `Transaction_Type`, `Device_OS`, and `Transaction_State`.

### B. Machine Learning Pipeline
The pipeline involves several critical steps:
1.  **Imputation:** Median imputation for missing numerical data.
2.  **Synthetic Minority Over-sampling Technique (SMOTE):** Balances the 95:5 class ratio to 1:1 during training.
3.  **Standardization:** Zero-mean, unit-variance scaling.
4.  **Principal Component Analysis (PCA):** Dimensionality reduction retaining 95% variance (17 components).
5.  **XGBoost Classifier:** Sequential tree-based ensemble with 200 estimators and a max depth of 6.

### C. Decision Threshold Tuning
The default classification threshold is set to **0.869**, optimized for high precision (93.80%) to minimize "false alarms" which disrupt user experience, while maintaining a robust recall of 77.10%.

---

## IV. EXPLAINABLE AI (XAI) IMPLEMENTATION

One of the project's primary goals is transparency. The XAI module works by:
1.  Mapping PCA components back to original features using absolute weights in the PCA transformation matrix.
2.  Identifying the top 3-5 features contributing to a specific prediction's risk score.
3.  Generating rule-based natural language explanations.
    *   *Example:* "Amount is 8x higher than your usual spending and transaction was initiated from an unrecognized device."

---

## V. MOBILE APPLICATION DEVELOPMENT

### A. Design Philosophy: The Sentinel Aesthetic
The UI/UX follows "The Vigilant Ghost" persona—invisible during safe operations but authoritative during alerts. 
*   **Tonal Architecture:** Boundaries defined by background color shifts rather than borders.
*   **Glassmorphism:** Used for critical alerts and floating modals.
*   **Typography:** Manrope for headlines (authority) and Inter for body text (legibility).

### B. Core Features
*   **QR Scanning:** Real-time decoding of UPI URIs (`upi://pay...`).
*   **User Authentication:** Secure email/password login via Firebase Auth.
*   **History Screen:** Persistent storage of past scans with detailed XAI reports in Firestore.
*   **Real-time Feedback:** Visual status indicators (Safe, Warning, Danger) with risk percentage scores.

---

## VI. RESULTS AND PERFORMANCE ANALYSIS

The model was evaluated on a held-out test set of 20,000 transactions:

| Metric | Value |
|---|---|
| ROC-AUC | 0.9876 |
| Accuracy | 98.60% |
| Precision | 93.80% |
| Recall | 77.10% |
| F1 Score | 84.63% |

The high Precision ensures that when a user is warned of fraud, the model is highly confident, preventing unnecessary panic.

---

## VII. CONCLUSION AND FUTURE WORK

The Sentinel demonstrates that high-performance fraud detection can be coupled with human-centric design and explainability. By integrating XGBoost with a mobile-first approach, the project provides a practical tool for the average UPI user.

**Future Enhancements:**
*   **Federated Learning:** Training on-device to preserve user privacy.
*   **Deepfake Voice Detection:** Integrating audio analysis to prevent vishing scams.
*   **Offline Mode:** Lightweight model deployment for low-connectivity environments.

---

## VIII. REFERENCES

1.  Reserve Bank of India (RBI), "Annual Report FY2023-24," Payment and Settlement Systems.
2.  PwC India, "Combating Payments Fraud in India," April 2025.
3.  NPCI, "UPI Circular on Fraud Risk Management and Device Binding Guidelines."
4.  Chen, T. & Guestrin, C., "XGBoost: A Scalable Tree Boosting System," KDD 2016.
5.  Chawla, N.V. et al., "SMOTE: Synthetic Minority Over-sampling Technique," JAIR 2002.
