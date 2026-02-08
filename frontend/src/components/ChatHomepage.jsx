import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import bearIcon from '../../assets/bear.png';

const ChatHomepage = ({ userData, chatHistory = [], updateChatHistory = () => {} }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // ---Voice State ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ---Initialize Speech Recognition ---
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Capture one sentence at a time
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        // Logic: Append voice text to existing input
        setInputMessage((prev) => (prev ? prev + ' ' + transcript : transcript));
      };
    }
  }, []);

  // --- NEW: Toggle Microphone ---
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    // Initialize with welcome message if no chat history
    if (!Array.isArray(chatHistory) || chatHistory.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        sender: 'bear',
        text: `Hey ${userData?.personalInfo?.firstName || 'there'}! Is your throat still sore?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
      updateChatHistory([welcomeMessage]);
    } else {
      setMessages(chatHistory);
    }
  }, []);

  const generateBearResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Simple response logic - in production, this would integrate with an AI API
    if (lowerMessage.includes('yes') || lowerMessage.includes('still sore') || lowerMessage.includes('hurt')) {
      return "I'm sorry to hear that. How long has your throat been sore? Have you taken any medication for it?";
    } else if (lowerMessage.includes('no') || lowerMessage.includes('better') || lowerMessage.includes('fine')) {
      return "That's wonderful! I'm so glad you're feeling better. Is there anything else I can help you with today?";
    } else if (lowerMessage.includes('medication') || lowerMessage.includes('medicine')) {
      return "Based on your profile, I see you're currently taking some medications. Have you been taking them as prescribed? Would you like me to check your medication schedule?";
    } else if (lowerMessage.includes('doctor') || lowerMessage.includes('appointment')) {
      return "Would you like me to help you prepare for your doctor's appointment? I can generate a health report with your recent symptoms and medication history.";
    } else {
      return "I understand. Can you tell me more about how you're feeling today? I'm here to help with any health concerns you might have.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // 1. Create User Message Object
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date().toISOString(),
      // Optional: Add a flag if you want to track this came from voice input specifically
      // isVoiceTranscript: true 
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsTyping(true);

    // 2. Simulate AI Response
    setTimeout(() => {
      const bearResponse = {
        id: Date.now() + 1,
        sender: 'bear',
        text: generateBearResponse(inputMessage),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...newMessages, bearResponse];
      setMessages(updatedMessages);
      
      // 3. Save Transcript/History for Database/AI
      updateChatHistory(updatedMessages);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="bg-white border-b-2 border-charcoal/10 px-6 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="p-2 hover:bg-cream rounded-xl transition-colors"
              title="Go Back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <img src={bearIcon} alt="CareBear" className="w-20 h-20 rounded-full flex-shrink-0 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-charcoal">Care Bear</h1>
              <p className="text-xs text-charcoal/60">Always here for you</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/calendar')}
              className="p-3 hover:bg-cream rounded-xl transition-colors"
              title="Medication Calendar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="p-3 hover:bg-cream rounded-xl transition-colors"
              title="Your Profile"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-3`}
            >
              {message.sender === 'bear' && (
                <div className="flex-shrink-0 mb-1">
                  <img src={bearIcon} alt="CareBear" className="w-20 h-20 rounded-full object-contain" />
                </div>
              )}
              <div
                className={`max-w-md px-6 py-4 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-brown text-white rounded-br-sm'
                    : 'bg-white border-2 border-charcoal/10 text-charcoal rounded-bl-sm shadow-sm'
                }`}
              >
                <p className="leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-white/70' : 'text-charcoal/50'}`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start items-end gap-3">
              <div className="flex-shrink-0 mb-1">
                <img src={bearIcon} alt="CareBear" className="w-20 h-20 rounded-full object-contain" />
              </div>
              <div className="bg-white border-2 border-charcoal/10 rounded-2xl rounded-bl-sm px-6 py-4 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-brown rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-brown rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-brown rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t-2 border-charcoal/10 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex gap-3">
          
          {/* --- NEW: Mic Button --- */}
          <button
            onClick={toggleListening}
            className={`p-3 rounded-xl transition-all ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-charcoal/5 hover:bg-charcoal/10 text-charcoal'
            }`}
            title="Speak"
          >
            {isListening ? (
               // Mic Off / Active Icon
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                 <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                 <line x1="12" y1="19" x2="12" y2="23"/>
                 <line x1="8" y1="23" x2="16" y2="23"/>
               </svg>
            ) : (
               // Mic Icon
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                 <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                 <line x1="12" y1="19" x2="12" y2="23"/>
                 <line x1="8" y1="23" x2="16" y2="23"/>
               </svg>
            )}
          </button>

          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Type your message..."}
            className="flex-1 px-4 py-3 border-2 border-charcoal/20 rounded-xl focus:border-brown focus:outline-none resize-none transition-colors"
            rows="1"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              inputMessage.trim()
                ? 'bg-brown text-white hover:bg-brown/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-charcoal/10 text-charcoal/40 cursor-not-allowed'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHomepage;