
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        flowType: 'pkce'
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'x-application-name': 'nexus-crm'
        }
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

// Type-safe database types (to be generated from Supabase)
export type Database = {
    public: {
        Tables: {
            organizations: any;
            users: any;
            contacts: any;
            accounts: any;
            deals: any;
            pipelines: any;
            activities: any;
            emails: any;
            email_templates: any;
            email_sequences: any;
            products: any;
            documents: any;
            workflows: any;
            webhooks: any;
            notes: any;
            audit_logs: any;
            reports: any;
            integrations: any;
            notifications: any;
        };
    };
};

// Auth helper functions
export const auth = {
    signUp: async (email: string, password: string, metadata?: any) => {
        return supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
    },

    signIn: async (email: string, password: string) => {
        return supabase.auth.signInWithPassword({
            email,
            password
        });
    },

    signInWithGoogle: async () => {
        return supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: 'email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly',
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
    },

    signInWithMicrosoft: async () => {
        return supabase.auth.signInWithOAuth({
            provider: 'azure',
            options: {
                scopes: 'email profile Calendars.ReadWrite Mail.Read',
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
    },

    signOut: async () => {
        return supabase.auth.signOut();
    },

    resetPassword: async (email: string) => {
        return supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
    },

    updatePassword: async (newPassword: string) => {
        return supabase.auth.updateUser({
            password: newPassword
        });
    },

    getSession: async () => {
        return supabase.auth.getSession();
    },

    getUser: async () => {
        return supabase.auth.getUser();
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
        return supabase.auth.onAuthStateChange(callback);
    }
};

// Storage helper functions
export const storage = {
    uploadFile: async (bucket: string, path: string, file: File) => {
        return supabase.storage.from(bucket).upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });
    },

    getPublicUrl: (bucket: string, path: string) => {
        return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    },

    downloadFile: async (bucket: string, path: string) => {
        return supabase.storage.from(bucket).download(path);
    },

    deleteFile: async (bucket: string, path: string) => {
        return supabase.storage.from(bucket).remove([path]);
    },

    listFiles: async (bucket: string, folder?: string) => {
        return supabase.storage.from(bucket).list(folder);
    }
};

// Realtime subscriptions
export const subscribeToTable = (
    table: string,
    callback: (payload: any) => void,
    filter?: string
) => {
    const channel = supabase
        .channel(`${table}-changes`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: table,
                filter: filter
            },
            callback
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

export default supabase;
