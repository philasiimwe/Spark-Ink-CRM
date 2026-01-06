// OAuth Callback Handler for Google/Gmail
// Handles the OAuth redirect after user authorizes Gmail access

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleGmailCallback } from '../lib/integrations/email-oauth';
import { LoadingSpinner } from '../components/LoadingSkeletons';

export default function GoogleAuthCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Connecting your Gmail account...');

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Get code and state from URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const state = urlParams.get('state');
                const error = urlParams.get('error');

                if (error) {
                    throw new Error(`Authorization failed: ${error}`);
                }

                if (!code || !state) {
                    throw new Error('Missing authorization code or state');
                }

                setMessage('Exchanging authorization code...');

                // Handle the OAuth callback
                const provider = await handleGmailCallback(code, state);

                setStatus('success');
                setMessage(`Successfully connected ${provider.email}`);

                // Redirect to email inbox after 2 seconds
                setTimeout(() => {
                    navigate('/email/inbox');
                }, 2000);

            } catch (err: any) {
                console.error('Gmail OAuth error:', err);
                setStatus('error');
                setMessage(err.message || 'Failed to connect Gmail account');

                // Redirect back to settings after 3 seconds
                setTimeout(() => {
                    navigate('/settings/integrations');
                }, 3000);
            }
        };

        processCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="card max-w-md w-full p-8 text-center animate-bounce-in">
                {status === 'loading' && (
                    <>
                        <LoadingSpinner size="lg" className="mx-auto mb-6 text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connecting Gmail</h2>
                        <p className="text-gray-600">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-green-900 mb-2">Success!</h2>
                        <p className="text-gray-600">{message}</p>
                        <p className="text-sm text-gray-500 mt-4">Redirecting to inbox...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-red-900 mb-2">Connection Failed</h2>
                        <p className="text-gray-600">{message}</p>
                        <p className="text-sm text-gray-500 mt-4">Redirecting back to settings...</p>
                    </>
                )}
            </div>
        </div>
    );
}
