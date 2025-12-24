import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { useAuth } from '../components/AuthContext';
import { useNotification } from '../components/NotificationSystem';
import { geminiService } from '../services/geminiService';
import { DemoButton } from '../components/DemoButton';

const Landing: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    { role: 'model', text: "Welcome to AI PayFlow. I'm here to help you innovate. What can we build today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentHeadline, setCurrentHeadline] = useState(0);
  const [welcomeBannerDismissed, setWelcomeBannerDismissed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const headlines = [
    "Intelligence That Just Floats",
    "Payments Made Simple Smart",
    "Real Time Insights Always"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (chatOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, chatOpen]);

  const handleProtectedNavClick = (e: React.MouseEvent, path: string) => {
    if (!user) {
      e.preventDefault();
      showNotification({
        type: 'info',
        message: "Seems like you don't have an account. Let's get you set up!",
        duration: 4000,
      });
      setTimeout(() => {
        navigate('/signup');
      }, 500);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeadline((prev) => (prev + 1) % headlines.length);
    }, 4000); // Change headline every 4 seconds
    return () => clearInterval(interval);
  }, [headlines.length]);

  const handleSend = async () => {
    if (!prompt.trim() || isTyping) return;
    const userMsg = { role: 'user' as const, text: prompt };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      const aiResponse = await geminiService.generateResponse(userMsg.text, history);
      setMessages(prev => [...prev, { role: 'model', text: aiResponse || "I'm not sure how to respond to that." }]);
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      const errorMessage = err?.message?.includes('API key') 
        ? "Sorry, I encountered an error. Please try again or check your Gemini API key configuration."
        : err?.message || "Sorry, I encountered an error. Please try again.";
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsTyping(false);
    }
  };

  const LayeredPaperBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {}
      <svg className="absolute -bottom-40 md:-bottom-64 lg:-bottom-[25rem] left-0 w-[140%] md:w-[120%] h-auto wave-layer animate-wave-4 opacity-100" viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 200C240 100 480 400 720 300C960 200 1200 400 1440 200V800H0V200Z" fill="#08142a" />
      </svg>
      
      {}
      <svg className="absolute -bottom-28 md:-bottom-48 lg:-bottom-[20rem] left-0 w-[135%] md:w-[115%] h-auto wave-layer animate-wave-3 opacity-100" viewBox="0 0 1440 700" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 250C300 150 600 450 900 350C1200 250 1440 350 1440 250V700H0V250Z" fill="#0f1d3a" />
      </svg>
      
      {}
      <svg className="absolute -bottom-12 md:-bottom-32 lg:-bottom-[16rem] left-0 w-[130%] md:w-[110%] h-auto wave-layer animate-wave-2 opacity-100" viewBox="0 0 1440 600" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 300C360 200 720 500 1080 400C1440 300 1440 400 1440 300V600H0V300Z" fill="#1e3a8a" />
      </svg>
      
      {}
      <svg className="absolute -bottom-4 md:-bottom-20 lg:-bottom-[12rem] left-0 w-[125%] md:w-[105%] h-auto wave-layer animate-wave-1 opacity-100" viewBox="0 0 1440 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 350C420 250 840 550 1260 450C1680 350 1440 450 1440 350V500H0V350Z" fill="#3b82f6" />
      </svg>

      {}
      <div className="absolute top-[20%] left-[10%] w-3 h-5 bg-blue-100 rounded-full opacity-10 blur-sm animate-pulse hidden md:block"></div>
      <div className="absolute top-[40%] right-[15%] w-2 h-4 bg-blue-100 rounded-full opacity-10 blur-[1px] hidden md:block"></div>
    </div>
  );

  const FeatureCards = () => (
    <>
      {[
        { title: 'Real-Time Processing', desc: 'Sub-millisecond transaction processing with distributed worker architecture for high-throughput operations.' },
        { title: 'Intelligent Rules Engine', desc: 'State transition validation and business logic enforcement for automated decision-making.' },
        { title: 'Comprehensive Monitoring', desc: 'Real-time alerts, system health tracking, and audit logs for complete transaction visibility.' }
      ].map((feature, i) => (
        <div key={i} className="group p-10 bg-slate-100 rounded-[1rem] border border-slate-200/50 transition-all hover:bg-gray-100">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8">
            <Icons.Zap size={22} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">{feature.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
        </div>
      ))}
    </>
  );

  const PortfolioCards = () => (
    <>
      <div className="portfolio-card w-[420px] rounded-[1rem] overflow-hidden bg-[#FDFBF7] aspect-[4/5] relative group border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)]">
        <div className="absolute inset-0 p-10 flex flex-col justify-between z-20">
          <div className="space-y-8">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
               <Icons.Logo size={24} className="text-blue-600" />
            </div>
            <h3 className="text-3xl font-[800] text-slate-900 leading-tight tracking-tight">
              Strategic Marketing for Avant-Garde Projects
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-5 bg-slate-50 rounded-[1.75rem] border border-slate-100/50">
                <p className="text-slate-900 text-3xl font-black">242+</p>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Campaigns</p>
             </div>
             <div className="p-5 bg-slate-50 rounded-[1.75rem] border border-slate-100/50">
                <p className="text-slate-900 text-3xl font-black">7.1M$</p>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">Raised</p>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
          <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover grayscale" alt="tech" />
        </div>
      </div>

      <div className="portfolio-card w-[700px] rounded-[1rem] overflow-hidden bg-blue-600 aspect-[1.8/1] relative group shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]">
         <div className="absolute inset-0 flex items-center justify-center p-10 overflow-hidden">
            <div className="absolute top-[8%] right-[5%] w-[42%] aspect-[1.4] bg-white rounded-xl shadow-xl p-6 rotate-[8deg] opacity-95">
               <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
               </div>
               <h4 className="text-[12px] font-bold text-slate-800 leading-tight mb-3">Real-time transaction insights and analytics.</h4>
               <div className="h-2 bg-slate-100 rounded-full w-full mb-1.5"></div>
               <div className="h-2 bg-slate-100 rounded-full w-2/3"></div>
            </div>
            <div className="z-20 w-[42%] aspect-[1.4] bg-white rounded-2xl shadow-2xl flex items-center justify-center p-10 translate-x-[-15%]">
               <div className="flex items-center gap-3">
                  <Icons.Zap size={36} className="text-blue-600" />
                  <span className="font-black text-slate-900 tracking-tighter text-3xl">PayFlow</span>
               </div>
            </div>
            <div className="absolute bottom-[10%] right-[10%] w-[38%] aspect-[1.3] bg-white rounded-xl shadow-2xl p-6 rotate-[-5deg] z-30 flex gap-4">
               <div className="flex-1">
                  <h4 className="text-[12px] font-bold text-blue-900 leading-tight mb-3">Scale Your Payment Operations.</h4>
                  <div className="h-10 bg-blue-50 rounded-xl"></div>
               </div>
               <div className="w-16 h-full rounded-xl bg-slate-100 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover grayscale opacity-80" alt="abstract visualization" />
               </div>
            </div>
         </div>
      </div>
    </>
  );

  return (
    <div className="relative min-h-screen site-gradient-wrapper min-w-lvw font-['Plus_Jakarta_Sans']">
      <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${scrolled ? 'pt-6' : 'pt-0'}`}>
        <nav 
          className={`
            transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-auto
            ${scrolled 
              ? 'soft-nav max-w-5xl mx-auto rounded-[1.5rem] py-2 px-3 scale-[0.98] bg-[#F6FAFD] ' 
              : 'max-w-7xl mx-auto py-10 px-12 rounded-none border-transparent'
            }
            relative flex items-center
          `}
        >
          {}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className={`transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] w-10 h-10  flex items-center justify-center text-[#2563eb]  ${scrolled ? 'scale-90 bg-[#F6FAFD]' : 'scale-100'}`}>
              <Icons.Logo size={20} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 transition-opacity duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]">PAYFLOW</span>
          </div>

          {}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link 
              to="/dashboard" 
              onClick={(e) => handleProtectedNavClick(e, '/dashboard')}
              className="text-sm font-bold text-slate-700/80 hover:text-blue-600 transition-all duration-500 ease-in-out tracking-wide"
            >
              Dashboard
            </Link>
            <Link 
              to="/alerts" 
              onClick={(e) => handleProtectedNavClick(e, '/alerts')}
              className="text-sm font-bold text-slate-700/80 hover:text-blue-600 transition-all duration-500 ease-in-out tracking-wide relative"
            >
              Alerts
            </Link>
            <Link 
              to="/health" 
              onClick={(e) => handleProtectedNavClick(e, '/health')}
              className="text-sm font-bold text-slate-700/80 hover:text-blue-600 transition-all duration-500 ease-in-out tracking-wide"
            >
              System Health
            </Link>
          </div>

          {}
          <div className="hidden md:block ml-auto flex-shrink-0">
            {user ? (
              <Link 
                to="/dashboard" 
                className="bg-[#2563eb] text-white px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all duration-500 ease-in-out shadow-xl shadow-blue-500/15 active:scale-95"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/signup" className="bg-[#2563eb] text-white px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-all duration-500 ease-in-out shadow-xl shadow-blue-500/15 active:scale-95">
                Get for Windows
              </Link>
            )}
          </div>

          {}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-blue-600 transition-colors rounded-lg hover:bg-slate-50"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <Icons.X size={24} /> : <Icons.Menu size={24} />}
          </button>
        </nav>

        {}
        {mobileMenuOpen && (
          <div className="md:hidden pointer-events-auto mt-4 mx-6 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
            <div className="p-6 space-y-4">
              <Link 
                to="/dashboard" 
                onClick={(e) => {
                  handleProtectedNavClick(e, '/dashboard');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
              >
                <Icons.Dashboard size={20} />
                Dashboard
              </Link>
              <Link 
                to="/alerts" 
                onClick={(e) => {
                  handleProtectedNavClick(e, '/alerts');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
              >
                <Icons.Alerts size={20} />
                Alerts
              </Link>
              <Link 
                to="/health" 
                onClick={(e) => {
                  handleProtectedNavClick(e, '/health');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
              >
                <Icons.Health size={20} />
                System Health
              </Link>
              {!user && (
                <div className="pt-4 border-t border-slate-200">
                  <Link 
                    to="/signup" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full bg-[#2563eb] text-white px-6 py-3.5 rounded-xl text-sm font-bold text-center hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/20"
                  >
                    Get for Windows
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {}
      {user && !welcomeBannerDismissed && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[90] max-w-2xl w-full px-4 animate-[fadeInUp_0.6s_ease-out_0.3s_forwards]" style={{ opacity: 0 }}>
          <div className="bg-white border border-blue-200 rounded-2xl shadow-lg p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Icons.Dashboard size={20} className="text-[#2563eb]" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Welcome back, {user.name}!</p>
                <p className="text-xs text-slate-600">Access your dashboard to manage your operations.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/dashboard"
                className="bg-[#2563eb] text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                Go to Dashboard
                <Icons.ChevronRight size={16} />
              </Link>
              <button
                onClick={() => setWelcomeBannerDismissed(true)}
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                aria-label="Close banner"
              >
                <Icons.X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      <section className="hero-section left-1/2 -translate-x-1/2 relative font-jakarta min-h-screen px-6 flex flex-col items-center justify-start text-center overflow-hidden pt-[28vh] md:pt-[28vh] lg:pt-[30vh] xl:pt-[26vh] bg-[#fdfbf7]">
        <LayeredPaperBackground />
        
        <div className="relative z-10 flex flex-col items-center max-w-7xl font-jakarta">
          <h1 
            className="hero-title-solid text-4xl md:text-[4.5rem] lg:text-[4rem] font-[800] mb-6 leading-[1.2] tracking-[-0.04em] px-4"
            style={{ 
              opacity: 0, 
              animation: 'fadeInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            Intelligence <br className="hidden md:block" />
            <span className="text-slate-900/40">that just floats.</span>
          </h1>

          <p 
            className="text-base md:text-lg lg:text-lg text-slate-600/80 max-w-2xl leading-relaxed mb-10 font-medium"
            style={{ 
              opacity: 0, 
              animation: 'fadeInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards',
              fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}
          >
            Enterprise payment processing with real-time monitoring,<br className="hidden md:block" />
            powered by distributed systems and intelligent rule engines.
          </p>

          <div 
            className="flex flex-col md:flex-row items-center gap-4 mb-16 lg:mb-20"
            style={{ 
              opacity: 0, 
              animation: 'fadeInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.8s forwards' 
            }}
          >
            {user ? (
              <>
                <Link 
                  to="/dashboard"
                  className="bg-[#2563eb] text-white px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl active:translate-y-0"
                >
                  <Icons.Dashboard size={18} />
                  Go to Dashboard
                </Link>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-900 bg-white shadow-md hover:shadow-lg hover:bg-slate-50 transition-all border border-slate-200 backdrop-blur-sm"
                >
                  View Operations
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/signup"
                  className="bg-[#2563eb] text-white px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl hover:translate-y-[-1px] active:translate-y-0"
                >
                  Get Started
                </Link>
                <div className="flex items-center">
                  <DemoButton />
                </div>
                <button 
                  onClick={() => setChatOpen(true)}
                  className="px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-900 bg-white shadow-md hover:shadow-lg hover:bg-slate-50 transition-all border border-slate-200 backdrop-blur-sm"
                >
                  Try AI Demo
                </button>
              </>
            )}
          </div>
          
          <div 
            className="mt-5 mb-32 flex flex-col items-center gap-6 transition-all hover:opacity-100 duration-500"
            style={{ 
              opacity: 0, 
              animation: 'fadeInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 1.1s forwards' 
            }}
          >
             <span className="text-[9px] mt-1 font-bold uppercase tracking-[0.45em] text-slate-400">Works seamlessly with</span>
             <div className="flex gap-10 items-center">
                <Icons.Logo size={22} className="text-slate-400" />
                <Icons.Zap size={22} className="text-slate-400" />
                <Icons.Figma size={22} className="text-slate-400" />
                <div className="w-5 h-5 bg-slate-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-slate-400/80 rounded-full"></div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {}
      <section className="relative z-10 py-48 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">High Performance</span>
            </div>
            <h2 className="text-4xl md:text-7xl font-[800] text-slate-900 tracking-tight leading-tight mb-8">
              Built for <span className="text-blue-600">high-stakes</span> transactions.
            </h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
              Zero downtime, zero compromises. Process millions of transactions with real-time monitoring and intelligent rule enforcement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCards />
          </div>
        </div>
      </section>

      {}
      <section className="relative z-10 py-32 bg-[#050a15] w-full overflow-hidden">
        <div className="w-full overflow-hidden scroll-container">
          <div className="animate-scroll flex gap-8">
            <PortfolioCards />
            <PortfolioCards />
            <PortfolioCards />
          </div>
        </div>
      </section>

      {}
      <section className="relative z-10 px-6 py-56 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0a0a0a] rounded-[1.5rem] overflow-hidden flex flex-col lg:flex-row items-stretch border border-white/5 shadow-3xl">
            <div className="p-16 lg:p-24 flex-1 flex flex-col justify-center">
               <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-10 w-fit">
                  <Icons.Zap size={16} className="text-blue-500" />
                  <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.25em]">Distributed Architecture</span>
               </div>
               <h2 className="text-white text-4xl md:text-7xl font-extrabold tracking-tight leading-none mb-10">
                 Security is the foundation.
               </h2>
               <p className="text-slate-400 text-xl font-medium max-w-lg leading-relaxed mb-12">
                 Enterprise-grade encryption, audit trails, and compliance-first architecture. Every transaction is monitored, validated, and secured with multi-layer protection.
               </p>
               <div className="flex gap-10">
                  <div className="space-y-2">
                     <p className="text-white text-4xl font-black tracking-tighter">&lt;1ms</p>
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Processing</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-white text-4xl font-black tracking-tighter">99.99%</p>
                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Uptime</p>
                  </div>
               </div>
            </div>
            <div className="flex-1 min-h-[500px] relative bg-[#121212]">
               <div className="absolute inset-0 flex items-center justify-center p-20">
                  <div className="w-full h-full rounded-[2rem] bg-[#111] border border-white/5 overflow-hidden shadow-2xl relative">
                     <div className="absolute inset-0 bg-blue-600/10"></div>
                     <div className="absolute bottom-10 left-10 right-10 flex flex-col gap-4">
                        <div className="h-4 w-3/4 bg-white/10 rounded-full"></div>
                        <div className="h-4 w-1/2 bg-white/5 rounded-full"></div>
                        <div className="h-4 w-2/3 bg-blue-600/30 rounded-full"></div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {}
      {chatOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 h-screen w-screen">
          <div className="fixed inset-0 h-screen w-screen bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-500" onClick={() => setChatOpen(false)} />
          <div className="bg-white w-full max-w-2xl h-[80vh] rounded-[1.5rem] shadow-none flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] relative z-[201] border border-slate-200 shadow-2xl shadow-slate-900/10">
            {}
            <div className="bg-white border-b border-slate-100 p-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-[#2563eb] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <Icons.Logo size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-widest leading-none">PayFlow Assistant</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Neural v4.1 Active</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                <Icons.X size={20} />
              </button>
            </div>

            {}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-slate-50/30 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                  <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {msg.role === 'model' && (
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Icons.Logo size={16} />
                      </div>
                    )}
                    <div className={`px-6 py-5 rounded-[1.75rem] text-sm font-medium leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-500/10 rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-800 shadow-sm rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="flex gap-4 max-w-[85%]">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Icons.Logo size={16} />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-[1.75rem] rounded-tl-none px-6 py-4 flex items-center gap-3 shadow-sm">
                      <div className="flex gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PayFlow is thinking</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {}
            <div className="p-8 border-t border-slate-100 bg-white">
              <div className="relative group">
                <input 
                  type="text" 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                  placeholder="Type your message here..." 
                  disabled={isTyping}
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-5 pr-16 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all disabled:opacity-50" 
                />
                <button 
                  onClick={handleSend} 
                  disabled={!prompt.trim() || isTyping}
                  className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#2563eb] text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-blue-500/20"
                >
                  <Icons.ArrowRight size={20} />
                </button>
              </div>
              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6">
                Powered by Gemini 3 Flash Preview • All interactions are secure
              </p>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-[#050a15] py-36 relative z-10 text-white">
        <div className="max-w-7xl mx-auto px-16">
          <div className="grid md:grid-cols-4 gap-24">
            <div className="col-span-2 space-y-12">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <Icons.Logo size={28} />
                </div>
                <span className="text-4xl font-black tracking-tighter">PAYFLOW</span>
              </div>
              <p className="text-slate-400 text-xl font-medium max-w-md leading-snug">
                Enterprise payment processing platform. Security, reliability, and scale without compromise.
              </p>
            </div>
            <div>
              <h4 className="font-black text-white mb-12 uppercase tracking-[0.35em] text-[11px]">Solutions</h4>
              <ul className="space-y-7 text-slate-500 font-bold text-sm">
                <li><a href="#" className="hover:text-blue-500 transition-colors">Payment Processing</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Transaction Monitoring</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Rules Engine</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white mb-12 uppercase tracking-[0.35em] text-[11px]">Company</h4>
              <ul className="space-y-7 text-slate-500 font-bold text-sm">
                <li><a href="#" className="hover:text-blue-500 transition-colors">System Health</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Audit Logs</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Batch Jobs</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-28 border-t border-white/5 mt-28 flex flex-col md:flex-row justify-between items-center text-xs font-black text-slate-500 tracking-[0.25em] gap-10">
             <p>© 2025 PAYFLOW INTELLIGENCE SYSTEMS INC. GLOBAL PATENTS PENDING.</p>
             <div className="flex gap-16">
                <a href="#" className="hover:text-white transition-colors">X.COM</a>
                <a href="#" className="hover:text-white transition-colors">LINKEDIN</a>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
