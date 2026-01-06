// Data Migration Utility - localStorage to Supabase

import { supabase } from '../supabase';
import { safeValidateContact, safeValidateDeal, safeValidateActivity } from '../api/validation';

export interface MigrationProgress {
    stage: string;
    current: number;
    total: number;
    percentage: number;
    errors: MigrationError[];
}

export interface MigrationError {
    entity: string;
    id: string;
    error: string;
    data?: any;
}

export interface MigrationResult {
    success: boolean;
    migratedCounts: {
        contacts: number;
        deals: number;
        activities: number;
    };
    errors: MigrationError[];
    rollbackId?: string;
}

// Read data from localStorage
function getLocalStorageData(key: string): any[] {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error);
        return [];
    }
}

// Transform contact data from localStorage format to Supabase format
function transformContact(contact: any, userId: string, organizationId: string) {
    return {
        first_name: contact.firstName || contact.first_name || '',
        last_name: contact.lastName || contact.last_name || '',
        email: contact.email || null,
        phone: contact.phone || null,
        phone_country_code: contact.phoneCountryCode || contact.phone_country_code || '+1',
        company: contact.company || null,
        job_title: contact.jobTitle || contact.job_title || null,
        linkedin_url: contact.linkedinUrl || contact.linkedin_url || null,
        twitter_url: contact.twitterUrl || contact.twitter_url || null,
        location: contact.location || null,
        industry: contact.industry || null,
        company_size: contact.companySize || contact.company_size || null,
        website: contact.website || null,
        annual_revenue: contact.annualRevenue || contact.annual_revenue || null,
        owner_id: userId,
        organization_id: organizationId,
        created_by: userId,
        tags: contact.tags || []
    };
}

// Transform deal data from localStorage format to Supabase format
function transformDeal(deal: any, userId: string, organizationId: string, contactIdMap: Map<string, string>) {
    return {
        title: deal.title || 'Untitled Deal',
        value: deal.value || 0,
        currency: deal.currency || 'USD',
        contact_id: deal.contactId ? contactIdMap.get(deal.contactId) : null,
        stage: deal.stage || 'LEAD',
        status: mapDealStatus(deal.stage),
        probability: deal.probability || 0,
        priority: mapDealPriority(deal.priority || 'WARM'),
        source: deal.source || null,
        expected_close_date: deal.expectedCloseDate || deal.expected_close_date || null,
        description: deal.notes || null,
        tags: deal.tags || [],
        is_followed: deal.isFollowed || deal.is_followed || false,
        owner_id: userId,
        organization_id: organizationId,
        created_by: userId,
        created_at: deal.createdAt || deal.created_at || new Date().toISOString(),
        updated_at: deal.updatedAt || deal.updated_at || new Date().toISOString()
    };
}

// Transform activity data
function transformActivity(activity: any, userId: string, organizationId: string, dealIdMap: Map<string, string>, contactIdMap: Map<string, string>) {
    return {
        deal_id: activity.dealId ? dealIdMap.get(activity.dealId) : null,
        contact_id: activity.contactId ? contactIdMap.get(activity.contactId) : null,
        type: activity.type?.toLowerCase() || 'task',
        subject: activity.subject || 'Untitled Activity',
        description: activity.notes || null,
        status: mapActivityStatus(activity.status),
        due_date: activity.dueDate || activity.due_date || null,
        duration_minutes: activity.duration ? parseInt(activity.duration) : null,
        owner_id: userId,
        organization_id: organizationId,
        created_by: userId
    };
}

// Helper functions to map old statuses to new format
function mapDealStatus(stage: string): string {
    if (stage === 'CLOSED_WON') return 'won';
    if (stage === 'CLOSED_LOST') return 'lost';
    return 'open';
}

function mapDealPriority(priority: string): string {
    const priorityMap: Record<string, string> = {
        'HOT': 'high',
        'WARM': 'medium',
        'COLD': 'low'
    };
    return priorityMap[priority] || 'medium';
}

function mapActivityStatus(status: string): string {
    if (!status) return 'pending';
    return status === 'COMPLETED' ? 'completed' : 'pending';
}

