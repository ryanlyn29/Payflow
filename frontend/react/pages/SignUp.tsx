import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { authService } from '../services/api';
import { Button } from '../components/UI';
import { oauthService } from '../services/api';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/\d/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    if (!name.trim()) {
      setError('Name is required');
      setSubmitting(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Invalid email format');
      setSubmitting(false);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    try {
      const response = await authService.signup(email, password, name);
      setSuccess(true);

      setTimeout(() => {
        navigate('/login', { state: { message: response.message } });
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Registration failed';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col lg:flex-row font-['Plus_Jakarta_Sans']">
        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 lg:p-16">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icons.Success size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
              Account Created Successfully
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Please check your email to verify your account before signing in.
            </p>
            <p className="text-xs text-slate-500">
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col lg:flex-row font-['Plus_Jakarta_Sans'] overflow-hidden">
      {}
      <div className="flex-1 flex flex-col p-6 md:p-10 lg:p-12 relative overflow-y-auto bg-white custom-scrollbar">
        <Link to="/" className="flex items-center gap-2.5 mb-6 lg:mb-10 hover:opacity-80 transition-opacity shrink-0">
          <Icons.Logo size={22} className="text-[#2563eb]" />
          <span className="text-lg font-extrabold tracking-tight text-slate-900">PAYFLOW</span>
        </Link>

        <div className="flex-1 flex flex-col justify-center max-w-[400px] mx-auto w-full pb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Get Started Now</h1>
            <p className="text-slate-500 font-medium text-xs">Enter your information to get started</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
              type="button" 
              onClick={() => oauthService.initiateGoogle()}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs text-slate-700"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
            <button 
              type="button" 
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-bold text-xs text-slate-700"
            >
              <Icons.Apple size={16} />
              Sign up with Apple
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
            <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-widest text-slate-400"><span className="bg-white px-3">or</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all font-medium text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Email address</label>
              <input
                type="email"
                required
                placeholder="johndoe21@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all font-medium text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="min 8 chars"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all font-medium pr-12 text-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="min 8 chars"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/40 transition-all font-medium pr-12 text-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showConfirmPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[11px] font-bold flex items-center gap-2">
                <Icons.Error size={14} />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-3 text-sm rounded-xl !bg-blue-600 hover:!bg-blue-700 transition-all shadow-xl shadow-blue-500/20" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs font-bold text-slate-500">
            Have an account? <Link to="/login" className="text-blue-600 hover:text-blue-700 transition-colors">Sign in</Link>
          </p>
        </div>

      </div>

      {}
      <div className="hidden lg:flex flex-1 p-8 bg-[#2563eb] relative overflow-hidden">
        <div className="w-full h-full flex flex-col items-center justify-center relative z-10 text-white text-center">
          <h2 className="text-[2.5rem] font-bold leading-tight mb-3 max-w-lg">
            The simplest way to manage your workforce
          </h2>
          <p className="text-blue-100 text-base font-medium mb-12 opacity-80">
            Enter your information to get started
          </p>

          {}
          <div className="w-full max-w-2xl relative">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden  text-left p-6 text-slate-800 scale-[0.8] origin-center">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">A</div>
                  <span className="font-bold text-sm">Dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2 mr-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white"></div>
                    ))}
                    <div className="w-7 h-7 rounded-full bg-blue-50 border-2 border-white text-[10px] font-bold flex items-center justify-center text-blue-600">+2</div>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100">Add members +</button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-5 rounded-xl border border-slate-100 bg-white">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Productive Time / Day</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-black">12.4 hr</p>
                      <p className="text-[10px] font-bold text-emerald-500 mt-1">+23% last week</p>
                    </div>
                    <div className="w-24 h-12 flex items-end gap-1">
                      {[30, 60, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-100 rounded-t-sm" style={{ height: `${h}%` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-5 rounded-xl border border-slate-100 bg-white">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Focused Time</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-black">8.5 hr</p>
                      <p className="text-[10px] font-bold text-amber-500 mt-1">+18% last week</p>
                    </div>
                    <div className="w-20 h-20 rounded-full border-[6px] border-blue-600 border-r-slate-100 rotate-[45deg]"></div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-900 mb-4">Team's Utilization</p>
                <div className="space-y-4">
                  {[
                    { name: 'Marketing', status: 'HIGH', ut: '40.00%', load: '20.00%', color: 'bg-indigo-100 text-indigo-600' },
                    { name: 'Customer Success', status: 'MEDIUM', ut: '25.00%', load: '30.00%', color: 'bg-amber-100 text-amber-600' },
                    { name: 'Dev Team', status: 'LOW', ut: '02.00%', load: '60.00%', color: 'bg-rose-100 text-rose-600' },
                  ].map((team, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] font-bold text-slate-500 border-b border-slate-50 pb-3">
                      <div className="flex items-center gap-3 w-32">
                        <div className={`w-2.5 h-2.5 rounded-full ${team.color.split(' ')[0]}`}></div>
                        <span className="text-slate-900">{team.name}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] ${team.color}`}>{team.status}</span>
                      <span className="w-16 text-right">{team.ut}</span>
                      <span className="w-16 text-right">{team.load}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {}
            <div className="absolute top-1/4 -right-5 bg-white rounded-2xl shadow-2xl p-5 w-72 border border-slate-100 z-20">
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-bold text-slate-900">Add Member</p>
                <Icons.X size={14} className="text-slate-400" />
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <input placeholder="johndoe21@gmail.com" className="w-full text-[10px] p-2 border border-slate-200 rounded-lg pr-16" />
                  <button className="absolute right-1 top-1 bottom-1 px-2.5 bg-blue-600 text-white text-[8px] font-bold rounded-md">Send Invite</button>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Members</p>
                <div className="space-y-2">
                  {[
                    { n: 'Leslie Alexander', e: 'sanders@example.com', r: 'Owner' },
                    { n: 'Courtney Henry', e: 'debbie@example.com', r: 'Editor' }
                  ].map((m, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-100"></div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-800 leading-none">{m.n}</p>
                          <p className="text-[8px] text-slate-400">{m.e}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-bold text-slate-400">{m.r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="mt-16 flex items-center justify-center gap-10 opacity-60">
            <span className="text-lg font-bold italic tracking-tighter">NexusFlow</span>
            <span className="text-lg font-bold tracking-tighter">CloudVault</span>
            <span className="text-lg font-bold tracking-tighter">DataSync</span>
            <span className="text-lg font-bold tracking-tighter italic">TechBridge</span>
            <span className="text-lg font-bold tracking-tighter">StreamLine</span>
          </div>
        </div>

        {}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-[100px]"></div>
      </div>
    </div>
  );
};

export default SignUp;
