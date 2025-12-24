import React, { useState } from 'react';
import { Card, Button } from './UI';
import { Icons } from './Icons';
import { useAuth } from './AuthContext';

export const WelcomeBanner: React.FC = () => {
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  const isNewUser = user?.created_at && 
    (Date.now() - new Date(user.created_at).getTime()) < 24 * 60 * 60 * 1000;

  if (isDismissed || !isNewUser) {
    return null;
  }

  return (
    <div className="bg-[#2563eb] rounded-lg p-10 relative overflow-hidden flex flex-col items-start justify-center min-h-[200px] border border-blue-400/20 shadow-none mb-10 mt-8">
      <div className="relative z-10 w-full">
        <h2 className="text-white text-2xl font-extrabold tracking-tight leading-[1.1] mb-4">
          Welcome back
        </h2>
        <p className="text-blue-100/90 text-sm font-medium mb-6">
          Get started by exploring the dashboard, viewing transactions, and setting up your preferences.
          Need help? Check out the Help Center in the header.
        </p>
        <div className="flex justify-end mt-8 mb-4">
          <p className="text-white text-xl font-bold">
            {user?.name || 'User'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            size="sm" 
            className="!rounded-full px-6 py-2 text-sm font-bold flex items-center gap-2 shadow-none hover:bg-slate-50"
            onClick={() => setIsDismissed(true)}
          >
            Got it
            <div className="w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center text-white">
              <Icons.ChevronRight size={12} />
            </div>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white hover:bg-white/10"
            onClick={() => {
              localStorage.removeItem('paysignal_onboarding_complete');
              window.location.reload();
            }}
          >
            Take Tour
          </Button>
        </div>
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-4 right-4 w-9 h-9 rounded-lg border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors flex-shrink-0 z-10"
        aria-label="Dismiss"
      >
        <Icons.X size={18} />
      </button>
    </div>
  );
};

export default WelcomeBanner;

