// OAuth 2.0 Authentication for Gmail and Outlook
// Handles authentication flows, token management, and refresh

import { supabase } from '../supabase';

export interface OAuthTokens {
    access_token: string;
    refresh_token?: string;
    expires_at: number;
    scope: string;
    token_type: string;
}

export interface EmailProvider {
    provider: 'gmail' | 'outlook';
    user_id: string;
    email: string;
    tokens: OAuthTokens;
    is_active: boolean;
}

// Gmail OAuth Configuration
const GMAIL_CONFIG = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/callback/google`,
    scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' '),
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token'
};

// Outlook/Microsoft OAuth Configuration
const OUTLOOK_CONFIG = {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/callback/microsoft`,
    scope: [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/Mail.ReadWrite',
        'https://graph.microsoft.com/User.Read',
        'offline_access'
    ].join(' '),
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token'
};

/**
 * Initialize Gmail OAuth flow
 */
export async function initiateGmailAuth(): Promise<void> {
    const state = generateRandomString(32);
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store code verifier for later use
    sessionStorage.setItem('gmail_code_verifier', codeVerifier);
    sessionStorage.setItem('gmail_state', state);

    const params = new URLSearchParams({
        client_id: GMAIL_CONFIG.clientId,
        redirect_uri: GMAIL_CONFIG.redirectUri,
        response_type: 'code',
        scope: GMAIL_CONFIG.scope,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'consent'
    });

    window.location.href = `${GMAIL_CONFIG.authUrl}?${params.toString()}`;
}

/**
 * Initialize Outlook OAuth flow
 */
export async function initiateOutlookAuth(): Promise<void> {
    const state = generateRandomString(32);
    sessionStorage.setItem('outlook_state', state);

    const params = new URLSearchParams({
        client_id: OUTLOOK_CONFIG.clientId,
        redirect_uri: OUTLOOK_CONFIG.redirectUri,
        response_type: 'code',
        scope: OUTLOOK_CONFIG.scope,
        state,
        response_mode: 'query',
        prompt: 'consent'
    });

    window.location.href = `${OUTLOOK_CONFIG.authUrl}?${params.toString()}`;
}

/**
 * Handle Gmail OAuth callback
 */
export async function handleGmailCallback(code: string, state: string): Promise<EmailProvider> {
    // Verify state
    const storedState = sessionStorage.getItem('gmail_state');
    if (state !== storedState) {
        throw new Error('Invalid state parameter');
    }

    const codeVerifier = sessionStorage.getItem('gmail_code_verifier');
    if (!codeVerifier) {
        throw new Error('Code verifier not found');
    }

    // Exchange code for tokens
    const response = await fetch(GMAIL_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: GMAIL_CONFIG.clientId,
            client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
            code,
            redirect_uri: GMAIL_CONFIG.redirectUri,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to exchange code: ${error.error_description || error.error}`);
    }

    const tokens = await response.json();

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
            Authorization: `Bearer ${tokens.access_token}`
        }
    });

    const userInfo = await userInfoResponse.json();

    // Store provider info in Supabase
    const provider: EmailProvider = {
        provider: 'gmail',
        user_id: (await supabase.auth.getUser()).data.user!.id,
        email: userInfo.email,
        tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + (tokens.expires_in * 1000),
            scope: tokens.scope,
            token_type: tokens.token_type
        },
        is_active: true
    };

    await saveProvider(provider);

    // Clean up session storage
    sessionStorage.removeItem('gmail_code_verifier');
    sessionStorage.removeItem('gmail_state');

    return provider;
}

/**
 * Handle Outlook OAuth callback
 */
export async function handleOutlookCallback(code: string, state: string): Promise<EmailProvider> {
    // Verify state
    const storedState = sessionStorage.getItem('outlook_state');
    if (state !== storedState) {
        throw new Error('Invalid state parameter');
    }

    // Exchange code for tokens
    const response = await fetch(OUTLOOK_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: OUTLOOK_CONFIG.clientId,
            client_secret: import.meta.env.VITE_MICROSOFT_CLIENT_SECRET || '',
            code,
            redirect_uri: OUTLOOK_CONFIG.redirectUri,
            grant_type: 'authorization_code'
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to exchange code: ${error.error_description || error.error}`);
    }

    const tokens = await response.json();

    // Get user info
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
            Authorization: `Bearer ${tokens.access_token}`
        }
    });

    const userInfo = await userInfoResponse.json();

    // Store provider info in Supabase
    const provider: EmailProvider = {
        provider: 'outlook',
        user_id: (await supabase.auth.getUser()).data.user!.id,
        email: userInfo.mail || userInfo.userPrincipalName,
        tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + (tokens.expires_in * 1000),
            scope: tokens.scope,
            token_type: tokens.token_type
        },
        is_active: true
    };

    await saveProvider(provider);

    // Clean up session storage
    sessionStorage.removeItem('outlook_state');

    return provider;
}