// Migration function with progress tracking
export async function migrateLocalStorageToSupabase(
    onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
    const errors: MigrationError[] = [];
    const migratedCounts = { contacts: 0, deals: 0, activities: 0 };

    try {
        // Get current user and organization
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { data: userData } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', user.id)
            .single();

        if (!userData) {
            throw new Error('User organization not found');
        }

        const userId = user.id;
        const organizationId = userData.organization_id;

        // Create rollback point
        const rollbackId = crypto.randomUUID();

        // Read data from localStorage
        const localContacts = getLocalStorageData('crm_contacts');
        const localDeals = getLocalStorageData('crm_deals');
        const localActivities = getLocalStorageData('crm_activities');

        const totalItems = localContacts.length + localDeals.length + localActivities.length;
        let currentItem = 0;

        // Maps to track old ID to new ID
        const contactIdMap = new Map<string, string>();
        const dealIdMap = new Map<string, string>();

        // Migrate Contacts
        onProgress?.({
            stage: 'Migrating Contacts',
            current: 0,
            total: localContacts.length,
            percentage: 0,
            errors
        });

        for (const contact of localContacts) {
            try {
                const transformedContact = transformContact(contact, userId, organizationId);
                const validation = safeValidateContact(transformedContact);

                if (!validation.success) {
                    errors.push({
                        entity: 'contact',
                        id: contact.id,
                        error: validation.error.message,
                        data: contact
                    });
                    continue;
                }

                const { data, error } = await supabase
                    .from('contacts')
                    .insert(transformedContact)
                    .select()
                    .single();

                if (error) {
                    errors.push({
                        entity: 'contact',
                        id: contact.id,
                        error: error.message,
                        data: contact
                    });
                } else {
                    contactIdMap.set(contact.id, data.id);
                    migratedCounts.contacts++;
                }
            } catch (error: any) {
                errors.push({
                    entity: 'contact',
                    id: contact.id,
                    error: error.message,
                    data: contact
                });
            }

            currentItem++;
            onProgress?.({
                stage: 'Migrating Contacts',
                current: migratedCounts.contacts,
                total: localContacts.length,
                percentage: Math.round((currentItem / totalItems) * 100),
                errors
            });
        }

        // Migrate Deals
        onProgress?.({
            stage: 'Migrating Deals',
            current: 0,
            total: localDeals.length,
            percentage: Math.round((currentItem / totalItems) * 100),
            errors
        });

        for (const deal of localDeals) {
            try {
                const transformedDeal = transformDeal(deal, userId, organizationId, contactIdMap);
                const validation = safeValidateDeal(transformedDeal);

                if (!validation.success) {
                    errors.push({
                        entity: 'deal',
                        id: deal.id,
                        error: validation.error.message,
                        data: deal
                    });
                    continue;
                }

                const { data, error } = await supabase
                    .from('deals')
                    .insert(transformedDeal)
                    .select()
                    .single();

                if (error) {
                    errors.push({
                        entity: 'deal',
                        id: deal.id,
                        error: error.message,
                        data: deal
                    });
                } else {
                    dealIdMap.set(deal.id, data.id);
                    migratedCounts.deals++;
                }
            } catch (error: any) {
                errors.push({
                    entity: 'deal',
                    id: deal.id,
                    error: error.message,
                    data: deal
                });
            }

            currentItem++;
            onProgress?.({
                stage: 'Migrating Deals',
                current: migratedCounts.deals,
                total: localDeals.length,
                percentage: Math.round((currentItem / totalItems) * 100),
                errors
            });
        }

        // Migrate Activities
        onProgress?.({
            stage: 'Migrating Activities',
            current: 0,
            total: localActivities.length,
            percentage: Math.round((currentItem / totalItems) * 100),
            errors
        });

        for (const activity of localActivities) {
            try {
                const transformedActivity = transformActivity(activity, userId, organizationId, dealIdMap, contactIdMap);
                const validation = safeValidateActivity(transformedActivity);

                if (!validation.success) {
                    errors.push({
                        entity: 'activity',
                        id: activity.id,
                        error: validation.error.message,
                        data: activity
                    });
                    continue;
                }

                const { error } = await supabase
                    .from('activities')
                    .insert(transformedActivity);

                if (error) {
                    errors.push({
                        entity: 'activity',
                        id: activity.id,
                        error: error.message,
                        data: activity
                    });
                } else {
                    migratedCounts.activities++;
                }
            } catch (error: any) {
                errors.push({
                    entity: 'activity',
                    id: activity.id,
                    error: error.message,
                    data: activity
                });
            }

            currentItem++;
            onProgress?.({
                stage: 'Migrating Activities',
                current: migratedCounts.activities,
                total: localActivities.length,
                percentage: Math.round((currentItem / totalItems) * 100),
                errors
            });
        }

        // Final progress update
        onProgress?.({
            stage: 'Migration Complete',
            current: totalItems,
            total: totalItems,
            percentage: 100,
            errors
        });

        return {
            success: errors.length === 0,
            migratedCounts,
            errors,
            rollbackId
        };

    } catch (error: any) {
        return {
            success: false,
            migratedCounts,
            errors: [{
                entity: 'migration',
                id: 'general',
                error: error.message
            }]
        };
    }
}

// Backup localStorage data before migration
export function backupLocalStorageData(): string {
    const backup = {
        timestamp: new Date().toISOString(),
        contacts: getLocalStorageData('crm_contacts'),
        deals: getLocalStorageData('crm_deals'),
        activities: getLocalStorageData('crm_activities')
    };

    const backupString = JSON.stringify(backup);
    const backupId = crypto.randomUUID();
    localStorage.setItem(`crm_backup_${backupId}`, backupString);

    return backupId;
}

// Restore from backup
export function restoreFromBackup(backupId: string): boolean {
    try {
        const backupString = localStorage.getItem(`crm_backup_${backupId}`);
        if (!backupString) {
            return false;
        }

        const backup = JSON.parse(backupString);
        localStorage.setItem('crm_contacts', JSON.stringify(backup.contacts));
        localStorage.setItem('crm_deals', JSON.stringify(backup.deals));
        localStorage.setItem('crm_activities', JSON.stringify(backup.activities));

        return true;
    } catch (error) {
        console.error('Error restoring from backup:', error);
        return false;
    }
}

export default {
    migrateLocalStorageToSupabase,
    backupLocalStorageData,
    restoreFromBackup
};
