import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  MessageSquare, 
  Brain, 
  ArrowRight, 
  ChevronRight,
  TrendingDown,
  Trash2
} from 'lucide-react';
import { ChatMessage } from '../types';
import { motion } from 'motion/react';

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  preloadQuery?: string | null;
  onClearPreloadQuery?: () => void;
}

const QUICK_PROMPTS = [
  'What is my outstanding invoice volume?',
  'Draft a polite payment reminder email for overdue client',
  'Who is my top billed client so far?',
  'Analyze my cash flow collections rate'
];

export default function AIChatbot({ isOpen, onClose, preloadQuery, onClearPreloadQuery }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto trigger preload queries when drawer opens
  useEffect(() => {
    if (isOpen && preloadQuery && onClearPreloadQuery) {
      handleSend(preloadQuery);
      onClearPreloadQuery();
    }
  }, [isOpen, preloadQuery, onClearPreloadQuery]);

  // Initialize with greeting
  useEffect(() => {
    const stored = localStorage.getItem('tallybird_chat_history') || localStorage.getItem('finvoice_chat_history');
    if (stored) {
      try {
        setMessages(JSON.parse(stored));
        return;
      } catch (err) {
        console.error('Failed to parse stored chat history');
      }
    }
    
    // Default greeting if empty
    setMessages([
      {
        id: 'greet_1',
        role: 'assistant',
        content: `Hi! I'm your **Tallybird** financial assistant. 🧾✨
        
I am connected directly to your invoice database and can help you audit your accounts. Here are a few things you can ask me:

- "What is my total outstanding payment?"
- "Which invoices are overdue?"
- "Draft a professional payment reminder email for Client X for invoice #102."
- "Provide a breakdown of my billing per month."

How can I assist your business today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  // Sync messages to localStorage
  const saveHistory = (history: ChatMessage[]) => {
    localStorage.setItem('tallybird_chat_history', JSON.stringify(history));
    localStorage.setItem('finvoice_chat_history', JSON.stringify(history));
  };

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    saveHistory(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    const authId = localStorage.getItem('tallybird_userId') || localStorage.getItem('finvoice_userId') || 'default_user';

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authId}`
        },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (!response.ok) {
        throw new Error('Chat assistant failed to respond. Check backend server.');
      }

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      saveHistory(finalMessages);
    } catch (err: any) {
      console.error('Chat failed:', err);
      const errMsg: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: `⚠️ **Assistant Error**: I encountered an issue accessing the financial database. Please check your network and API key configuration in settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear your conversation history?')) {
      const greeting: ChatMessage[] = [
        {
          id: 'greet_1',
          role: 'assistant',
          content: `Hi! I'm your **Tallybird** financial assistant. 🧾✨
          
How can I assist your business ledger today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ];
      setMessages(greeting);
      saveHistory(greeting);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/25 backdrop-blur-xs z-40 transition-all duration-300 md:hidden"
        onClick={onClose}
      />

      {/* Slide-out Sidebar container */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-white border-l border-slate-150 z-50 shadow-2xl flex flex-col h-full overflow-hidden transition-transform duration-300 transform translate-x-0"
        id="ai-chatbot-drawer"
      >
        {/* Chat header */}
        <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-xl">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-sm flex items-center gap-1">
                Tallybird <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              </span>
              <span className="text-[10px] text-slate-400 block font-semibold leading-none mt-0.5">
                Financial Analyst Engine
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              id="btn-clear-chat"
              onClick={handleClearChat}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              id="btn-close-chat"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread list */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Profile Icon */}
                {!isUser && (
                  <div className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono">
                    AI
                  </div>
                )}

                {/* Message Bubble wrapper */}
                <div className="space-y-1">
                  <div className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser 
                      ? 'bg-slate-900 text-white rounded-tr-none shadow-sm font-semibold' 
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-xs'
                  }`}>
                    {/* Basic custom bold and bullet markdown formatter for elegant view */}
                    {msg.content.split('\n').map((line, lidx) => {
                      let processed = line;
                      let isBullet = false;
                      if (processed.startsWith('- ')) {
                        processed = processed.substring(2);
                        isBullet = true;
                      }
                      
                      // Match basic bold format **text**
                      const boldParts = processed.split('**');
                      const renderedParts = boldParts.map((part, pidx) => {
                        if (pidx % 2 === 1) {
                          return <strong key={pidx} className="font-bold">{part}</strong>;
                        }
                        return part;
                      });

                      return (
                        <span key={lidx} className="block mt-1 first:mt-0">
                          {isBullet && <span className="inline-block mr-1.5 text-indigo-500 font-extrabold">•</span>}
                          {renderedParts}
                        </span>
                      );
                    })}
                  </div>
                  <span className={`text-[10px] text-slate-400 block font-medium ${isUser ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Loading bubble */}
          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-end">
              <div className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold font-mono">
                AI
              </div>
              <div className="bg-white border border-slate-100 p-3.5 rounded-2xl rounded-tl-none shadow-xs">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Action Quick Prompts Drawer (only if empty or small chat) */}
        <div className="p-4 bg-white border-t border-slate-100 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Suggested Quick Actions
          </span>
          <div className="flex flex-col gap-1.5">
            {QUICK_PROMPTS.map((prompt, pidx) => (
              <button
                key={pidx}
                id={`btn-chat-prompt-${pidx}`}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-indigo-50/40 text-slate-700 hover:text-indigo-700 text-xs font-bold rounded-xl border border-slate-100 transition truncate flex items-center justify-between group cursor-pointer"
              >
                <span>{prompt}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-indigo-600" />
              </button>
            ))}
          </div>
        </div>

        {/* Message Input box */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            id="chat-input-field"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend(inputValue);
            }}
            placeholder="Ask AI about accounts, reminders..."
            className="flex-1 px-4 py-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none bg-slate-50/30 text-slate-900 placeholder:text-slate-400 font-medium"
            disabled={isLoading}
          />
          <button
            id="btn-send-message"
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className={`p-2.5 rounded-xl transition ${
              !inputValue.trim() || isLoading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md shadow-indigo-100'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
