// Session Management Utilities

import { supabase } from '../supabase';
import React from 'react';

export interface SessionInfo {
    userId: string;
    email: string;
    expiresAt: number;
    refreshToken: string;
    isValid: boolean;
}

// Get current session information
export async function getSessionInfo(): Promise<SessionInfo | null> {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            return null;
        }

        return {
            userId: session.user.id,
            email: session.user.email || '',
            expiresAt: session.expires_at || 0,
            refreshToken: session.refresh_token,
            isValid: true
        };
    } catch (error) {
        console.error('Error getting session info:', error);
        return null;
    }
}

// Check if session is expiring soon (within next 5 minutes)
export async function isSessionExpiringSoon(): Promise<boolean> {
    const session = await getSessionInfo();
    if (!session) return true;

    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    return session.expiresAt < fiveMinutesFromNow;
}

// Refresh session if needed
export async function refreshSessionIfNeeded(): Promise<boolean> {
    const expiringSoon = await isSessionExpiringSoon();

    if (expiringSoon) {
        try {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
                console.error('Error refreshing session:', error);
                return false;
            }
            return !!data.session;
        } catch (error) {
            console.error('Error refreshing session:', error);
            return false;
        }
    }

    return true;
}

// Set up auto-refresh timer
export function setupSessionAutoRefresh(intervalMs: number = 4 * 60 * 1000): () => void {
    const interval = setInterval(async () => {
        await refreshSessionIfNeeded();
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
}

// Handle session expiry
export async function handleSessionExpiry(): Promise<void> {
    // Clear any local state
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to login
    window.location.href = '/login?session_expired=true';
}

// Listen for auth state changes
export function onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
        // Handle different auth events
        switch (event) {
            case 'SIGNED_IN':
                console.log('User signed in');
                break;
            case 'SIGNED_OUT':
                handleSessionExpiry();
                break;
            case 'TOKEN_REFRESHED':
                console.log('Token refreshed');
                break;
            case 'USER_UPDATED':
                console.log('User updated');
                break;
        }

        // Call custom callback
        callback(event, session);
    });
}

// Get time until session expires (in seconds)
export async function getTimeUntilExpiry(): Promise<number | null> {
    const session = await getSessionInfo();
    if (!session) return null;

    const now = Date.now();
    const expiresAt = session.expiresAt * 1000; // Convert to milliseconds
    const secondsUntilExpiry = Math.floor((expiresAt - now) / 1000);

    return Math.max(0, secondsUntilExpiry);
}

// Check if user has active session
export async function hasActiveSession(): Promise<boolean> {
    const session = await getSessionInfo();
    return session !== null && session.isValid;
}

// Sign out and clear session
export async function signOut(): Promise<void> {
    try {
        await supabase.auth.signOut();
        handleSessionExpiry();
    } catch (error) {
        console.error('Error signing out:', error);
        handleSessionExpiry();
    }
}

// React hook for session management
export function useSession() {
    const [session, setSession] = React.useState<SessionInfo | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // Get initial session
        getSessionInfo().then(info => {
            setSession(info);
            setLoading(false);
        });

        // Set up auto-refresh
        const cleanup = setupSessionAutoRefresh();

        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
            if (supabaseSession) {
                const info = await getSessionInfo();
                setSession(info);
            } else {
                setSession(null);
            }
        });

        return () => {
            cleanup();
            authListener.subscription.unsubscribe();
        };
    }, []);

    return { session, loading, refreshSession: refreshSessionIfNeeded };
}

export default {
    getSessionInfo,
    isSessionExpiringSoon,
    refreshSessionIfNeeded,
    setupSessionAutoRefresh,
    handleSessionExpiry,
    onAuthStateChange,
    getTimeUntilExpiry,
    hasActiveSession,
    signOut,
    useSession
};
