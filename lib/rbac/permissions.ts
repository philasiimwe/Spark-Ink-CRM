// RBAC Permission System for Nexus CRM

export enum Role {
    OWNER = 'owner',
    ADMIN = 'admin',
    MANAGER = 'manager',
    MEMBER = 'member',
    VIEWER = 'viewer'
}

export enum Permission {
    // Organization Management
    ORG_MANAGE = 'org:manage',
    ORG_VIEW = 'org:view',
    ORG_SETTINGS = 'org:settings',

    // User Management
    USER_CREATE = 'user:create',
    USER_EDIT = 'user:edit',
    USER_DELETE = 'user:delete',
    USER_VIEW = 'user:view',
    USER_INVITE = 'user:invite',

    // Contact Management
    CONTACT_CREATE = 'contact:create',
    CONTACT_EDIT = 'contact:edit',
    CONTACT_DELETE = 'contact:delete',
    CONTACT_VIEW = 'contact:view',
    CONTACT_IMPORT = 'contact:import',
    CONTACT_EXPORT = 'contact:export',

    // Deal Management
    DEAL_CREATE = 'deal:create',
    DEAL_EDIT = 'deal:edit',
    DEAL_DELETE = 'deal:delete',
    DEAL_VIEW = 'deal:view',
    DEAL_EDIT_OWN = 'deal:edit_own',
    DEAL_DELETE_OWN = 'deal:delete_own',

    // Activity Management
    ACTIVITY_CREATE = 'activity:create',
    ACTIVITY_EDIT = 'activity:edit',
    ACTIVITY_DELETE = 'activity:delete',
    ACTIVITY_VIEW = 'activity:view',

    // Email Management
    EMAIL_SEND = 'email:send',
    EMAIL_VIEW = 'email:view',
    EMAIL_TEMPLATE_CREATE = 'email:template_create',
    EMAIL_TEMPLATE_EDIT = 'email:template_edit',
    EMAIL_SEQUENCE_CREATE = 'email:sequence_create',

    // Workflow & Automation
    WORKFLOW_CREATE = 'workflow:create',
    WORKFLOW_EDIT = 'workflow:edit',
    WORKFLOW_DELETE = 'workflow:delete',
    WORKFLOW_VIEW = 'workflow:view',
    WORKFLOW_EXECUTE = 'workflow:execute',

    // Reporting & Analytics
    REPORT_CREATE = 'report:create',
    REPORT_EDIT = 'report:edit',
    REPORT_DELETE = 'report:delete',
    REPORT_VIEW = 'report:view',
    ANALYTICS_VIEW = 'analytics:view',

    // Integration Management
    INTEGRATION_CREATE = 'integration:create',
    INTEGRATION_EDIT = 'integration:edit',
    INTEGRATION_DELETE = 'integration:delete',
    INTEGRATION_VIEW = 'integration:view',

    // Settings & Configuration
    SETTINGS_VIEW = 'settings:view',
    SETTINGS_EDIT = 'settings:edit',
    CUSTOM_FIELDS_MANAGE = 'custom_fields:manage',
    PIPELINE_MANAGE = 'pipeline:manage',

    // Advanced Features
    AI_FEATURES = 'ai:features',
    AUDIT_LOGS_VIEW = 'audit:view',
    BILLING_MANAGE = 'billing:manage'
}

