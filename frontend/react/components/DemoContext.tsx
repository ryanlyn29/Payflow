import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  mockData: any;
  startDemo: () => void;
  stopDemo: () => void;
  setMockData: (data: any) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [mockData, setMockDataState] = useState<any>(null);

  const startDemo = () => {
    setIsDemoMode(true);
  };

  const stopDemo = () => {
    setIsDemoMode(false);
    setMockDataState(null);
  };

  const setMockData = (data: any) => {
    setMockDataState(data);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, mockData, startDemo, stopDemo, setMockData }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within DemoProvider');
  }
  return context;
};

