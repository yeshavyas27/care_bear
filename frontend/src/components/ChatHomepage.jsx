import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI } from '../services/api';
import bearIcon from '../../assets/bear.png';

const ChatHomepage = ({ userData, chatHistory, updateChatHistory }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const [useWebSocket, setUseWebSocket] = useState(false); // Toggle for WS streaming

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    const loadHistory = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      try {
        const response = await chatAPI.getHistory(userId);
        if (response.data && response.data.messages) {
          const history = response.data.messages.map(msg => ({
            id: msg.message_id,
            sender: msg.sender,
            text: msg.message,
            timestamp: msg.timestamp
          }));
          
          if (history.length === 0) {
            // Initial welcome from backend if empty
            try {
              const initResponse = await chatAPI.initialize(userId);
              const welcome = {
                id: initResponse.data.message_id,
                sender: 'bear',
                text: initResponse.data.bear_response,
                timestamp: initResponse.data.timestamp,
              };
              setMessages([welcome]);
            } catch (error) {
              console.error('Failed to initialize chat:', error);
            }
          } else {
            setMessages(history);
          }
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        // Fallback to local history if API fails
        if (chatHistory.length > 0) setMessages(chatHistory);
      }
    };
    loadHistory();

    // Cleanup WebSocket on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // WebSocket setup (for future streaming implementation)
  const setupWebSocket = (userId) => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    wsRef.current = new WebSocket(`${wsUrl}/${userId}`);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'start') {
        setIsTyping(true);
        setStreamingMessage('');
      } else if (data.type === 'chunk') {
        setStreamingMessage(prev => prev + data.content);
      } else if (data.type === 'done') {
        // Add complete message to history
        const bearResponse = {
          id: Date.now(),
          sender: 'bear',
          text: streamingMessage,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, bearResponse]);
        setIsTyping(false);
        setStreamingMessage('');
      } else if (data.type === 'error') {
        console.error('WebSocket error:', data.message);
        const errorMessage = {
          id: Date.now(),
          sender: 'bear',
          text: 'Sorry, I had trouble processing that. Please try again.',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
        setStreamingMessage('');
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setUseWebSocket(false); // Fallback to HTTP
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket closed');
    };
  };

  const handleSendMessageHTTP = async (userId, message, newMessages) => {
    try {
      const response = await chatAPI.send(userId, message);
      
      const bearResponse = {
        id: response.data.message_id,
        sender: 'bear',
        text: response.data.bear_response,
        timestamp: response.data.timestamp,
      };

      const updatedMessages = [...newMessages, bearResponse];
      setMessages(updatedMessages);
      updateChatHistory(updatedMessages);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bear',
        text: 'Sorry, I had trouble processing that. Please try again.',
        timestamp: new Date().toISOString(),
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
    } finally {
      setIsTyping(false);
      setStreamingMessage('');
    }
  };

  const handleSendMessageWS = (message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        message: message,
        model: "anthropic/claude-sonnet-4-5-20250929"
      }));
    } else {
      console.error('WebSocket not connected, falling back to HTTP');
      setUseWebSocket(false);
      const userId = localStorage.getItem('userId');
      const newMessages = [...messages, {
        id: Date.now(),
        sender: 'user',
        text: message,
        timestamp: new Date().toISOString(),
      }];
      setMessages(newMessages);
      handleSendMessageHTTP(userId, message, newMessages);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userId = localStorage.getItem('userId');
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date().toISOString(),
    };

    const messageText = inputMessage;
    setInputMessage('');
    setIsTyping(true);
    setStreamingMessage('');

    if (useWebSocket) {
      // WebSocket streaming (future implementation)
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      handleSendMessageWS(messageText);
    } else {
      // Standard HTTP request (current implementation)
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      await handleSendMessageHTTP(userId, messageText, newMessages);
    }
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
            <img src={bearIcon} alt="Care Bear" className="w-12 h-12 rounded-full" />
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
                  <img src={bearIcon} alt="Care Bear" className="w-10 h-10 rounded-full" />
                </div>
              )}
              <div
                className={`max-w-md px-6 py-4 rounded-2xl ${
                  message.sender === 'user'
                    ? 'bg-brown text-white rounded-br-sm'
                    : 'bg-white border-2 border-charcoal/10 text-charcoal rounded-bl-sm shadow-sm'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-white/70' : 'text-charcoal/50'}`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Show streaming message while typing */}
          {isTyping && (
            <div className="flex justify-start items-end gap-3">
              <div className="flex-shrink-0 mb-1">
                <img src={bearIcon} alt="Care Bear" className="w-10 h-10 rounded-full" />
              </div>
              <div className="bg-white border-2 border-charcoal/10 rounded-2xl rounded-bl-sm px-6 py-4 shadow-sm min-w-[100px]">
                {streamingMessage ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{streamingMessage}</p>
                ) : (
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-brown rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-brown rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-brown rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
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
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              inputMessage.trim() && !isTyping
                ? 'bg-brown text-white hover:bg-brown/90 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-charcoal/10 text-charcoal/40 cursor-not-allowed'
            }`}
          >
            {isTyping ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHomepage;