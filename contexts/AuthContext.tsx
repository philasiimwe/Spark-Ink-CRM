
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, metadata?: any) => Promise<any>;
    signIn: (email: string, password: string) => Promise<any>;
    signInWithGoogle: () => Promise<any>;
    signInWithMicrosoft: () => Promise<any>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<any>;
    updatePassword: (newPassword: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        user,
        session,
        loading,
        signUp: auth.signUp,
        signIn: auth.signIn,
        signInWithGoogle: auth.signInWithGoogle,
        signInWithMicrosoft: auth.signInWithMicrosoft,
        signOut: async () => {
            await auth.signOut();
        },
        resetPassword: auth.resetPassword,
        updatePassword: auth.updatePassword
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Protected Route Component
export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login
        window.location.href = '/login';
        return null;
    }

    return <>{children}</>;
}

// Check if user has specific organization role
export function useHasRole(requiredRole: string | string[]) {
    const { user } = useAuth();
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single()
                .then(({ data }) => setUserRole(data?.role || null));
        }
    }, [user]);

    if (Array.isArray(requiredRole)) {
        return requiredRole.includes(userRole || '');
    }
    return userRole === requiredRole;
}
