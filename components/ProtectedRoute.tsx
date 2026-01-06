// Protected Route Component for Permission-Based Access Control

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Role, Permission } from '../lib/rbac/permissions';
import { useCurrentUser, usePermission, useHasRole } from '../hooks/usePermissions';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    permission?: Permission;
    role?: Role;
    fallback?: React.ReactNode;
    redirectTo?: string;
}

export function ProtectedRoute({
    children,
    permission,
    role,
    fallback,
    redirectTo = '/unauthorized'
}: ProtectedRouteProps) {
    const { user, loading: userLoading } = useCurrentUser();
    const { hasAccess: permissionGranted, loading: permissionLoading } = usePermission(permission!);
    const { hasRole: roleGranted, loading: roleLoading } = useHasRole(role!);

    // Show loading state while checking auth
    if (userLoading || permissionLoading || roleLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Verifying access...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check permission if specified
    if (permission && !permissionGranted) {
        if (fallback) {
            return <>{fallback}</>;
        }
        return <Navigate to={redirectTo} replace />;
    }

    // Check role if specified
    if (role && !roleGranted) {
        if (fallback) {
            return <>{fallback}</>;
        }
        return <Navigate to={redirectTo} replace />;
    }

    // User has access
    return <>{children}</>;
}

// Unauthorized page component
export function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-6">
                        You don't have permission to access this resource. Please contact your administrator
                        if you believe this is an error.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => window.history.back()}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go Back
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Component to conditionally render based on permission
interface PermissionGateProps {
    children: React.ReactNode;
    permission: Permission;
    fallback?: React.ReactNode;
}

export function PermissionGate({ children, permission, fallback = null }: PermissionGateProps) {
    const { hasAccess, loading } = usePermission(permission);

    if (loading) {
        return null;
    }

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

// Component to conditionally render based on role
interface RoleGateProps {
    children: React.ReactNode;
    role: Role;
    fallback?: React.ReactNode;
}

export function RoleGate({ children, role, fallback = null }: RoleGateProps) {
    const { hasRole, loading } = useHasRole(role);

    if (loading) {
        return null;
    }

    if (!hasRole) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

export default ProtectedRoute;
