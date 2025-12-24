import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from './UI';
import { Icons } from './Icons';
import { useAuth } from './AuthContext';
import { authService } from '../services/api';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  action?: {
    label: string;
    path: string;
  };
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to PayFlow Core',
    description: 'Your enterprise monitoring and event processing platform. Let\'s get you started with a quick tour.',
    icon: Icons.Health
  },
  {
    id: 'dashboard',
    title: 'System Overview',
    description: 'Monitor system health, queue depth, and transaction metrics from the dashboard. Real-time updates every 10 seconds.',
    icon: Icons.Dashboard,
    action: {
      label: 'View Dashboard',
      path: '/dashboard'
    }
  },
  {
    id: 'payments',
    title: 'Payment Explorer',
    description: 'Track payment transactions from initiation to completion. Filter by merchant, date, and status.',
    icon: Icons.Payments,
    action: {
      label: 'Explore Payments',
      path: '/payments'
    }
  },
  {
    id: 'alerts',
    title: 'Alert Management',
    description: 'Monitor and respond to system alerts. Filter by severity and resolve issues quickly.',
    icon: Icons.Alerts,
    action: {
      label: 'View Alerts',
      path: '/alerts'
    }
  },
  {
    id: 'settings',
    title: 'Customize Your Experience',
    description: 'Configure your preferences, theme, and notification settings to match your workflow.',
    icon: Icons.Settings,
    action: {
      label: 'Open Settings',
      path: '/settings'
    }
  }
];

export const Onboarding: React.FC = () => {
  const { user, updatePreferences } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {

    const onboardingComplete = localStorage.getItem('paysignal_onboarding_complete');
    if (onboardingComplete === 'true') {
      setIsComplete(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    localStorage.setItem('paysignal_onboarding_complete', 'true');

    if (user && updatePreferences) {
      try {
        await updatePreferences({
          ...user.preferences,
          onboarding_complete: true
        });
      } catch (error) {
        console.warn('Failed to update onboarding preference:', error);
      }
    }
    
    setIsComplete(true);
    navigate('/dashboard');
  };

  const handleAction = (path: string) => {
    navigate(path);
    handleNext();
  };

  if (isComplete) {
    return null;
  }

  const step = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full relative">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label="Skip onboarding"
        >
          <Icons.X size={20} />
        </button>

        <div className="space-y-6">
          {}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
              <span>Step {currentStep + 1} of {onboardingSteps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {}
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-brand-500/10 text-brand-500 rounded-full flex items-center justify-center mx-auto">
              <step.icon size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {step.title}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {step.description}
            </p>
          </div>

          {}
          {step.action && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={() => handleAction(step.action!.path)}
                className="w-full max-w-xs"
              >
                <Icons.ExternalLink size={16} className="mr-2" />
                {step.action.label}
              </Button>
            </div>
          )}

          {}
          <div className="flex items-center justify-between pt-6 border-t border-enterprise-border-light dark:border-enterprise-border-dark">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={currentStep === 0}
            >
              Skip Tour
            </Button>
            <div className="flex items-center gap-2">
              {onboardingSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-brand-500 w-8'
                      : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
            <Button onClick={handleNext}>
              {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
              <Icons.ChevronRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;

