# Frontend Integration Guide

This guide explains how to integrate the Care Bear backend API with your React frontend.

## Setup

### 1. Install Axios (or fetch API)
```bash
npm install axios
```

### 2. Create API Service File

Create `src/services/api.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User APIs
export const userAPI = {
  create: (userData) => api.post('/users/', userData),
  get: (userId) => api.get(`/users/${userId}`),
  update: (userId, userData) => api.put(`/users/${userId}`, userData),
  delete: (userId) => api.delete(`/users/${userId}`),
  list: () => api.get('/users/'),
};

// Chat APIs
export const chatAPI = {
  send: (userId, message) => 
    api.post('/chat/send', { user_id: userId, message }),
  getHistory: (userId, limit = 100) => 
    api.get(`/chat/history/${userId}`, { params: { limit } }),
  initialize: (userId) => 
    api.post(`/chat/initialize/${userId}`),
  clearHistory: (userId) => 
    api.delete(`/chat/history/${userId}`),
};

// Medication APIs
export const medicationAPI = {
  create: (medicationData) => 
    api.post('/calendar/medications', medicationData),
  getAll: (userId, activeOnly = true) => 
    api.get(`/calendar/medications/${userId}`, { params: { active_only: activeOnly } }),
  update: (medicationId, updateData) => 
    api.put(`/calendar/medications/${medicationId}`, updateData),
  delete: (medicationId) => 
    api.delete(`/calendar/medications/${medicationId}`),
  track: (trackData) => 
    api.post('/calendar/medications/track', trackData),
  getTracking: (userId, startDate, endDate) => 
    api.get(`/calendar/medications/track/${userId}`, {
      params: { start_date: startDate, end_date: endDate }
    }),
};

// Mood APIs
export const moodAPI = {
  create: (moodData) => api.post('/calendar/mood', moodData),
  getAll: (userId, startDate, endDate, limit = 30) => 
    api.get(`/calendar/mood/${userId}`, {
      params: { start_date: startDate, end_date: endDate, limit }
    }),
};

// Calendar API
export const calendarAPI = {
  getView: (userId, month, year) => 
    api.get(`/calendar/view/${userId}`, { params: { month, year } }),
};

// Health APIs
export const healthAPI = {
  createCondition: (conditionData) => 
    api.post('/health/conditions', conditionData),
  getConditions: (userId, activeOnly = true) => 
    api.get(`/health/conditions/${userId}`, { params: { active_only: activeOnly } }),
  updateCondition: (conditionId, updateData) => 
    api.put(`/health/conditions/${conditionId}`, updateData),
  deleteCondition: (conditionId) => 
    api.delete(`/health/conditions/${conditionId}`),
  generateReport: (userId, startDate, endDate) => 
    api.post('/health/report', { user_id: userId, start_date: startDate, end_date: endDate }),
  getSummary: (userId) => 
    api.get(`/health/summary/${userId}`),
};

export default api;
```

## Example Usage in Components

### 1. Onboarding Flow Integration

Update `OnboardingFlow.jsx`:

```javascript
import { userAPI } from '../services/api';

const handleOnboardingComplete = async (data) => {
  try {
    // Generate unique user ID
    const userId = `user_${Date.now()}`;
    
    const userData = {
      user_id: userId,
      personal_info: data.personalInfo,
      medical_history: data.medicalHistory,
      health_status: data.healthStatus,
      family_history: data.familyHistory,
      emergency_contact: data.emergencyContact,
    };
    
    // Create user in backend
    const response = await userAPI.create(userData);
    
    // Save user ID in localStorage
    localStorage.setItem('userId', userId);
    
    // Initialize chat
    await chatAPI.initialize(userId);
    
    onComplete(response.data);
  } catch (error) {
    console.error('Error creating user:', error);
    // Handle error (show message to user)
  }
};
```

### 2. Chat Integration

Update `ChatHomepage.jsx`:

