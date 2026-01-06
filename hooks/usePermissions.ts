// React Hook for Permission Checking

import { useState, useEffect, useCallback } from 'react';
import { Role, Permission, hasPermission } from '../lib/rbac/permissions';
import { getCurrentUser, checkPermissions } from '../lib/rbac/middleware';

interface User {
    id: string;
    email: string;
    role: Role;
    organization_id: string;
    permissions?: Permission[];
}

export function useCurrentUser() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUser() {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error('Error fetching current user:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    const refetch = useCallback(async () => {
        setLoading(true);
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Error refetching user:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    return { user, loading, refetch };
}

export function usePermission(permission: Permission) {
    const { user, loading } = useCurrentUser();
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        if (!user) {
            setHasAccess(false);
            return;
        }

        const roleHasPermission = hasPermission(user.role, permission);
        const customHasPermission = user.permissions?.includes(permission) || false;
        setHasAccess(roleHasPermission || customHasPermission);
    }, [user, permission]);

    return { hasAccess, loading };
}

export function usePermissions(permissions: Permission[]) {
    const [permissionMap, setPermissionMap] = useState<Record<Permission, boolean>>({} as Record<Permission, boolean>);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPermissions() {
            try {
                const results = await checkPermissions(permissions);
                setPermissionMap(results);
            } catch (error) {
                console.error('Error checking permissions:', error);
                // Set all to false on error
                const falseMap: Record<string, boolean> = {};
                permissions.forEach(p => {
                    falseMap[p] = false;
                });
                setPermissionMap(falseMap as Record<Permission, boolean>);
            } finally {
                setLoading(false);
            }
        }

        fetchPermissions();
    }, [permissions.join(',')]);

    return { permissions: permissionMap, loading };
}

export function useHasRole(minimumRole: Role) {
    const { user, loading } = useCurrentUser();
    const [hasRole, setHasRole] = useState(false);

    useEffect(() => {
        if (!user) {
            setHasRole(false);
            return;
        }

        const roleHierarchy = [Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.ADMIN, Role.OWNER];
        const userRoleIndex = roleHierarchy.indexOf(user.role);
        const requiredRoleIndex = roleHierarchy.indexOf(minimumRole);

        setHasRole(userRoleIndex >= requiredRoleIndex);
    }, [user, minimumRole]);

    return { hasRole, loading };
}

// Hook to check if user is owner of a resource
export function useIsResourceOwner(resourceOwnerId: string | undefined) {
    const { user, loading } = useCurrentUser();
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        if (!user || !resourceOwnerId) {
            setIsOwner(false);
            return;
        }

        setIsOwner(user.id === resourceOwnerId);
    }, [user, resourceOwnerId]);

    return { isOwner, loading };
}

// Combined hook for common permission checks
export function useCanPerform(
    permission: Permission,
    resourceOwnerId?: string
) {
    const { user, loading } = useCurrentUser();
    const [canPerform, setCanPerform] = useState(false);

    useEffect(() => {
        if (!user) {
            setCanPerform(false);
            return;
        }

        const roleHasPermission = hasPermission(user.role, permission);
        const customHasPermission = user.permissions?.includes(permission) || false;
        let hasAccess = roleHasPermission || customHasPermission;

        // If resource owner is specified, check ownership permissions
        if (resourceOwnerId && !hasAccess) {
            const isOwner = user.id === resourceOwnerId;

            if (isOwner) {
                // Check for owner-specific permissions
                if (permission === Permission.DEAL_EDIT) {
                    hasAccess = hasPermission(user.role, Permission.DEAL_EDIT_OWN) ||
                        user.permissions?.includes(Permission.DEAL_EDIT_OWN) || false;
                } else if (permission === Permission.DEAL_DELETE) {
                    hasAccess = hasPermission(user.role, Permission.DEAL_DELETE_OWN) ||
                        user.permissions?.includes(Permission.DEAL_DELETE_OWN) || false;
                }
            }
        }

        setCanPerform(hasAccess);
    }, [user, permission, resourceOwnerId]);

    return { canPerform, loading };
}

export default {
    useCurrentUser,
    usePermission,
    usePermissions,
    useHasRole,
    useIsResourceOwner,
    useCanPerform
};
