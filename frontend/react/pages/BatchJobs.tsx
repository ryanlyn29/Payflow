import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/UI';
import { Icons } from '../components/Icons';
import { getBatchJobs } from '../services/api';

interface BatchJob {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'pending' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  progress?: number;
  error_message?: string;
}

const BatchJobs: React.FC = () => {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(true);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const data = await getBatchJobs();
      setJobs(data.jobs || []);
    } catch (error: any) {
      console.error('Failed to fetch batch jobs:', error);
      setJobs([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    let interval: NodeJS.Timeout | null = null;
    
    if (isRefreshing) {
      interval = setInterval(fetchJobs, 10000); // Poll every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRefreshing]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-10 pb-12 font-['Plus_Jakarta_Sans'] text-slate-900 dark:text-slate-100">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Batch Jobs</h1>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => setRefreshing(!isRefreshing)}
        >
          {isRefreshing ? (
            <>
              <Icons.X size={14} className="mr-2" />
              Stop Refresh
            </>
          ) : (
            <>
              <Icons.Refresh size={14} className="mr-2" />
              Resume Refresh
            </>
          )}
        </Button>
      </div>

      <Card title="Active Jobs" actions={
        <Badge variant="info">{jobs.length} Total</Badge>
      }>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[#2563eb] animate-pulse flex flex-col items-center gap-4">
              <Icons.Refresh size={24} className="animate-spin" />
              <span className="text-xs font-extrabold">Loading Jobs...</span>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-12">
            <Icons.Dashboard size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">No Active Batch Jobs</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">Batch jobs will appear here when scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 flex items-center justify-between shadow-none transition-colors hover:border-slate-300 dark:hover:border-slate-600"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${
                    job.status === 'running' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    job.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    job.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {job.status === 'running' && <Icons.Refresh size={22} className="animate-spin" />}
                    {job.status === 'completed' && <Icons.Success size={22} />}
                    {job.status === 'failed' && <Icons.Error size={22} />}
                    {(job.status === 'pending' || job.status === 'cancelled') && <Icons.Clock size={22} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{job.name}</h4>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Started: {formatDate(job.started_at)}</p>
                    {job.status === 'running' && job.progress !== undefined && (
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#2563eb] transition-all duration-500"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {job.status === 'completed' && job.completed_at && (
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                        Completed: {formatDate(job.completed_at)}
                      </p>
                    )}
                    {job.status === 'failed' && job.error_message && (
                      <p className="text-xs text-rose-600 font-bold mt-1">{job.error_message}</p>
                    )}
                  </div>
                </div>
                <Badge variant={
                  job.status === 'completed' ? 'success' :
                  job.status === 'failed' ? 'error' :
                  job.status === 'running' ? 'info' : 'warning'
                }>
                  {job.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Job Statistics">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Running</span>
              <span className="text-xl font-mono font-extrabold text-[#2563eb]">
                {jobs.filter(j => j.status === 'running').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</span>
              <span className="text-xl font-mono font-extrabold text-emerald-600">
                {jobs.filter(j => j.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Failed</span>
              <span className="text-xl font-mono font-extrabold text-rose-600">
                {jobs.filter(j => j.status === 'failed').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
              <span className="text-xl font-mono font-extrabold text-amber-600">
                {jobs.filter(j => j.status === 'pending').length}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Recent Activity">
          <div className="space-y-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {jobs
              .filter(j => j.status === 'completed' || j.status === 'failed')
              .sort((a, b) => {
                const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
                const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
                return bTime - aTime;
              })
              .slice(0, 5)
              .map(job => (
                <div key={job.id} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                  <span>{job.name}</span>
                  <span className={job.status === 'completed' ? 'text-emerald-600' : 'text-rose-600'}>
                    {job.status}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BatchJobs;

