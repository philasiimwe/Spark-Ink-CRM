
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        // Wait a moment for the session to be established
        const timer = setTimeout(() => {
            if (user) {
                navigate('/');
            } else {
                navigate('/login');
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [user, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
            <div className="text-center">
                <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-white font-medium text-lg">Completing authentication...</p>
            </div>
        </div>
    );
};

export default AuthCallback;