```javascript
import { chatAPI } from '../services/api';

const handleSendMessage = async () => {
  if (!inputMessage.trim()) return;

  const userMessage = {
    id: Date.now(),
    sender: 'user',
    text: inputMessage,
    timestamp: new Date().toISOString(),
  };

  setMessages(prev => [...prev, userMessage]);
  setInputMessage('');
  setIsTyping(true);

  try {
    const userId = localStorage.getItem('userId');
    const response = await chatAPI.send(userId, inputMessage);
    
    const bearMessage = {
      id: response.data.message_id,
      sender: 'bear',
      text: response.data.bear_response,
      timestamp: response.data.timestamp,
    };

    setMessages(prev => [...prev, bearMessage]);
  } catch (error) {
    console.error('Error sending message:', error);
    // Handle error
  } finally {
    setIsTyping(false);
  }
};

// Load chat history on mount
useEffect(() => {
  const loadChatHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await chatAPI.getHistory(userId);
      
      const formattedMessages = response.data.messages.map(msg => ({
        id: msg.message_id,
        sender: msg.sender,
        text: msg.message,
        timestamp: msg.timestamp,
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  loadChatHistory();
}, []);
```

### 3. Calendar Integration

Update `CalendarPage.jsx`:

```javascript
import { medicationAPI, calendarAPI } from '../services/api';

// Add medication
const addMedication = async () => {
  try {
    const userId = localStorage.getItem('userId');
    
    const medicationData = {
      user_id: userId,
      name: newMedication.name,
      dosage: newMedication.dosage,
      time: newMedication.time,
      frequency: newMedication.frequency,
    };
    
    const response = await medicationAPI.create(medicationData);
    
    setMedications(prev => [...prev, response.data]);
    setShowAddModal(false);
  } catch (error) {
    console.error('Error adding medication:', error);
  }
};

// Track medication taken
const toggleMedicationTaken = async (medicationId, date) => {
  try {
    const userId = localStorage.getItem('userId');
    
    await medicationAPI.track({
      user_id: userId,
      medication_id: medicationId,
      date: date,
      taken: true,
      time_taken: new Date().toISOString(),
    });
    
    // Update UI
    setMedications(prev => 
      prev.map(med => 
        med.medication_id === medicationId 
          ? { ...med, taken: { ...med.taken, [date]: true } }
          : med
      )
    );
  } catch (error) {
    console.error('Error tracking medication:', error);
  }
};

// Load calendar data
useEffect(() => {
  const loadCalendarData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await calendarAPI.getView(
        userId, 
        currentDate.getMonth() + 1, 
        currentDate.getFullYear()
      );
      
      // Process and display calendar data
      console.log('Calendar data:', response.data);
    } catch (error) {
      console.error('Error loading calendar:', error);
    }
  };

  loadCalendarData();
}, [currentDate]);
```

### 4. Profile Page Integration

Update `ProfilePage.jsx`:

```javascript
import { userAPI, healthAPI } from '../services/api';

// Generate health report
const generateReport = async () => {
  try {
    const userId = localStorage.getItem('userId');
    const response = await healthAPI.generateReport(userId);
    
    const report = response.data;
    
    // Create downloadable text file
    const reportText = `
CARE BEAR HEALTH REPORT
Generated: ${new Date(report.generated_at).toLocaleString()}

... (format report data)
    `;
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CareBear_Report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  } catch (error) {
    console.error('Error generating report:', error);
  }
};

// Update user data
const handleSave = async () => {
  try {
    const userId = localStorage.getItem('userId');
    
    const updateData = {
      personal_info: editedData.personalInfo,
      medical_history: editedData.medicalHistory,
      health_status: editedData.healthStatus,
      family_history: editedData.familyHistory,
      emergency_contact: editedData.emergencyContact,
    };
    
    await userAPI.update(userId, updateData);
    setIsEditing(false);
  } catch (error) {
    console.error('Error updating user:', error);
  }
};
```

## Error Handling

Add global error interceptor:

```javascript
// In api.js
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
      
      if (error.response.status === 404) {
        // Handle not found
      } else if (error.response.status === 500) {
        // Handle server error
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request);
    }
    
    return Promise.reject(error);
  }
);
```

## Testing the Integration

1. Start the backend:
```bash
cd care-bear-backend
python main.py
```

2. Start the frontend:
```bash
cd care-bear-app
npm run dev
```

3. Test the flow:
   - Complete onboarding → Creates user in MongoDB
   - Chat with Care Bear → Stores messages in database
   - Add medications → Saves to calendar
   - View profile → Fetches from database

## Important Notes

- Always use try-catch for API calls
- Show loading states during API requests
- Handle errors gracefully with user-friendly messages
- Store userId in localStorage for session management
- Clear localStorage on logout/reset

## Environment Configuration

Create `.env` in frontend:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

Update api.js:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```
