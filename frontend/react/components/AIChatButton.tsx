import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';
import { geminiService } from '../services/geminiService';

const SYSTEM_CONTEXT = `You are an AI assistant for PayFlow Enterprise Console, a production-grade distributed platform for payment processing and monitoring.

**System Architecture:**
- Frontend: React TypeScript enterprise console with full CRUD operations
- Backend Services:
  - Node.js API Gateway: REST API, JWT auth, user management, state validation
  - Go Worker: High-throughput payment processing, SQS queue consumption, idempotency checks

**Key Features:**
- Payment transaction processing and monitoring
- Real-time system health monitoring
- Alert management and incident replay
- Audit logging and batch job management
- Automation rules and policies
- User authentication with RBAC

**Data Flow:**
1. Payment events arrive via SQS
2. Go Worker consumes and processes events
3. Redis checks for duplicate events (idempotency)
4. Go worker validates state transitions
5. State updated in PostgreSQL
6. Alerts generated if rules trigger

**Technology Stack:**
- Frontend: React 19, TypeScript, Vite, React Router, Tailwind CSS
- Backend: Node.js/Express, Go
- Databases: PostgreSQL, Redis
- Messaging: Amazon SQS

Help users understand the system, troubleshoot issues, and navigate the console effectively.`;

export const AIChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    { 
      role: 'model', 
      text: "Hello! I'm your AI assistant for PayFlow Enterprise Console. I can help you understand the system, navigate the dashboard, troubleshoot issues, and answer questions about payment processing, alerts, and system health. What would you like to know?" 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    if (!prompt.trim() || isTyping) return;

    const userMessage = prompt.trim();
    setPrompt('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      const fullPrompt = `${SYSTEM_CONTEXT}\n\nUser: ${userMessage}`;
      const response = await geminiService.generateResponse(fullPrompt, history);
      
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Sorry, I encountered an error. Please try again or check your Gemini API key configuration.' 
      }]);
      console.error('AI chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {}
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-demo="ai-chat"
        className={`fixed bottom-6 right-6 z-[150] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen 
            ? 'w-14 h-14 rounded-2xl bg-[#2563eb] text-white shadow-2xl shadow-blue-500/30 scale-100' 
            : 'w-12 h-12 rounded-full bg-[#2563eb] text-white shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-110 active:scale-95'
        } flex items-center justify-center group`}
        aria-label="Open AI Assistant"
      >
        {isOpen ? (
          <Icons.X size={23} className="transition-transform duration-300 rotate-0" />
        ) : (
          <Icons.Logo size={23} className="transition-transform duration-300 group-hover:scale-110" />
        )}
      </button>

      {}
      {isOpen && (
        <div 
          ref={chatContainerRef}
          className="fixed bottom-24 right-6 z-[140] w-[420px] h-[600px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          {}
          <div className="bg-[#2563eb] dark:bg-blue-900 p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Icons.Logo size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">AI Assistant</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <Icons.X size={18} />
            </button>
          </div>

          {}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-900 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Icons.Logo size={14} className="text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#2563eb] text-white rounded-tr-sm' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Icons.Logo size={14} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about the system..."
                disabled={isTyping}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 pr-12 text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!prompt.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#2563eb] text-white rounded-xl flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all disabled:bg-slate-300 disabled:text-slate-500"
              >
                <Icons.ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

