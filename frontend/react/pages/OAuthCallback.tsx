import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useNotification } from '../components/NotificationSystem';
import { Icons } from '../components/Icons';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithOAuth } = useAuth();
  const { showNotification } = useNotification();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const provider = searchParams.get('provider');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(`OAuth authentication failed: ${errorParam}`);
          setStatus('error');
          showNotification({
            type: 'error',
            message: `OAuth authentication failed: ${errorParam}`,
            duration: 5000,
          });
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!accessToken || !refreshToken) {
          setError('Missing authentication tokens. Please try again.');
          setStatus('error');
          showNotification({
            type: 'error',
            message: 'Missing authentication tokens. Please try again.',
            duration: 5000,
          });
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        await loginWithOAuth(accessToken, refreshToken);
        
        setStatus('success');
        showNotification({
          type: 'success',
          message: `Successfully signed in with ${provider || 'Google'}!`,
          duration: 3000,
        });

        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'An unexpected error occurred');
        setStatus('error');
        showNotification({
          type: 'error',
          message: err.message || 'An unexpected error occurred',
          duration: 5000,
        });
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, loginWithOAuth, showNotification]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
      <div className="text-center p-8">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Completing Sign In...
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Please wait while we complete your authentication.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icons.CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Sign In Successful!
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icons.X size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Sign In Failed
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {error || 'An error occurred during authentication.'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Redirecting to login page...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;

