import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icons } from './Icons';
import { Button } from './UI';
import { useNotification } from './NotificationSystem';
import { walkthroughSteps, WalkthroughStep, generateMockTransactions, generateMockAlerts, generateMockHealthStatus, generateMockQueueStats } from '../services/demoService';

interface DemoWalkthroughProps {
  isActive: boolean;
  onComplete: () => void;
  onSetMockData: (data: any) => void;
}

export const DemoWalkthrough: React.FC<DemoWalkthroughProps> = ({ isActive, onComplete, onSetMockData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!isActive) return;

    const mockData = {
      transactions: generateMockTransactions(25),
      alerts: generateMockAlerts(15),
      health: generateMockHealthStatus(),
      queueStats: generateMockQueueStats()
    };
    onSetMockData(mockData);

    executeStep(0);
  }, [isActive]);

  const executeStep = async (stepIndex: number) => {
    if (stepIndex >= walkthroughSteps.length) {
      onComplete();
      showNotification({
        type: 'success',
        message: 'Demo walkthrough completed!',
        duration: 5000
      });
      return;
    }

    const step = walkthroughSteps[stepIndex];
    setCurrentStep(stepIndex);

    if (step.target && location.pathname !== step.target) {
      navigate(step.target);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for navigation
    }

    if (step.action) {
      await step.action();
    }

    if (step.highlight) {
      await new Promise(resolve => setTimeout(resolve, 800)); // Wait for element to be available
      const element = document.querySelector(step.highlight);
      if (element) {
        (element as HTMLElement).click();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for modal/action to open

        if (step.closeModal) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait to see the modal content
          
          let closeButton: HTMLElement | null = null;

          const modalContainers = document.querySelectorAll(
            '[role="dialog"], [class*="Modal"], [class*="modal"], [class*="z-[100]"], [class*="z-[110]"]'
          );
          
          for (const modal of modalContainers) {

            const header = modal.querySelector('div:has(h2), div:has([class*="title"])');
            if (header) {

              const buttons = header.querySelectorAll('button');
              for (const btn of buttons) {
                const svg = btn.querySelector('svg');

                if (svg) {
                  const path = svg.querySelector('path');
                  if (path) {
                    const d = path.getAttribute('d') || '';

                    if (d.includes('M') && d.includes('L')) {
                      closeButton = btn;
                      break;
                    }
                  }

                  if (svg.getAttribute('viewBox') === '0 0 24 24') {
                    closeButton = btn;
                    break;
                  }
                }
              }
              if (closeButton) break;
            }
          }

          if (!closeButton) {
            for (const modal of modalContainers) {
              const header = modal.querySelector('div:has(h2)');
              if (header) {
                const buttons = Array.from(header.querySelectorAll('button'));

                const lastButton = buttons[buttons.length - 1];
                if (lastButton && lastButton.querySelector('svg')) {
                  closeButton = lastButton;
                  break;
                }
              }
            }
          }

          if (!closeButton) {
            for (const modal of modalContainers) {
              const buttons = modal.querySelectorAll('button');
              for (const btn of buttons) {
                const text = btn.textContent?.toLowerCase().trim() || '';
                if (text === 'close' || text === 'cancel' || text.includes('close')) {
                  closeButton = btn;
                  break;
                }
              }
              if (closeButton) break;
            }
          }

          if (closeButton) {
            closeButton.click();
            await new Promise(resolve => setTimeout(resolve, 800)); // Wait for modal to close
          } else {

            const escEvent = new KeyboardEvent('keydown', { 
              key: 'Escape', 
              code: 'Escape', 
              keyCode: 27, 
              bubbles: true,
              cancelable: true
            });
            document.dispatchEvent(escEvent);
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
      }
    }

    showNotification({
      type: 'info',
      message: step.description,
      duration: step.waitFor || 5000
    });

    if (!isPaused) {
      setTimeout(() => {
        executeStep(stepIndex + 1);
      }, step.waitFor || 5000);
    }
  };

  const handleNext = () => {
    setIsPaused(false);
    executeStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setIsPaused(false);
    if (currentStep > 0) {
      executeStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
    showNotification({
      type: 'info',
      message: 'Demo walkthrough skipped',
      duration: 3000
    });
  };

  if (!isActive) return null;

  const currentStepData = walkthroughSteps[currentStep];

  return (
    <>
      {}
      <div className="fixed inset-0 z-[200] pointer-events-none">
        {}
        {currentStepData.highlight && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        )}
      </div>

      {}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[201] w-full max-w-2xl px-4 pointer-events-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center">
                  <Icons.Info size={16} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {currentStepData.title}
                </h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {currentStepData.description}
              </p>
              <div className="mt-3 text-xs text-slate-500 dark:text-slate-500">
                Step {currentStep + 1} of {walkthroughSteps.length}
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
            >
              <Icons.X size={16} />
            </button>
          </div>

          {}
          <div className="mb-4">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563eb] transition-all duration-300"
                style={{ width: `${((currentStep + 1) / walkthroughSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <Icons.ChevronLeft size={14} className="mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? (
                  <>
                    <Icons.Play size={14} className="mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Icons.Pause size={14} className="mr-1" />
                    Pause
                  </>
                )}
              </Button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
            >
              {currentStep === walkthroughSteps.length - 1 ? 'Finish' : 'Next'}
              <Icons.ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

