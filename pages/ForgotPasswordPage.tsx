// Enhanced Forgot Password Page

import React, { useState } from 'react';
import { Mail, ArrowLeft, Check, Loader2, AlertTriangle } from 'lucide-react';
import { auth } from '../lib/supabase';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error: resetError } = await auth.resetPassword(email);

            if (resetError) {
                throw resetError;
            }

            setSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                        <p className="text-gray-600 mb-6">
                            We've sent a password reset link to <strong>{email}</strong>
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Click the link in the email to reset your password. The link will expire in 1 hour.
                        </p>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Return to Login
                        </button>
                        <button
                            onClick={() => setSent(false)}
                            className="w-full mt-3 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Try Different Email
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="mb-6">
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back to Login
                    </button>
                </div>

                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <Mail className="h-8 w-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
                    <p className="text-gray-600">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="h-5 w-5" />
                                Send Reset Link
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Remember your password?{' '}
                        <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
