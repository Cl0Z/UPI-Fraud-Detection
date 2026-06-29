# Implementation Guide — Authentication & Scan History
### UPI Fraud Detection App (React Native + Expo + Firebase)

---

## Overview

This guide walks you through adding two features to your existing MVP:

1. **Firebase Authentication** — Email/password login and registration
2. **Scan History** — Store and display each user's past fraud scan results using Firestore

Both features use **Firebase**, which is free and requires no new hosting setup.

---

## Part 0 — Firebase Project Setup

This is a one-time setup before writing any code.

### Step 1 — Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add Project"**
3. Enter a project name (e.g. `upi-fraud-detection`)
4. Disable Google Analytics (not needed) and click **Create Project**
5. Wait for the project to be created, then click **Continue**

### Step 2 — Register Your Android App

1. On the Firebase project dashboard, click the **Android icon** (to add an app)
2. For **Android package name**, enter: `com.yourname.upifraud` (must match your `app.json` in Expo — check the `android.package` field)
3. Enter a nickname (e.g. `UPI Fraud App`)
4. Click **Register App**
5. Download the `google-services.json` file — **save this, you will need it**
6. Skip the remaining steps in Firebase Console (Expo handles the SDK setup differently)

### Step 3 — Enable Email/Password Authentication

1. In Firebase Console, go to **Build → Authentication** in the left sidebar
2. Click **Get Started**
3. Under **Sign-in method**, click **Email/Password**
4. Toggle **Enable** to ON
5. Click **Save**

### Step 4 — Create Firestore Database

1. In Firebase Console, go to **Build → Firestore Database**
2. Click **Create Database**
3. Select **Start in test mode** (allows read/write without rules — fine for academic project)
4. Choose a server location (select `asia-south1` for Mumbai — closest to India)
5. Click **Enable**

---

## Part 1 — Install Firebase in Your Expo Project

### Step 1 — Install the Firebase JavaScript SDK

Open Command Prompt in your project folder and run:

```
npm install firebase
```

This installs the Firebase web/JS SDK which works with Expo without any native build configuration.

### Step 2 — Place google-services.json

Copy the `google-services.json` file you downloaded earlier into the **root of your Expo project** (same level as `App.js` and `package.json`).

Then open your `app.json` file and add the following inside the `"android"` section:

```
"googleServicesFile": "./google-services.json"
```

### Step 3 — Create Firebase Config File

Create a new file at `config/firebaseConfig.js` in your project. You will fill this file with your Firebase project credentials.

To get your credentials:
1. Go to Firebase Console → Project Settings (gear icon) → General tab
2. Scroll down to **Your apps** → click your Android app
3. You will see a `firebaseConfig` object with `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId`
4. Copy these values into your `firebaseConfig.js` file

This file initializes Firebase Auth and Firestore so they can be imported and used anywhere in your app.

---

## Part 2 — Updated Project Structure

After adding authentication and history, your project should look like this:

```
upi-fraud-app/
├── config/
│   └── firebaseConfig.js        ← Firebase initialization
├── screens/
│   ├── LoginScreen.js           ← NEW
│   ├── RegisterScreen.js        ← NEW
│   ├── HomeScreen.js            ← UPDATED (add logout + history button)
│   ├── ScannerScreen.js         ← UPDATED (save result after scan)
│   ├── LoadingScreen.js         ← unchanged
│   ├── ResultScreen.js          ← UPDATED (trigger Firestore save)
│   └── HistoryScreen.js         ← NEW
├── services/
│   ├── api.js                   ← unchanged
│   └── historyService.js        ← NEW (Firestore read/write functions)
├── App.js                       ← UPDATED (new navigation structure)
├── app.json
└── package.json
```

---

## Part 3 — Navigation Structure Changes

Your current navigation is a simple linear stack:

```
Home → Scanner → Loading → Result
```

After adding auth and history, it becomes a two-level structure:

