# Mobile Application (MVP) – React Native

## Overview

The mobile application is developed using **React Native** and serves as the primary user interface for the UPI fraud detection system.

The MVP focuses on a single core capability:

> Scan a UPI QR code → Analyze it using an ML model → Instantly warn the user if the transaction is fraudulent.

The app is designed to be simple, fast, and lightweight, prioritizing real-time fraud detection over complex UI features.

---

## MVP Goals

- Scan UPI QR codes using the device camera
- Extract transaction parameters from QR data
- Send extracted data to backend ML API
- Display fraud/legitimate prediction clearly
- Maintain low latency and minimal user interaction

---

## Target Platform

- Android (primary)
- iOS (optional)

---

## MVP Feature Set

### 1. QR Code Scanning Module

**Purpose:** Enable QR scanning using mobile camera.

**Implementation:**
- `react-native-camera` or `react-native-vision-camera`
- QR decoding via `vision-camera-code-scanner` or ZXing

**Functionality:**
- Open camera screen
- Detect QR automatically
- Extract raw UPI URI string

**Example:**
```
upi://pay?pa=merchant@upi&pn=Merchant&am=500&cu=INR
```

---

### 2. QR Data Parsing Module

**Purpose:** Convert raw QR string into structured data.

**Extracted Fields:**
- UPI ID (pa)
- Merchant Name (pn)
- Amount (am)
- Currency (cu)
- Timestamp (generated locally)

**Implementation:**
- `URLSearchParams` parsing
- Validation for malformed data

**Example Output:**
```json
{
  "upi_id": "merchant@upi",
  "merchant_name": "Merchant",
  "amount": 500,
  "currency": "INR",
  "timestamp": "2026-02-11T10:30:00"
}
```

---

### 3. Fraud Detection API Integration

**Purpose:** Send transaction data to backend ML model.

**Implementation:**
- POST request using Axios or Fetch
- REST API (Flask/FastAPI)

**Request:**
```json
{
  "upi_id": "merchant@upi",
  "amount": 500,
  "hour": 10,
  "transaction_frequency": 3
}
```

**Response:**
```json
{
  "prediction": "fraud",
  "risk_score": 0.91
}
```

---

### 4. Prediction Result Screen

**Purpose:** Display fraud detection result clearly.

#### Legitimate Transaction
- Green UI
- Message: "This transaction appears safe."

#### Fraudulent Transaction
- Red UI
- Message: "Potential fraud detected. Do not proceed."

**Optional:**
- Risk score percentage
- Short explanation

---

### 5. Error Handling

**Handled Cases:**
- Invalid QR
- Network failure
- Backend unavailable
- Malformed data

**User Feedback:**
- Toast or alert message

---

## App Navigation

```
Home Screen
   ↓
QR Scanner
   ↓
Processing (Loading)
   ↓
Result Screen
```

---

## Technology Stack

### Core
- React Native (JavaScript/TypeScript)
- Expo (optional)

### QR Scanning
- react-native-vision-camera
- vision-camera-code-scanner / ZXing

### Networking
- Axios / Fetch API

### State Management
- React Hooks
- Context API (optional)

### UI
- React Native Paper / Native Base

---

## Security & Privacy

- No sensitive data stored locally
- No UPI payment execution
- HTTPS communication
- Data anonymization

---

## MVP Non-Goals

- Payment execution
- User authentication
- Transaction history
- Advanced analytics
- Offline ML

---

## Why React Native

- Single codebase (Android + iOS)
- Fast development
- Strong ecosystem
- Easy backend integration

---

## MVP Summary

The mobile app acts as a lightweight client that:
- Scans QR codes
- Sends data to ML backend
- Displays fraud prediction instantly

This MVP is practical, scalable, and suitable for a final-year project.

