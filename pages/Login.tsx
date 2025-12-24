
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
// Fixed: Correctly import Icons from components/Icons
import { Card, Button, Input } from '../components/UI';
import { Icons } from '../components/Icons';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      if (!email.includes('@')) throw new Error('Invalid enterprise identity format.');
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-enterprise-bg-light dark:bg-enterprise-bg-dark font-sans">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-brand-500/40">
            <Icons.Health size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">PaySignal<span className="text-brand-500">Core</span></h1>
          <p className="text-sm text-slate-500 font-medium">Enterprise Monitoring & Event Processing</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Enterprise Identity"
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={Icons.User}
                error={error ? ' ' : undefined}
              />
              <Input
                label="Secure Credential"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={Icons.Lock}
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-md flex items-center gap-3 text-rose-500 text-xs font-bold uppercase tracking-wider">
                <Icons.Error size={16} />
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors">
                <input type="checkbox" className="rounded border-slate-300 dark:border-slate-700 bg-transparent text-brand-600 focus:ring-brand-500" />
                Persistent Session
              </label>
              <button type="button" className="text-brand-500 hover:underline">Forgot Access?</button>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Icons.Refresh size={16} className="animate-spin" /> Authenticating...
                </div>
              ) : (
                'Sign In to Console'
              )}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-500 font-bold uppercase tracking-widest">
          No account? <Link to="/register" className="text-brand-500 hover:underline">Request Identity</Link>
        </p>

        <div className="pt-8 border-t border-enterprise-border-light dark:border-enterprise-border-dark flex justify-center gap-6">
           <Icons.Dashboard size={20} className="text-slate-300 dark:text-slate-800" />
           <Icons.Payments size={20} className="text-slate-300 dark:text-slate-800" />
           <Icons.Alerts size={20} className="text-slate-300 dark:text-slate-800" />
           <Icons.Health size={20} className="text-slate-300 dark:text-slate-800" />
        </div>
      </div>
    </div>
  );
};

export default Login;
