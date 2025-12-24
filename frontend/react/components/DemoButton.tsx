import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './UI';
import { Icons } from './Icons';
import { useAuth } from './AuthContext';
import { DemoWalkthrough } from './DemoWalkthrough';
import { generateMockTransactions, generateMockAlerts, generateMockHealthStatus, generateMockQueueStats } from '../services/demoService';

let globalDemoData: any = null;
let globalDemoActive = false;
let demoListeners: Array<(active: boolean) => void> = [];

export const setGlobalDemoData = (data: any) => {
  globalDemoData = data;
  globalDemoActive = true;
  localStorage.setItem('demo_mode', 'true');
  localStorage.setItem('demo_data', JSON.stringify(data));
  demoListeners.forEach(listener => listener(true));
};

export const getGlobalDemoData = () => {
  if (!globalDemoActive) {
    const stored = localStorage.getItem('demo_data');
    if (stored) {
      globalDemoData = JSON.parse(stored);
      globalDemoActive = true;
    }
  }
  return globalDemoData;
};

export const clearGlobalDemoData = () => {
  globalDemoData = null;
  globalDemoActive = false;
  localStorage.removeItem('demo_mode');
  localStorage.removeItem('demo_data');
  demoListeners.forEach(listener => listener(false));
};

export const isDemoMode = () => {
  return globalDemoActive || localStorage.getItem('demo_mode') === 'true';
};

export const subscribeToDemoState = (listener: (active: boolean) => void) => {
  demoListeners.push(listener);
  return () => {
    demoListeners = demoListeners.filter(l => l !== listener);
  };
};

export const DemoButton: React.FC = () => {
  const [isDemoActive, setIsDemoActive] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = subscribeToDemoState(setIsDemoActive);
    return unsubscribe;
  }, []);

  const handleStartDemo = () => {

    const mockData = {
      transactions: generateMockTransactions(25),
      alerts: generateMockAlerts(15),
      health: generateMockHealthStatus(),
      queueStats: generateMockQueueStats()
    };
    
    setGlobalDemoData(mockData);

    if (user) {
      navigate('/dashboard');
    }
  };

  const handleCompleteDemo = () => {
    clearGlobalDemoData();
  };

  return (
    <>
      <Button
        variant="outline"
        size="md"
        onClick={handleStartDemo}
        className="flex items-center gap-2"
      >
        <Icons.Play size={14} />
        Start Demo
      </Button>
      <DemoWalkthrough 
        isActive={isDemoActive} 
        onComplete={handleCompleteDemo}
        onSetMockData={setGlobalDemoData}
      />
    </>
  );
};

