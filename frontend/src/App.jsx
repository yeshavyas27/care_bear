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

  useEffect(() => {
    // Check if user has completed onboarding
    const storedUserData = localStorage.getItem('careBearUserData');
    const storedChatHistory = localStorage.getItem('careBearChatHistory');
    
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
      setIsOnboarded(true);
    }
    
    if (storedChatHistory) {
      setChatHistory(JSON.parse(storedChatHistory));
    }
  }, []);

  const handleOnboardingComplete = (data) => {
    setUserData(data);
    setIsOnboarded(true);
    localStorage.setItem('careBearUserData', JSON.stringify(data));
  };

  const updateChatHistory = (newHistory) => {
    setChatHistory(newHistory);
    localStorage.setItem('careBearChatHistory', JSON.stringify(newHistory));
  };

  const updateUserData = (newData) => {
    setUserData(newData);
    localStorage.setItem('careBearUserData', JSON.stringify(newData));
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
                <CalendarPage userData={userData} />
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
