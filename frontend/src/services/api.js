// src/services/api.js
import axios from 'axios';

// Default to localhost:8000 if env variable is not set
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global Error Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.request);
    }
    return Promise.reject(error);
  }
);

// ===== User Management Endpoints =====
export const userAPI = {
  // Create a new user - POST /users/
  create: (userData) => api.post('/users/', userData),
  
  // Get user by ID - GET /users/{user_id}
  get: (userId) => api.get(`/users/${userId}`),
  
  // Update user - PUT /users/{user_id}
  update: (userId, userData) => api.put(`/users/${userId}`, userData),
  
  // Delete user - DELETE /users/{user_id}
  delete: (userId) => api.delete(`/users/${userId}`),
  
  // List all users - GET /users/
  list: (skip = 0, limit = 100) => api.get('/users/', { params: { skip, limit } }),
};

// ===== Chat Endpoints =====
export const chatAPI = {
  // Send a message - POST /chat/send
  send: (userId, message) => api.post('/chat/send', { 
    user_id: userId, 
    message: message 
  }),
  
  // Get chat history - GET /chat/history/{user_id}
  getHistory: (userId, limit = 100, skip = 0) => 
    api.get(`/chat/history/${userId}`, { params: { limit, skip } }),
  
  // Initialize chat with welcome message - POST /chat/initialize/{user_id}
  initialize: (userId) => api.post(`/chat/initialize/${userId}`),
  
  // Clear chat history - DELETE /chat/history/{user_id}
  clearHistory: (userId) => api.delete(`/chat/history/${userId}`),
};

// ===== Medication Endpoints =====
export const medicationAPI = {
  // Create medication - POST /calendar/medications
  create: (medicationData) => api.post('/calendar/medications', medicationData),
  
  // Get all medications for user - GET /calendar/medications/{user_id}
  getAll: (userId, activeOnly = true) => 
    api.get(`/calendar/medications/${userId}`, { params: { active_only: activeOnly } }),
  
  // Update medication - PUT /calendar/medications/{medication_id}
  update: (medicationId, updateData) => 
    api.put(`/calendar/medications/${medicationId}`, updateData),
  
  // Delete medication (soft delete) - DELETE /calendar/medications/{medication_id}
  delete: (medicationId) => 
    api.delete(`/calendar/medications/${medicationId}`),
  
  // Track medication taken - POST /calendar/medications/track
  track: (trackData) => api.post('/calendar/medications/track', trackData),
  
  // Get medication tracking history - GET /calendar/medications/track/{user_id}
  getTracking: (userId, startDate = null, endDate = null) => 
    api.get(`/calendar/medications/track/${userId}`, {
      params: { 
        start_date: startDate, 
        end_date: endDate 
      }
    }),
};

// ===== Mood Tracking Endpoints =====
export const moodAPI = {
  // Create mood entry - POST /calendar/mood
  create: (moodData) => api.post('/calendar/mood', moodData),
  
  // Get mood entries - GET /calendar/mood/{user_id}
  getAll: (userId, startDate = null, endDate = null, limit = 30) => 
    api.get(`/calendar/mood/${userId}`, {
      params: { 
        start_date: startDate, 
        end_date: endDate, 
        limit 
      }
    }),
};

// ===== Calendar View Endpoint =====
export const calendarAPI = {
  // Get calendar view for a month - GET /calendar/view/{user_id}
  getView: (userId, month, year) => 
    api.get(`/calendar/view/${userId}`, { params: { month, year } }),
};

// ===== Health Conditions Endpoints =====
export const healthConditionsAPI = {
  // Create health condition - POST /health/conditions
  create: (conditionData) => api.post('/health/conditions', conditionData),
  
  // Get health conditions - GET /health/conditions/{user_id}
  getAll: (userId, activeOnly = true) => 
    api.get(`/health/conditions/${userId}`, { params: { active_only: activeOnly } }),
  
  // Update health condition - PUT /health/conditions/{condition_id}
  update: (conditionId, updateData) => 
    api.put(`/health/conditions/${conditionId}`, updateData),
  
  // Delete health condition (soft delete) - DELETE /health/conditions/{condition_id}
  delete: (conditionId) => 
    api.delete(`/health/conditions/${conditionId}`),
};

// ===== Health Report & Summary Endpoints =====
export const healthAPI = {
  // Generate health report - POST /health/report
  generateReport: (userId, startDate = null, endDate = null) => 
    api.post('/health/report', { 
      user_id: userId, 
      start_date: startDate, 
      end_date: endDate 
    }),
  
  // Get health summary - GET /health/summary/{user_id}
  getSummary: (userId) => api.get(`/health/summary/${userId}`),
};

export default api;