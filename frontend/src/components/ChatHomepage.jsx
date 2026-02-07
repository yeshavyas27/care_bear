import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatHomepage = ({ userData, chatHistory, updateChatHistory }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with welcome message if no chat history
    if (chatHistory.length === 0) {
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

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const bearResponse = {
        id: Date.now() + 1,
        sender: 'bear',
        text: generateBearResponse(inputMessage),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...newMessages, bearResponse];
      setMessages(updatedMessages);
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
            <svg width="50" height="50" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="#CD853F" stroke="#654321" strokeWidth="3"/>
              <circle cx="30" cy="30" r="12" fill="#DAA520" stroke="#654321" strokeWidth="2"/>
              <circle cx="70" cy="30" r="12" fill="#DAA520" stroke="#654321" strokeWidth="2"/>
              <circle cx="35" cy="48" r="4" fill="#654321"/>
              <circle cx="65" cy="48" r="4" fill="#654321"/>
              <path d="M 40 60 Q 50 68 60 60" stroke="#654321" strokeWidth="3" fill="none" strokeLinecap="round"/>
              <ellipse cx="50" cy="55" rx="6" ry="8" fill="#DAA520"/>
            </svg>
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
                  <svg width="40" height="40" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="#CD853F" stroke="#654321" strokeWidth="3"/>
                    <circle cx="30" cy="30" r="12" fill="#DAA520" stroke="#654321" strokeWidth="2"/>
                    <circle cx="70" cy="30" r="12" fill="#DAA520" stroke="#654321" strokeWidth="2"/>
                    <circle cx="35" cy="48" r="4" fill="#654321"/>
                    <circle cx="65" cy="48" r="4" fill="#654321"/>
                    <path d="M 40 60 Q 50 68 60 60" stroke="#654321" strokeWidth="3" fill="none" strokeLinecap="round"/>
                    <ellipse cx="50" cy="55" rx="6" ry="8" fill="#DAA520"/>
                  </svg>
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
                <svg width="40" height="40" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="#CD853F" stroke="#654321" strokeWidth="3"/>
                  <circle cx="30" cy="30" r="12" fill="#DAA520" stroke="#654321" strokeWidth="2"/>
                  <circle cx="70" cy="30" r="12" fill="#DAA520" stroke="#654321" strokeWidth="2"/>
                  <circle cx="35" cy="48" r="4" fill="#654321"/>
                  <circle cx="65" cy="48" r="4" fill="#654321"/>
                  <path d="M 40 60 Q 50 68 60 60" stroke="#654321" strokeWidth="3" fill="none" strokeLinecap="round"/>
                  <ellipse cx="50" cy="55" rx="6" ry="8" fill="#DAA520"/>
                </svg>
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
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
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
