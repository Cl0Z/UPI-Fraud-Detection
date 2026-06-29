/**
 * API service — communicates with the FastAPI backend.
 *
 * Change BASE_URL to your deployed Render.com URL for production,
 * or use your local IP for Expo Go testing (not localhost).
 */

import axios from 'axios';

// ⚠️  For Expo Go on a physical device, replace with your PC's LAN IP.
//     e.g. 'http://192.168.1.7:8000'
const BASE_URL = 'http://192.168.1.7:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Send transaction data to the ML backend for fraud prediction.
 *
 * @param {object} transactionData — 17-feature object
 * @returns {Promise<{prediction: string, probability: number, risk: string}>}
 */
export async function predictFraud(transactionData) {
  try {
    const response = await api.post('/predict', transactionData);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || 'Server error');
    } else if (error.request) {
      throw new Error('Network error — is the backend running?');
    } else {
      throw new Error(error.message);
    }
  }
}

export default api;