/**
 * Refresh access token for a provider
 */
export async function refreshAccessToken(provider: EmailProvider): Promise<OAuthTokens> {
    if (!provider.tokens.refresh_token) {
        throw new Error('No refresh token available');
    }

    const config = provider.provider === 'gmail' ? GMAIL_CONFIG : OUTLOOK_CONFIG;
    const tokenUrl = provider.provider === 'gmail' ? GMAIL_CONFIG.tokenUrl : OUTLOOK_CONFIG.tokenUrl;

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: config.clientId,
            client_secret: provider.provider === 'gmail'
                ? import.meta.env.VITE_GOOGLE_CLIENT_SECRET || ''
                : import.meta.env.VITE_MICROSOFT_CLIENT_SECRET || '',
            refresh_token: provider.tokens.refresh_token,
            grant_type: 'refresh_token'
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to refresh token: ${error.error_description || error.error}`);
    }

    const tokens = await response.json();

    const newTokens: OAuthTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || provider.tokens.refresh_token,
        expires_at: Date.now() + (tokens.expires_in * 1000),
        scope: tokens.scope || provider.tokens.scope,
        token_type: tokens.token_type
    };

    // Update tokens in database
    await updateProviderTokens(provider.user_id, provider.provider, newTokens);

    return newTokens;
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(provider: EmailProvider): Promise<string> {
    // Check if token is expired or about to expire (within 5 minutes)
    if (provider.tokens.expires_at - Date.now() < 5 * 60 * 1000) {
        const newTokens = await refreshAccessToken(provider);
        return newTokens.access_token;
    }

    return provider.tokens.access_token;
}

/**
 * Save email provider to Supabase
 */
async function saveProvider(provider: EmailProvider): Promise<void> {
    const { error } = await supabase
        .from('integrations')
        .upsert({
            organization_id: (await getCurrentOrganizationId()),
            provider: provider.provider,
            config: {
                email: provider.email
            },
            credentials: provider.tokens,
            is_active: provider.is_active,
            created_by: provider.user_id,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'organization_id,provider'
        });

    if (error) {
        throw new Error(`Failed to save provider: ${error.message}`);
    }
}

/**
 * Update provider tokens in Supabase
 */
async function updateProviderTokens(userId: string, provider: 'gmail' | 'outlook', tokens: OAuthTokens): Promise<void> {
    const { error } = await supabase
        .from('integrations')
        .update({
            credentials: tokens,
            updated_at: new Date().toISOString()
        })
        .eq('provider', provider)
        .eq('created_by', userId);

    if (error) {
        throw new Error(`Failed to update tokens: ${error.message}`);
    }
}

/**
 * Get email provider for current user
 */
export async function getEmailProvider(provider: 'gmail' | 'outlook'): Promise<EmailProvider | null> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('provider', provider)
        .eq('created_by', user.id)
        .eq('is_active', true)
        .single();

    if (error || !data) return null;

    return {
        provider,
        user_id: user.id,
        email: data.config.email,
        tokens: data.credentials,
        is_active: data.is_active
    };
}

/**
 * Disconnect email provider
 */
export async function disconnectProvider(provider: 'gmail' | 'outlook'): Promise<void> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
        .from('integrations')
        .update({ is_active: false })
        .eq('provider', provider)
        .eq('created_by', user.id);

    if (error) {
        throw new Error(`Failed to disconnect provider: ${error.message}`);
    }
}

// Helper functions
function generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

async function getCurrentOrganizationId(): Promise<string> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const { data } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    return data?.organization_id || '';
}
