// RBAC Middleware for API and Route Protection

import { supabase } from '../supabase';
import { Role, Permission, hasPermission, canPerformAction } from './permissions';

export interface User {
    id: string;
    email: string;
    role: Role;
    organization_id: string;
    permissions?: Permission[];
}

// Get current authenticated user with role
export async function getCurrentUser(): Promise<User | null> {
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            return null;
        }

        // Fetch user details including role and organization
        const { data: userData, error } = await supabase
            .from('users')
            .select('id, email, role, organization_id, permissions')
            .eq('id', authUser.id)
            .single();

        if (error || !userData) {
            console.error('Error fetching user data:', error);
            return null;
        }

        return {
            id: userData.id,
            email: userData.email,
            role: userData.role as Role,
            organization_id: userData.organization_id,
            permissions: userData.permissions || []
        };
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        return null;
    }
}

// Check if current user has a specific permission
export async function checkPermission(permission: Permission): Promise<boolean> {
    const user = await getCurrentUser();

    if (!user) {
        return false;
    }

    // Check role-based permissions
    const hasRolePermission = hasPermission(user.role, permission);

    // Check custom permissions (overrides)
    const hasCustomPermission = user.permissions?.includes(permission);

    return hasRolePermission || hasCustomPermission || false;
}

// Check multiple permissions (user needs at least one)
export async function checkAnyPermission(permissions: Permission[]): Promise<boolean> {
    const user = await getCurrentUser();

    if (!user) {
        return false;
    }

    for (const permission of permissions) {
        const hasRolePermission = hasPermission(user.role, permission);
        const hasCustomPermission = user.permissions?.includes(permission);

        if (hasRolePermission || hasCustomPermission) {
            return true;
        }
    }

    return false;
}

// Check if user can perform action on a specific resource
export async function checkResourcePermission(
    permission: Permission,
    resourceOwnerId: string
): Promise<boolean> {
    const user = await getCurrentUser();

    if (!user) {
        return false;
    }

    const isOwner = user.id === resourceOwnerId;
    return canPerformAction(user.role, permission, isOwner);
}

// Middleware wrapper for protected operations
export async function requirePermission<T>(
    permission: Permission,
    operation: () => Promise<T>
): Promise<T> {
    const hasAccess = await checkPermission(permission);

    if (!hasAccess) {
        throw new Error(`Permission denied: ${permission} required`);
    }

    return operation();
}

// Middleware wrapper for resource-specific operations
export async function requireResourcePermission<T>(
    permission: Permission,
    resourceOwnerId: string,
    operation: () => Promise<T>
): Promise<T> {
    const hasAccess = await checkResourcePermission(permission, resourceOwnerId);

    if (!hasAccess) {
        throw new Error(`Permission denied: You don't have access to this resource`);
    }

    return operation();
}

// Check if user is in the same organization as a resource
export async function checkOrganizationAccess(organizationId: string): Promise<boolean> {
    const user = await getCurrentUser();

    if (!user) {
        return false;
    }

    return user.organization_id === organizationId;
}

// Require specific role or higher
export async function requireRole(minimumRole: Role): Promise<void> {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error('Authentication required');
    }

    const roleHierarchy = [Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.ADMIN, Role.OWNER];
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(minimumRole);

    if (userRoleIndex < requiredRoleIndex) {
        throw new Error(`Insufficient permissions: ${minimumRole} role or higher required`);
    }
}

// Field-level access control
export interface FieldAccessRules {
    [field: string]: Permission[];
}

export function filterFieldsByPermissions<T extends Record<string, any>>(
    data: T,
    fieldRules: FieldAccessRules,
    userRole: Role,
    userPermissions: Permission[] = []
): Partial<T> {
    const filtered: Partial<T> = {};

    for (const [field, value] of Object.entries(data)) {
        const requiredPermissions = fieldRules[field];

        // If no rules for this field, include it
        if (!requiredPermissions) {
            filtered[field as keyof T] = value;
            continue;
        }

        // Check if user has any of the required permissions
        const hasAccess = requiredPermissions.some(permission =>
            hasPermission(userRole, permission) || userPermissions.includes(permission)
        );

        if (hasAccess) {
            filtered[field as keyof T] = value;
        }
    }

    return filtered;
}

// Batch permission check for UI rendering
export async function checkPermissions(permissions: Permission[]): Promise<Record<Permission, boolean>> {
    const user = await getCurrentUser();
    const results: Record<string, boolean> = {};

    if (!user) {
        permissions.forEach(permission => {
            results[permission] = false;
        });
        return results as Record<Permission, boolean>;
    }

    permissions.forEach(permission => {
        const hasRolePermission = hasPermission(user.role, permission);
        const hasCustomPermission = user.permissions?.includes(permission);
        results[permission] = hasRolePermission || hasCustomPermission || false;
    });

    return results as Record<Permission, boolean>;
}

// Error class for permission errors
export class PermissionError extends Error {
    constructor(message: string, public permission?: Permission) {
        super(message);
        this.name = 'PermissionError';
    }
}

// Authentication check
export async function requireAuth(): Promise<User> {
    const user = await getCurrentUser();

    if (!user) {
        throw new Error('Authentication required');
    }

    return user;
}

export default {
    getCurrentUser,
    checkPermission,
    checkAnyPermission,
    checkResourcePermission,
    requirePermission,
    requireResourcePermission,
    checkOrganizationAccess,
    requireRole,
    filterFieldsByPermissions,
    checkPermissions,
    requireAuth,
    PermissionError
};