```
Auth Stack (shown when user is NOT logged in)
├── Login Screen
└── Register Screen

App Stack (shown when user IS logged in)
├── Home Screen
├── Scanner Screen
├── Loading Screen
├── Result Screen
└── History Screen
```

### How the Switch Works

In your `App.js`, you listen to Firebase Auth's `onAuthStateChanged` listener. This fires every time the login state changes. If a user is logged in, you render the App Stack. If not, you render the Auth Stack. Firebase automatically persists the login session on the device, so users stay logged in even after closing the app.

---

## Part 4 — Authentication Implementation

### Login Screen

**What this screen contains:**
- Email input field
- Password input field
- A **Login** button
- A link/button that says **"Don't have an account? Register"**

**What happens when Login is pressed:**
1. You call Firebase Auth's `signInWithEmailAndPassword(email, password)` function
2. If successful, `onAuthStateChanged` in `App.js` fires automatically and switches the user to the App Stack — you do not need to navigate manually
3. If it fails (wrong password, user doesn't exist), show an error message to the user like `"Invalid email or password"`

**Validation to add before calling Firebase:**
- Both fields must not be empty
- Email must contain `@` and `.`
- Show an inline error message if validation fails

### Register Screen

**What this screen contains:**
- Email input field
- Password input field
- Confirm Password input field
- A **Register** button
- A link that says **"Already have an account? Login"**

**What happens when Register is pressed:**
1. Check that password and confirm password match — if not, show `"Passwords do not match"`
2. Call Firebase Auth's `createUserWithEmailAndPassword(email, password)` function
3. If successful, Firebase automatically logs the user in and `onAuthStateChanged` switches them to the App Stack
4. If it fails (email already in use, weak password), show the Firebase error message to the user

**Password rules Firebase enforces by default:**
- Minimum 6 characters
- No other restrictions (you can add more on your side if desired)

### Logout

**Where to add it:** Add a logout button or icon on the Home Screen (top right corner works well).

**What it does:** Calls Firebase Auth's `signOut()` function. This clears the session and `onAuthStateChanged` fires, switching the user back to the Auth Stack automatically.

### Getting the Current User

Anywhere in your app where you need to know who is logged in (e.g., when saving a scan to Firestore), call `firebase.auth().currentUser`. This returns the user object which contains `uid` (a unique ID string) and `email`. The `uid` is what you use to associate scan records with a specific user in Firestore.

---

## Part 5 — Scan History Implementation

### Firestore Data Structure

Firestore is a NoSQL document database organized as **Collections → Documents**.

Your scan history will be stored like this:

```
scanHistory/                        ← Collection
    {auto-generated-doc-id}/        ← Document (one per scan)
        userId: "firebase-uid"
        merchantName: "Zomato"
        amount: 350
        prediction: "legitimate"
        riskScore: 0.12
        isfraud: false
        timestamp: 2026-04-14T10:30:00
```

Every scan document is stored in the `scanHistory` collection. Each document has the user's `uid` so you can filter and fetch only that user's scans.

### Saving a Scan (historyService.js)

Create a file `services/historyService.js` with two functions:

**Function 1 — `saveScan(userId, scanData)`**

This function takes the user's Firebase UID and the scan result object, then writes a new document to the `scanHistory` collection in Firestore. It adds a server-side timestamp automatically.

Call this function from your **Result Screen**, right after the prediction result is received and displayed. Pass `firebase.auth().currentUser.uid` as the `userId`.

**Function 2 — `getUserScans(userId)`**

This function queries Firestore for all documents in `scanHistory` where `userId` equals the given UID, ordered by timestamp descending (newest first). It returns an array of scan objects.

Call this function from your **History Screen** when the screen loads.

### Result Screen Changes

After displaying the fraud prediction, call `saveScan()` with:
- `userId` from `firebase.auth().currentUser.uid`
- `merchantName` from the parsed QR data
- `amount` from the parsed QR data
- `prediction` from the API response (`"fraud"` or `"legitimate"`)
- `riskScore` from the API response
- `isFraud` boolean from the API response

Do this in a `useEffect` or right after the navigation to the Result Screen. Wrap it in a try/catch so that if Firestore fails, it does not crash the app — just silently log the error since this is non-critical.

### History Screen

**What this screen shows:**
A scrollable list of the user's past scans, each displayed as a card showing:
- Merchant name
- Amount (₹)
- Result badge — green "Safe" or red "Fraud"
- Risk score percentage
- Date and time of scan

**How it loads data:**
1. When the screen mounts (using `useEffect`), call `getUserScans(userId)`
2. Show a loading spinner while fetching
3. Once data arrives, render it in a `FlatList`
4. If the list is empty, show a message like `"No scans yet. Start scanning to see history."`

**How to reach this screen:**
Add a **"View History"** button or a history icon on the Home Screen that navigates to `HistoryScreen`.

---

## Part 6 — Firestore Security Rules

Since you created the database in **test mode**, all reads and writes are currently open to anyone. For a more secure setup (recommended even for academic projects), update the Firestore rules in Firebase Console under **Firestore → Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scanHistory/{document} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

**What this rule means:** A user can only read or write a scan document if they are logged in AND the document's `userId` field matches their own UID. This prevents any user from reading another user's scan history.

To apply: paste the rules in Firebase Console → Firestore → Rules → click **Publish**.

---

## Part 7 — Testing Checklist

Work through these in order:

| # | Test | Expected Result |
|---|---|---|
| 1 | Open app fresh (not logged in) | Login screen appears |
| 2 | Register with a new email | Redirected to Home screen |
| 3 | Logout and log back in | Works, redirected to Home |
| 4 | Login with wrong password | Error message shown |
| 5 | Scan a QR code | Result screen shows prediction |
| 6 | Open History screen | The scan just done appears in list |
| 7 | Scan 3 more QR codes | All 4 appear in history, newest first |
| 8 | Logout, log in as different account | History shows only that account's scans |
| 9 | Close app completely and reopen | Still logged in, no login screen |

---

## Part 8 — What Does NOT Change

These parts of your existing MVP remain exactly the same:

- QR scanning logic
- UPI string parsing
- The FastAPI backend and `/predict` endpoint
- The ML pipeline (scaler → PCA → XGBoost)
- Render.com deployment
- The visual design of Scanner, Loading, and Result screens

Authentication and History are entirely additive — you are not replacing anything, only extending.

---

## Summary of New Files and Changes

| File | Status | What changes |
|---|---|---|
| `config/firebaseConfig.js` | New | Firebase initialization |
| `screens/LoginScreen.js` | New | Email/password login UI |
| `screens/RegisterScreen.js` | New | Registration UI |
| `screens/HistoryScreen.js` | New | Display past scans |
| `services/historyService.js` | New | Firestore read/write functions |
| `App.js` | Updated | Auth state listener + two navigation stacks |
| `screens/HomeScreen.js` | Updated | Add logout button + history navigation |
| `screens/ResultScreen.js` | Updated | Call saveScan after prediction |
| `screens/ScannerScreen.js` | No change | — |
| `services/api.js` | No change | — |
| Backend (`main.py`) | No change | — |

---

## Additional Notes

**On Expo Go vs Production Build:** Firebase Auth and Firestore work perfectly with Expo Go during development. No special native build is needed.

**On the free tier limits:** Firebase Spark (free) plan allows 10,000 Authentication users/month and 50,000 Firestore reads + 20,000 writes per day. For an academic project with a handful of users, you will never come close to these limits.

**On error handling:** Always wrap Firebase calls in try/catch blocks. Common errors to handle are `auth/email-already-in-use`, `auth/wrong-password`, `auth/user-not-found`, and `auth/network-request-failed`. Firebase error objects contain a `code` property you can switch on to show user-friendly messages.
