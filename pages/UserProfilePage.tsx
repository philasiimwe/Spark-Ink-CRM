// User Profile Management Component

import React, { useState, useEffect } from 'react';
import { User, Mail, Building, Phone, Globe, Save, Loader2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/usePermissions';

interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    phone?: string;
    job_title?: string;
    timezone: string;
    locale: string;
    organization_name?: string;
}

export default function UserProfilePage() {
    const { user: currentUser } = useCurrentUser();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (currentUser) {
            loadProfile();
        }
    }, [currentUser]);

    async function loadProfile() {
        try {
            const { data, error: fetchError } = await supabase
                .from('users')
                .select(`
          id,
          email,
          first_name,
          last_name,
          avatar_url,
          phone,
          job_title,
          timezone,
          locale,
          organization:organizations(name)
        `)
                .eq('id', currentUser?.id)
                .single();

            if (fetchError) throw fetchError;

            // Handle organization data which could be array or object
            let orgName = '';
            if (data.organization) {
                if (Array.isArray(data.organization) && data.organization.length > 0) {
                    orgName = (data.organization[0] as any)?.name || '';
                } else if (!Array.isArray(data.organization)) {
                    orgName = (data.organization as any)?.name || '';
                }
            }

            setProfile({
                ...data,
                organization_name: orgName
            });
        } catch (err: any) {
            setError(err.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!profile) return;

        setSaving(true);
        setError('');
        setSuccess(false);

        try {
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    phone: profile.phone,
                    job_title: profile.job_title,
                    timezone: profile.timezone,
                    locale: profile.locale,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.id);

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    }

    function updateProfile(field: keyof UserProfile, value: any) {
        setProfile(prev => prev ? { ...prev, [field]: value } : null);
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
                    <p className="text-gray-600">Unable to load your profile information.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                            <p className="text-gray-600">Manage your account information</p>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-lg">
                        <div className="flex items-center">
                            <Check className="h-5 w-5 text-green-400 mr-3" />
                            <p className="text-green-700 font-medium">Profile updated successfully!</p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-lg">
                        <div className="flex items-center">
                            <X className="h-5 w-5 text-red-400 mr-3" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Profile Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-6">
                    {/* Read-only Fields */}
                    <div className="pb-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Mail className="h-4 w-4 inline mr-2" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Contact support to change your email</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Building className="h-4 w-4 inline mr-2" />
                                    Organization
                                </label>
                                <input
                                    type="text"
                                    value={profile.organization_name || 'Not assigned'}
                                    disabled
                                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    value={profile.first_name || ''}
                                    onChange={(e) => updateProfile('first_name', e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    value={profile.last_name || ''}
                                    onChange={(e) => updateProfile('last_name', e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Phone className="h-4 w-4 inline mr-2" />
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={profile.phone || ''}
                                    onChange={(e) => updateProfile('phone', e.target.value)}
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Job Title
                                </label>
                                <input
                                    type="text"
                                    value={profile.job_title || ''}
                                    onChange={(e) => updateProfile('job_title', e.target.value)}
                                    placeholder="e.g., Sales Manager"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="space-y-6 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Globe className="h-4 w-4 inline mr-2" />
                                    Timezone
                                </label>
                                <select
                                    value={profile.timezone}
                                    onChange={(e) => updateProfile('timezone', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="UTC">UTC</option>
                                    <option value="America/New_York">Eastern Time</option>
                                    <option value="America/Chicago">Central Time</option>
                                    <option value="America/Denver">Mountain Time</option>
                                    <option value="America/Los_Angeles">Pacific Time</option>
                                    <option value="Europe/London">London</option>
                                    <option value="Europe/Paris">Paris</option>
                                    <option value="Asia/Tokyo">Tokyo</option>
                                    <option value="Australia/Sydney">Sydney</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Language
                                </label>
                                <select
                                    value={profile.locale}
                                    onChange={(e) => updateProfile('locale', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="en-US">English (US)</option>
                                    <option value="en-GB">English (UK)</option>
                                    <option value="es-ES">Español</option>
                                    <option value="fr-FR">Français</option>
                                    <option value="de-DE">Deutsch</option>
                                    <option value="ja-JP">日本語</option>
                                    <option value="zh-CN">中文</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={loadProfile}
                            disabled={saving}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Additional Links */}
                <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h3>
                    <div className="space-y-3">
                        <a
                            href="/settings/2fa"
                            className="block px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">Two-Factor Authentication</span>
                                <span className="text-sm text-gray-500">→</span>
                            </div>
                        </a>
                        <a
                            href="/settings/password"
                            className="block px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">Change Password</span>
                                <span className="text-sm text-gray-500">→</span>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