// Role to Permission mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.OWNER]: [
        // Full access to everything
        Permission.ORG_MANAGE,
        Permission.ORG_VIEW,
        Permission.ORG_SETTINGS,
        Permission.USER_CREATE,
        Permission.USER_EDIT,
        Permission.USER_DELETE,
        Permission.USER_VIEW,
        Permission.USER_INVITE,
        Permission.CONTACT_CREATE,
        Permission.CONTACT_EDIT,
        Permission.CONTACT_DELETE,
        Permission.CONTACT_VIEW,
        Permission.CONTACT_IMPORT,
        Permission.CONTACT_EXPORT,
        Permission.DEAL_CREATE,
        Permission.DEAL_EDIT,
        Permission.DEAL_DELETE,
        Permission.DEAL_VIEW,
        Permission.ACTIVITY_CREATE,
        Permission.ACTIVITY_EDIT,
        Permission.ACTIVITY_DELETE,
        Permission.ACTIVITY_VIEW,
        Permission.EMAIL_SEND,
        Permission.EMAIL_VIEW,
        Permission.EMAIL_TEMPLATE_CREATE,
        Permission.EMAIL_TEMPLATE_EDIT,
        Permission.EMAIL_SEQUENCE_CREATE,
        Permission.WORKFLOW_CREATE,
        Permission.WORKFLOW_EDIT,
        Permission.WORKFLOW_DELETE,
        Permission.WORKFLOW_VIEW,
        Permission.WORKFLOW_EXECUTE,
        Permission.REPORT_CREATE,
        Permission.REPORT_EDIT,
        Permission.REPORT_DELETE,
        Permission.REPORT_VIEW,
        Permission.ANALYTICS_VIEW,
        Permission.INTEGRATION_CREATE,
        Permission.INTEGRATION_EDIT,
        Permission.INTEGRATION_DELETE,
        Permission.INTEGRATION_VIEW,
        Permission.SETTINGS_VIEW,
        Permission.SETTINGS_EDIT,
        Permission.CUSTOM_FIELDS_MANAGE,
        Permission.PIPELINE_MANAGE,
        Permission.AI_FEATURES,
        Permission.AUDIT_LOGS_VIEW,
        Permission.BILLING_MANAGE
    ],

    [Role.ADMIN]: [
        // Almost everything except billing and org deletion
        Permission.ORG_VIEW,
        Permission.ORG_SETTINGS,
        Permission.USER_CREATE,
        Permission.USER_EDIT,
        Permission.USER_VIEW,
        Permission.USER_INVITE,
        Permission.CONTACT_CREATE,
        Permission.CONTACT_EDIT,
        Permission.CONTACT_DELETE,
        Permission.CONTACT_VIEW,
        Permission.CONTACT_IMPORT,
        Permission.CONTACT_EXPORT,
        Permission.DEAL_CREATE,
        Permission.DEAL_EDIT,
        Permission.DEAL_DELETE,
        Permission.DEAL_VIEW,
        Permission.ACTIVITY_CREATE,
        Permission.ACTIVITY_EDIT,
        Permission.ACTIVITY_DELETE,
        Permission.ACTIVITY_VIEW,
        Permission.EMAIL_SEND,
        Permission.EMAIL_VIEW,
        Permission.EMAIL_TEMPLATE_CREATE,
        Permission.EMAIL_TEMPLATE_EDIT,
        Permission.EMAIL_SEQUENCE_CREATE,
        Permission.WORKFLOW_CREATE,
        Permission.WORKFLOW_EDIT,
        Permission.WORKFLOW_DELETE,
        Permission.WORKFLOW_VIEW,
        Permission.WORKFLOW_EXECUTE,
        Permission.REPORT_CREATE,
        Permission.REPORT_EDIT,
        Permission.REPORT_DELETE,
        Permission.REPORT_VIEW,
        Permission.ANALYTICS_VIEW,
        Permission.INTEGRATION_VIEW,
        Permission.SETTINGS_VIEW,
        Permission.SETTINGS_EDIT,
        Permission.CUSTOM_FIELDS_MANAGE,
        Permission.PIPELINE_MANAGE,
        Permission.AI_FEATURES,
        Permission.AUDIT_LOGS_VIEW
    ],

    [Role.MANAGER]: [
        // Team management and full CRM features
        Permission.ORG_VIEW,
        Permission.USER_VIEW,
        Permission.CONTACT_CREATE,
        Permission.CONTACT_EDIT,
        Permission.CONTACT_DELETE,
        Permission.CONTACT_VIEW,
        Permission.CONTACT_IMPORT,
        Permission.CONTACT_EXPORT,
        Permission.DEAL_CREATE,
        Permission.DEAL_EDIT,
        Permission.DEAL_DELETE,
        Permission.DEAL_VIEW,
        Permission.ACTIVITY_CREATE,
        Permission.ACTIVITY_EDIT,
        Permission.ACTIVITY_DELETE,
        Permission.ACTIVITY_VIEW,
        Permission.EMAIL_SEND,
        Permission.EMAIL_VIEW,
        Permission.EMAIL_TEMPLATE_CREATE,
        Permission.EMAIL_TEMPLATE_EDIT,
        Permission.WORKFLOW_VIEW,
        Permission.WORKFLOW_EXECUTE,
        Permission.REPORT_CREATE,
        Permission.REPORT_VIEW,
        Permission.ANALYTICS_VIEW,
        Permission.SETTINGS_VIEW,
        Permission.AI_FEATURES
    ],

    [Role.MEMBER]: [
        // Standard sales rep permissions
        Permission.ORG_VIEW,
        Permission.USER_VIEW,
        Permission.CONTACT_CREATE,
        Permission.CONTACT_EDIT,
        Permission.CONTACT_VIEW,
        Permission.CONTACT_EXPORT,
        Permission.DEAL_CREATE,
        Permission.DEAL_EDIT_OWN,
        Permission.DEAL_VIEW,
        Permission.ACTIVITY_CREATE,
        Permission.ACTIVITY_EDIT,
        Permission.ACTIVITY_VIEW,
        Permission.EMAIL_SEND,
        Permission.EMAIL_VIEW,
        Permission.WORKFLOW_VIEW,
        Permission.REPORT_VIEW,
        Permission.ANALYTICS_VIEW,
        Permission.AI_FEATURES
    ],

    [Role.VIEWER]: [
        // Read-only access
        Permission.ORG_VIEW,
        Permission.USER_VIEW,
        Permission.CONTACT_VIEW,
        Permission.DEAL_VIEW,
        Permission.ACTIVITY_VIEW,
        Permission.EMAIL_VIEW,
        Permission.REPORT_VIEW,
        Permission.ANALYTICS_VIEW
    ]
};

