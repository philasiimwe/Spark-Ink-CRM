// Two-Factor Authentication Setup Page

import React, { useState, useEffect } from 'react';
import { Shield, Copy, Check, Download, AlertTriangle, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import {
    setupTwoFactor,
    verifyTwoFactorToken,
    enableTwoFactor,
    disableTwoFactor,
    getTwoFactorStatus,
    regenerateBackupCodes,
    TwoFactorStatus
} from '../lib/auth/two-factor';
import { useCurrentUser } from '../hooks/usePermissions';

export default function TwoFactorSetupPage() {
    const { user } = useCurrentUser();
    const [status, setStatus] = useState<TwoFactorStatus>({ enabled: false });
    const [loading, setLoading] = useState(true);
    const [setupData, setSetupData] = useState<{ qrCodeUrl: string; secret: string; backupCodes: string[] } | null>(null);
    const [qrCodeImage, setQrCodeImage] = useState<string>('');
    const [verificationCode, setVerificationCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [copiedSecret, setCopiedSecret] = useState(false);
    const [copiedCodes, setCopiedCodes] = useState(false);

    useEffect(() => {
        loadStatus();
    }, []);

    useEffect(() => {
        if (setupData?.qrCodeUrl) {
            generateQRCode(setupData.qrCodeUrl);
        }
    }, [setupData]);

    async function loadStatus() {
        try {
            const twoFactorStatus = await getTwoFactorStatus();
            setStatus(twoFactorStatus);
        } catch (err) {
            console.error('Error loading 2FA status:', err);
        } finally {
            setLoading(false);
        }
    }

    async function generateQRCode(url: string) {
        try {
            const qrCode = await QRCode.toDataURL(url);
            setQrCodeImage(qrCode);
        } catch (err) {
            console.error('Error generating QR code:', err);
        }
    }

    async function handleSetup() {
        if (!user?.email) return;

        setLoading(true);
        setError('');

        try {
            const data = await setupTwoFactor(user.email);
            setSetupData(data);
        } catch (err: any) {
            setError(err.message || 'Failed to setup 2FA');
        } finally {
            setLoading(false);
        }
    }

    async function handleVerify() {
        if (!verificationCode || verificationCode.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }

        setVerifying(true);
        setError('');

        try {
            const isValid = await verifyTwoFactorToken(verificationCode);

            if (isValid) {
                await enableTwoFactor();
                setStatus({ enabled: true });
                setSetupData(null);
                setVerificationCode('');
            } else {
                setError('Invalid code. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setVerifying(false);
        }
    }

    async function handleDisable() {
        if (!confirm('Are you sure you want to disable two-factor authentication?')) {
            return;
        }

        setLoading(true);
        try {
            await disableTwoFactor();
            setStatus({ enabled: false });
        } catch (err: any) {
            setError(err.message || 'Failed to disable 2FA');
        } finally {
            setLoading(false);
        }
    }

    async function handleRegenerateBackupCodes() {
        if (!confirm('This will invalidate your current backup codes. Continue?')) {
            return;
        }

        setLoading(true);
        try {
            const newCodes = await regenerateBackupCodes();
            setSetupData(prev => prev ? { ...prev, backupCodes: newCodes } : null);
        } catch (err: any) {
            setError(err.message || 'Failed to regenerate backup codes');
        } finally {
            setLoading(false);
        }
    }

    function copyToClipboard(text: string, setCopied: (val: boolean) => void) {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function downloadBackupCodes() {
        if (!setupData?.backupCodes) return;

        const content = `Nexus CRM - Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${setupData.backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nexus-crm-backup-codes.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    if (loading && !setupData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Shield className="h-8 w-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h1>
                    </div>
                    <p className="text-gray-600">
                        Add an extra layer of security to your account with two-factor authentication.
                    </p>
                </div>

                {/* Status */}
                {status.enabled && !setupData && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-lg">
                        <div className="flex items-start">
                            <Check className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
                            <div>
                                <h3 className="text-sm font-medium text-green-800">2FA Enabled</h3>
                                <p className="mt-2 text-sm text-green-700">
                                    Your account is protected with two-factor authentication.
                                    {status.lastVerified && (
                                        <span className="block mt-1">
                                            Last verified: {new Date(status.lastVerified).toLocaleString()}
                                        </span>
                                    )}
                                </p>
                                <div className="mt-4 space-x-3">
                                    <button
                                        onClick={handleRegenerateBackupCodes}
                                        className="text-sm text-green-800 underline hover:text-green-900"
                                    >
                                        Regenerate Backup Codes
                                    </button>
                                    <button
                                        onClick={handleDisable}
                                        className="text-sm text-red-600 underline hover:text-red-700"
                                    >
                                        Disable 2FA
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Setup Flow */}
                {!status.enabled && !setupData && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Enable Two-Factor Authentication</h2>
                        <p className="text-gray-600 mb-6">
                            Use an authenticator app like Google Authenticator, Authy, or 1Password to generate verification codes.
                        </p>
                        <button
                            onClick={handleSetup}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                        >
                            {loading ? 'Setting up...' : 'Start Setup'}
                        </button>
                    </div>
                )}

                {/* QR Code & Setup */}
                {setupData && (
                    <div className="space-y-6">
                        {/* Step 1: Scan QR Code */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Scan QR Code</h2>
                            <p className="text-gray-600 mb-4">
                                Scan this QR code with your authenticator app:
                            </p>
                            {qrCodeImage && (
                                <div className="flex justify-center mb-4">
                                    <img src={qrCodeImage} alt="QR Code" className="w-64 h-64" />
                                </div>
                            )}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">Or enter this code manually:</p>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 bg-white px-4 py-2 rounded border text-sm font-mono">
                                        {setupData.secret}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(setupData.secret, setCopiedSecret)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                    >
                                        {copiedSecret ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Verify */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Verify Code</h2>
                            <p className="text-gray-600 mb-4">
                                Enter the 6-digit code from your authenticator app:
                            </p>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                className="w-full px-4 py-3 border rounded-lg text-center text-2xl font-mono tracking-widest mb-4"
                                maxLength={6}
                            />
                            {error && (
                                <div className="flex items-start gap-2 text-red-600 text-sm mb-4">
                                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}
                            <button
                                onClick={handleVerify}
                                disabled={verifying || verificationCode.length !== 6}
                                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                            >
                                {verifying ? 'Verifying...' : 'Verify and Enable'}
                            </button>
                        </div>

                        {/* Step 3: Backup Codes */}
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
                            <div className="flex items-start">
                                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-yellow-800 mb-2">Save Your Backup Codes</h3>
                                    <p className="text-sm text-yellow-700 mb-4">
                                        Each code can be used once if you lose access to your authenticator app. Store them securely.
                                    </p>
                                    <div className="bg-white p-4 rounded-lg mb-4">
                                        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                                            {setupData.backupCodes.map((code, index) => (
                                                <div key={index} className="bg-gray-50 px-3 py-2 rounded">
                                                    {code}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => copyToClipboard(setupData.backupCodes.join('\n'), setCopiedCodes)}
                                            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                                        >
                                            {copiedCodes ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            Copy Codes
                                        </button>
                                        <button
                                            onClick={downloadBackupCodes}
                                            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
