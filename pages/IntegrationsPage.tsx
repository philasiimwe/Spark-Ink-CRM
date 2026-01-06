// Email Integration Settings Page
// Allows users to connect/disconnect Gmail and Outlook accounts

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { initiateGmailAuth, initiateOutlookAuth, get EmailProvider, disconnectProvider } from '../lib/integrations/email-oauth';

export default function IntegrationsPage() {
    const [gmailConnected, setGmailConnected] = useState(false);
    const [outlookConnected, setOutlookConnected] = useState(false);
    const [gmailEmail, setGmailEmail] = useState('');
    const [outlookEmail, setOutlookEmail] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkConnections();
    }, []);

    async function checkConnections() {
        setLoading(true);
        try {
            const gmail = await getEmailProvider('gmail');
            if (gmail) {
                setGmailConnected(true);
                setGmailEmail(gmail.email);
            }

            const outlook = await getEmailProvider('outlook');
            if (outlook) {
                setOutlookConnected(true);
                setOutlookEmail(outlook.email);
            }
        } catch (err) {
            console.error('Error checking connections:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleGmailConnect() {
        try {
            await initiateGmailAuth();
        } catch (err: any) {
            alert(`Failed to connect Gmail: ${err.message}`);
        }
    }

    async function handleOutlookConnect() {
        try {
            await initiateOutlookAuth();
        } catch (err: any) {
            alert(`Failed to connect Outlook: ${err.message}`);
        }
    }

    async function handleGmailDisconnect() {
        if (confirm('Are you sure you want to disconnect Gmail?')) {
            try {
                await disconnectProvider('gmail');
                setGmailConnected(false);
                setGmailEmail('');
            } catch (err: any) {
                alert(`Failed to disconnect Gmail: ${err.message}`);
            }
        }
    }

    async function handleOutlookDisconnect() {
        if (confirm('Are you sure you want to disconnect Outlook?')) {
            try {
                await disconnectProvider('outlook');
                setOutlookConnected(false);
                setOutlookEmail('');
            } catch (err: any) {
                alert(`Failed to disconnect Outlook: ${err.message}`);
            }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Integrations</h1>
                    <p className="text-gray-600">Connect your email accounts to send and receive emails directly from the CRM</p>
                </div>

                <div className="space-y-6">
                    {/* Gmail Integration */}
                    <div className="card p-6 hover-lift">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-yellow-500 rounded-lg flex items-center justify-center">
                                    <Mail className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        Gmail
                                        {gmailConnected && (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        )}
                                    </h3>
                                    {gmailConnected ? (
                                        <p className="text-sm text-gray-600">{gmailEmail}</p>
                                    ) : (
                                        <p className="text-sm text-gray-600">Not connected</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                {gmailConnected ? (
                                    <button
                                        onClick={handleGmailDisconnect}
                                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                                    >
                                        Disconnect
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleGmailConnect}
                                        className="btn btn-primary px-6 py-2 ripple"
                                    >
                                        Connect Gmail
                                    </button>
                                )}
                            </div>
                        </div>

                        {!gmailConnected && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                        Send and receive emails
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                        Track email opens and clicks
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                        Sync email conversations with deals
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                        Automated email follow-ups
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Outlook Integration */}
                    <div className="card p-6 hover-lift">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-sky-500 rounded-lg flex items-center justify-center">
                                    <Mail className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        Outlook / Microsoft 365
                                        {outlookConnected && (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        )}
                                    </h3>
                                    {outlookConnected ? (
                                        <p className="text-sm text-gray-600">{outlookEmail}</p>
                                    ) : (
                                        <p className="text-sm text-gray-600">Not connected</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                {outlookConnected ? (
                                    <button
                                        onClick={handleOutlookDisconnect}
                                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                                    >
                                        Disconnect
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleOutlookConnect}
                                        className="btn-primary px-6 py-2 ripple border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50"
                                    >
                                        Connect Outlook
                                    </button>
                                )}
                            </div>
                        </div>

                        {!outlookConnected && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2">Features:</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                        Send and receive emails
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                        Calendar integration (coming soon)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                        Teams integration (coming soon)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                        Contact sync
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Information Card */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-blue-900 mb-1">Privacy & Security</p>
                                <p className="text-blue-700">
                                    Your email credentials are securely stored and encrypted. We only request the minimum permissions needed
                                    to send/receive emails. You can disconnect at any time.
                                </p>
                                <a
                                    href="/privacy"
                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium mt-2"
                                >
                                    Learn more about data privacy
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
