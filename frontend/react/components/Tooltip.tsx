import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 200,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = triggerRect.top + scrollY - tooltipRect.height - 8;
          left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = triggerRect.bottom + scrollY + 8;
          left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.left + scrollX - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.right + scrollX + 8;
          break;
      }

      const padding = 8;
      if (top < scrollY + padding) top = scrollY + padding;
      if (left < scrollX + padding) left = scrollX + padding;
      if (left + tooltipRect.width > scrollX + window.innerWidth - padding) {
        left = scrollX + window.innerWidth - tooltipRect.width - padding;
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-3 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-800 rounded-md shadow-lg pointer-events-none border border-slate-700 ${className}`}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`
          }}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-slate-900 dark:bg-slate-800 border border-slate-700 transform rotate-45 ${
              position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-0 border-l-0' :
              position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2 border-b-0 border-r-0' :
              position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2 border-l-0 border-b-0' :
              'left-[-4px] top-1/2 -translate-y-1/2 border-r-0 border-t-0'
            }`}
          />
        </div>
      )}
    </>
  );
};

interface HelpIconProps {
  content: string | React.ReactNode;
  className?: string;
}

export const HelpIcon: React.FC<HelpIconProps> = ({ content, className = '' }) => {
  return (
    <Tooltip content={content} position="right" delay={100}>
      <button
        type="button"
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors ${className}`}
        aria-label="Help"
      >
        <Icons.Info size={12} />
      </button>
    </Tooltip>
  );
};

