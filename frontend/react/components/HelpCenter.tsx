import React, { useState } from 'react';
import { Card, Button, Modal } from './UI';
import { Icons } from './Icons';

interface HelpSection {
  id: string;
  title: string;
  icon: any;
  content: React.ReactNode;
}

const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Icons.Dashboard,
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-extrabold text-slate-900 mb-2 tracking-tight">Dashboard Overview</h4>
          <p className="text-sm text-slate-600 font-medium">
            The dashboard provides real-time metrics for system health, queue depth, latency, and transaction volume.
            Data refreshes automatically every 10 seconds.
          </p>
        </div>
        <div>
          <h4 className="font-extrabold text-slate-900 mb-2 tracking-tight">Key Metrics</h4>
          <ul className="text-sm text-slate-600 font-medium space-y-1 list-disc list-inside">
            <li><strong>Health Score:</strong> Overall system health percentage</li>
            <li><strong>Queue Depth:</strong> Number of messages in the processing queue</li>
            <li><strong>Avg Latency:</strong> Average response time for API requests</li>
            <li><strong>Total Daily Vol:</strong> Total transaction volume processed today</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'payments',
    title: 'Payment Explorer',
    icon: Icons.Payments,
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2">Transaction Lifecycle</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Track payment transactions from initiation to completion. Each transaction goes through states:
            pending → processing → completed/failed/cancelled.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2">Filtering & Search</h4>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>Search by transaction ID, merchant ID, or payer ID</li>
            <li>Filter by date range</li>
            <li>Click on any transaction to view detailed audit logs</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'alerts',
    title: 'Alert Management',
    icon: Icons.Alerts,
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2">Alert Severity Levels</h4>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li><strong>Critical:</strong> Requires immediate attention</li>
            <li><strong>High:</strong> Important issue that should be addressed soon</li>
            <li><strong>Medium:</strong> Moderate issue that can be reviewed</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2">Alert Actions</h4>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li><strong>Acknowledge:</strong> Mark alert as reviewed</li>
            <li><strong>View Incident:</strong> Open detailed incident view</li>
            <li><strong>Silence:</strong> Temporarily suppress alert notifications</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'system-health',
    title: 'System Health',
    icon: Icons.Health,
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2">Health Status</h4>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li><strong>Healthy:</strong> All critical and optional services operational</li>
            <li><strong>Degraded:</strong> Critical services OK, but optional services (Redis) unavailable</li>
            <li><strong>Unhealthy:</strong> Critical services (PostgreSQL) are down</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2">Service Checks</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The health endpoint checks PostgreSQL, Redis, and other services. Each service reports its status,
            response time, and connection details.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'settings',
    title: 'Settings & Preferences',
    icon: Icons.Settings,
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2">User Preferences</h4>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li><strong>Theme:</strong> Switch between light and dark mode</li>
            <li><strong>UI Density:</strong> Choose comfortable or compact layout</li>
            <li><strong>Notifications:</strong> Enable/disable push notifications</li>
            <li><strong>Default Region:</strong> Set your operational region</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2">Profile Settings</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Update your display name and email in the Profile page. Email changes require verification.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'authentication',
    title: 'Authentication',
    icon: Icons.Lock,
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2">Session Management</h4>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>Access tokens expire after 15 minutes</li>
            <li>Refresh tokens expire after 7 days</li>
            <li>Automatic token refresh on 401 errors</li>
            <li>View and revoke active sessions in Profile</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2">Password Security</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Passwords must be at least 8 characters with uppercase, lowercase, and numbers.
            Use the "Forgot Password" link if you need to reset your password.
          </p>
        </div>
      </div>
    )
  }
];

export const HelpCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const selectedContent = helpSections.find(s => s.id === selectedSection);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
        data-demo="help-center"
      >
        <Icons.Info size={16} />
        Help Center
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSelectedSection(null);
        }}
        title="Help Center"
        actions={
          <Button onClick={() => {
            setIsOpen(false);
            setSelectedSection(null);
          }}>
            Close
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {helpSections.map((section) => (
            <div
              key={section.id}
              className="bg-white border border-slate-200 rounded-lg p-5 cursor-pointer hover:border-slate-300 transition-all shadow-none"
              onClick={() => setSelectedSection(selectedSection === section.id ? null : section.id)}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-50 text-[#2563eb] rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-100">
                  <section.icon size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-slate-900 mb-1 tracking-tight">
                    {section.title}
                  </h3>
                  {selectedSection === section.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      {section.content}
                    </div>
                  )}
                </div>
                <Icons.ChevronRight
                  size={18}
                  className={`text-slate-300 transition-transform ${
                    selectedSection === section.id ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default HelpCenter;

