# UPI Fraud Detection App — Tech Stack & Services

## Mobile App

| Layer | Technology | Purpose |
|---|---|---|
| Framework | React Native | Cross-platform mobile development |
| Dev Toolchain | Expo | Simplified build & development on Windows |
| QR Scanning | expo-barcode-scanner | Scan & decode UPI QR codes |
| Camera Access | expo-camera | Device camera integration |
| HTTP Client | Axios | Send POST requests to backend API |
| Navigation | React Navigation (Stack) | Screen-to-screen navigation |
| UI Components | React Native Paper | Pre-built UI components |
| State Management | React Hooks | Local component state |

---

## Backend API

| Layer | Technology | Purpose |
|---|---|---|
| Language | Python 3 | Backend language |
| API Framework | FastAPI | REST API server |
| Web Server | Uvicorn | ASGI server to run FastAPI |
| Input Validation | Pydantic | Validate incoming request data |
| Model Loading | Joblib | Load saved .pkl files |
| Data Processing | Pandas | Structure input features into DataFrame |
| Numerical Processing | NumPy | Array operations |
| CORS | FastAPI CORSMiddleware | Allow requests from mobile app |

---

## Machine Learning Pipeline

| Layer | Technology | Purpose |
|---|---|---|
| ML Library | Scikit-learn | StandardScaler + PCA |
| Model | XGBoost | Fraud classification |
| Preprocessing | StandardScaler | Normalize numerical features |
| Dimensionality Reduction | PCA (95% variance) | Reduce 17 features to principal components |
| Model Serialization | Joblib (.pkl) | Save and load all 3 pipeline objects |

---

## Hosting & Deployment

| What | Service | Plan | Cost |
|---|---|---|---|
| Backend API hosting | Render.com | Free tier | ₹0 |
| Source code & model files | GitHub | Free | ₹0 |
| App testing on device | Expo Go (Android app) | Free | ₹0 |
| APK build & distribution | Expo EAS Build | Free tier | ₹0 |

---

## Development Tools (Windows)

| Tool | Purpose |
|---|---|
| Node.js | Required to run Expo CLI |
| Python 3 | Backend development |
| Git | Version control & GitHub push |
| Jupyter Notebook / Google Colab | Model training & saving .pkl files |
| VS Code | Code editor |
| Command Prompt / PowerShell | Running Expo and backend locally |

---

## Total Infrastructure Cost: ₹0