// Permission checking utilities
export function hasPermission(userRole: Role, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    return rolePermissions.includes(permission);
}

export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
    return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
    return permissions.every(permission => hasPermission(userRole, permission));
}

// Check if user can perform action on resource based on ownership
export function canPerformAction(
    userRole: Role,
    permission: Permission,
    isOwner: boolean = false
): boolean {
    // If user has the general permission, they can perform the action
    if (hasPermission(userRole, permission)) {
        return true;
    }

    // Check for owner-specific permissions
    if (isOwner) {
        if (permission === Permission.DEAL_EDIT && hasPermission(userRole, Permission.DEAL_EDIT_OWN)) {
            return true;
        }
        if (permission === Permission.DEAL_DELETE && hasPermission(userRole, Permission.DEAL_DELETE_OWN)) {
            return true;
        }
    }

    return false;
}

// Get all permissions for a role
export function getPermissionsForRole(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
}

// Check if a role is higher or equal to another role
export function isRoleHigherOrEqual(userRole: Role, targetRole: Role): boolean {
    const roleHierarchy = [Role.VIEWER, Role.MEMBER, Role.MANAGER, Role.ADMIN, Role.OWNER];
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const targetRoleIndex = roleHierarchy.indexOf(targetRole);
    return userRoleIndex >= targetRoleIndex;
}

// Get user-friendly role name
export function getRoleDisplayName(role: Role): string {
    const displayNames: Record<Role, string> = {
        [Role.OWNER]: 'Owner',
        [Role.ADMIN]: 'Administrator',
        [Role.MANAGER]: 'Manager',
        [Role.MEMBER]: 'Team Member',
        [Role.VIEWER]: 'Viewer'
    };
    return displayNames[role] || role;
}

// Get user-friendly permission name
export function getPermissionDisplayName(permission: Permission): string {
    return permission
        .split(':')
        .map(part => part.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '))
        .join(' - ');
}

export default {
    Role,
    Permission,
    ROLE_PERMISSIONS,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canPerformAction,
    getPermissionsForRole,
    isRoleHigherOrEqual,
    getRoleDisplayName,
    getPermissionDisplayName
};
