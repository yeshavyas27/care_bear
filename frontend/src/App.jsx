import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OnboardingFlow from './components/OnboardingFlow';
import HomePage from './components/HomePage';
import ChatHomepage from './components/ChatHomepage';
import ProfilePage from './components/ProfilePage';
import CalendarPage from './components/CalendarPage';

function App() {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userData, setUserData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [medications, setMedications] = useState([
    {
      id: 1,
      name: 'Morning Vitamins',
      dosage: '1 tablet',
      time: '08:00',
      frequency: 'Daily',
      taken: {},
    },
    {
      id: 2,
      name: 'Blood Pressure Medication',
      dosage: '10mg',
      time: '09:00',
      frequency: 'Daily',
      taken: {},
    },
    {
      id: 3,
      name: 'Allergy Medication',
      dosage: '5mg',
      time: '20:00',
      frequency: 'As needed',
      taken: {},
    },
  ]);

  useEffect(() => {
    // Check if user has completed onboarding
    const storedUserData = localStorage.getItem('mediPalUserData');
    const storedChatHistory = localStorage.getItem('mediPalChatHistory');
    const storedMedications = localStorage.getItem('mediPalMedications');
    
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
      setIsOnboarded(true);
    }
    
    if (storedChatHistory) {
      setChatHistory(JSON.parse(storedChatHistory));
    }
    
    if (storedMedications) {
      setMedications(JSON.parse(storedMedications));
    }
  }, []);

  const handleOnboardingComplete = (data) => {
    setUserData(data);
    setIsOnboarded(true);
    localStorage.setItem('mediPalUserData', JSON.stringify(data));
  };

  const updateChatHistory = (newHistory) => {
    setChatHistory(newHistory);
    localStorage.setItem('mediPalChatHistory', JSON.stringify(newHistory));
  };

  const updateUserData = (newData) => {
    setUserData(newData);
    localStorage.setItem('mediPalUserData', JSON.stringify(newData));
  };

  const updateMedications = (newMedications) => {
    setMedications(newMedications);
    localStorage.setItem('mediPalMedications', JSON.stringify(newMedications));
  };

  return (
    <Router>
      <div className="min-h-screen bg-cream">
        <Routes>
          <Route 
            path="/onboarding" 
            element={
              !isOnboarded ? (
                <OnboardingFlow onComplete={handleOnboardingComplete} />
              ) : (
                <Navigate to="/home" replace />
              )
            } 
          />
          <Route 
            path="/home" 
            element={
              isOnboarded ? (
                <HomePage 
                  userData={userData}
                  medications={medications}
                  updateMedications={updateMedications}
                />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            } 
          />
          <Route 
            path="/chat" 
            element={
              isOnboarded ? (
                <ChatHomepage 
                  userData={userData}
                  chatHistory={chatHistory}
                  updateChatHistory={updateChatHistory}
                />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            } 
          />
          <Route 
            path="/profile" 
            element={
              isOnboarded ? (
                <ProfilePage 
                  userData={userData}
                  updateUserData={updateUserData}
                  chatHistory={chatHistory}
                />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            } 
          />
          <Route 
            path="/calendar" 
            element={
              isOnboarded ? (
                <CalendarPage 
                  userData={userData}
                  medications={medications}
                  updateMedications={updateMedications}
                />
              ) : (
                <Navigate to="/onboarding" replace />
              )
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={isOnboarded ? "/home" : "/onboarding"} replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
