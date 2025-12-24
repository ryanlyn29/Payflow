
import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  AlertTriangle, 
  RotateCcw, 
  Settings2, 
  Activity, 
  FileText, 
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Search,
  Bell,
  User,
  Menu,
  X,
  RefreshCw,
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  MoreVertical,
  Check,
  Mail,
  Star,
  Lightbulb,
  Zap,
  Crown,
  Calendar,
  Play,
  Pause,
  Info
} from 'lucide-react';

interface IconProps {
  size?: number;
  className?: string;
}

export const Icons = {
  Dashboard: LayoutDashboard,
  Payments: CreditCard,
  Alerts: AlertTriangle,
  Incident: RotateCcw,
  Rules: Settings2,
  Health: Activity,
  Logs: FileText,
  Settings: Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Search,
  Bell,
  User,
  Menu,
  X,
  Refresh: RefreshCw,
  Plus,
  Filter,
  TrendUp: ArrowUpRight,
  TrendDown: ArrowDownRight,
  Clock,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Trash: Trash2,
  Success: CheckCircle2,
  Error: XCircle,
  Warning: AlertCircle,
  Info: HelpCircle,
  More: MoreVertical,
  Check: CheckCircle2,
  Mail,
  Star,
  Lightbulb,
  Lightning: Zap,
  Crown,
  Calendar,
  Play,
  Pause,
  PayFlow: ({ size = 24, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2" y="7" width="20" height="10" rx="5" fill="currentColor" />
      <circle cx="9" cy="12" r="2" fill="white" />
      <circle cx="15" cy="12" r="2" fill="white" />
      <path d="M7 12H17" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  ArrowRight: ({ size = 24, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  ),
  Logo: ({ size = 24, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M20 0L24.4903 15.5097L40 20L24.4903 24.4903L20 40L15.5097 24.4903L0 20L15.5097 15.5097L20 0Z" fill="currentColor"/>
    </svg>
  ),
  Zap,
  Lightning: Zap,
  Figma: ({ size = 16, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z"/>
      <path d="M12 2h3.5a3.5 3.5 0 0 1 0 7H12V2z"/>
      <path d="M12 9h3.5a3.5 3.5 0 0 1 0 7H12V9z"/>
      <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z"/>
      <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 0 1-7 0z"/>
    </svg>
  ),
  Apple: ({ size = 16, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.79 15.25 2.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  )
};
