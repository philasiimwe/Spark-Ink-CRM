
import { supabase } from '../supabase';
import { Contact } from '../../types';

export interface ContactFilters {
    ownerId?: string;
    company?: string;
    tags?: string[];
    search?: string;
    leadScore?: { min?: number; max?: number };
}

export const contactsAPI = {
    async getAll(filters?: ContactFilters) {
        let query = supabase
            .from('contacts')
            .select(`
        *,
        owner:users(*),
        deals:deals(count),
        activities:activities(count)
      `)
            .order('created_at', { ascending: false });

        if (filters?.ownerId) {
            query = query.eq('owner_id', filters.ownerId);
        }

        if (filters?.company) {
            query = query.ilike('company', `%${filters.company}%`);
        }

        if (filters?.tags && filters.tags.length > 0) {
            query = query.contains('tags', filters.tags);
        }

        if (filters?.search) {
            query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
        }

        if (filters?.leadScore) {
            if (filters.leadScore.min !== undefined) {
                query = query.gte('lead_score', filters.leadScore.min);
            }
            if (filters.leadScore.max !== undefined) {
                query = query.lte('lead_score', filters.leadScore.max);
            }
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('contacts')
            .select(`
        *,
        owner:users(*),
        deals:deals(*),
        activities:activities(*),
        notes:notes(*),
        emails:emails(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(contactData: Partial<Contact>) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const { data, error } = await supabase
            .from('contacts')
            .insert({
                ...contactData,
                organization_id: user?.organization_id,
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Contact>) {
        const { data, error } = await supabase
            .from('contacts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Deduplication
    async findDuplicates(email?: string, phone?: string) {
        let query = supabase.from('contacts').select('*');

        if (email) {
            query = query.eq('email', email);
        }

        if (phone) {
            query = query.eq('phone', phone);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async mergeContacts(primaryId: string, secondaryIds: string[]) {
        // Get all contacts to merge
        const { data: contacts } = await supabase
            .from('contacts')
            .select('*')
            .in('id', [primaryId, ...secondaryIds]);

        if (!contacts) throw new Error('Contacts not found');

        const primary = contacts.find(c => c.id === primaryId);
        const secondaries = contacts.filter(c => c.id !== primaryId);

        // Merge data (prefer primary, fill gaps from secondaries)
        const merged = { ...primary };
        secondaries.forEach(contact => {
            Object.keys(contact).forEach(key => {
                if (!merged[key] && contact[key]) {
                    merged[key] = contact[key];
                }
            });
        });

        // Update all related records to point to primary
        await supabase
            .from('deals')
            .update({ contact_id: primaryId })
            .in('contact_id', secondaryIds);

        await supabase
            .from('activities')
            .update({ contact_id: primaryId })
            .in('contact_id', secondaryIds);

        // Delete secondary contacts
        await supabase
            .from('contacts')
            .delete()
            .in('id', secondaryIds);

        // Update primary with merged data
        return this.update(primaryId, merged);
    },

    // Calculate lead score using AI factors
    async calculateLeadScore(contactId: string) {
        const contact = await this.getById(contactId);

        let score = 0;

        // Company size factor
        if (contact.company_size === '1000+') score += 30;
        else if (contact.company_size === '500-1000') score += 25;
        else if (contact.company_size === '100-500') score += 20;
        else if (contact.company_size === '50-100') score += 15;
        else if (contact.company_size === '10-50') score += 10;

        // Job title factor (decision maker)
        const title = contact.job_title?.toLowerCase() || '';
        if (title.includes('ceo') || title.includes('president') || title.includes('founder')) score += 25;
        else if (title.includes('vp') || title.includes('director')) score += 20;
        else if (title.includes('manager') || title.includes('head')) score += 15;

        // Activity engagement
        const activityCount = contact.activities?.length || 0;
        score += Math.min(activityCount * 3, 30);

        // Email engagement
        const emailCount = contact.emails?.length || 0;
        score += Math.min(emailCount * 2, 20);

        // Has LinkedIn (professional presence)
        if (contact.linkedin_url) score += 5;

        // Has website (established company)
        if (contact.website) score += 5;

        score = Math.max(0, Math.min(100, score));

        await this.update(contactId, { lead_score: Math.round(score) });
        return score;
    },

    // Bulk import from CSV
    async importFromCSV(csvData: any[]) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const contacts = csvData.map(row => ({
            ...row,
            organization_id: user?.organization_id,
            created_by: userId
        }));

        const { data, error } = await supabase
            .from('contacts')
            .insert(contacts)
            .select();

        if (error) throw error;
        return data;
    },

    // Export to CSV
    async exportToCSV(filters?: ContactFilters) {
        const contacts = await this.getAll(filters);

        // Convert to CSV format
        const csvHeaders = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Job Title', 'Lead Score'];
        const csvRows = contacts.map(c => [
            c.first_name,
            c.last_name,
            c.email,
            c.phone,
            c.company,
            c.job_title,
            c.lead_score
        ]);

        return { headers: csvHeaders, rows: csvRows };
    },

    // Engagement metrics
    async getEngagementMetrics(contactId: string) {
        const { data, error } = await supabase
            .from('contact_engagement')
            .select('*')
            .eq('id', contactId)
            .single();

        if (error) throw error;
        return data;
    }
};
