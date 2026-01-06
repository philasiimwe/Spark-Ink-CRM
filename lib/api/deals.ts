
import { supabase } from '../supabase';
import { Deal } from '../../types';

export interface DealFilters {
    stage?: string;
    ownerId?: string;
    pipelineId?: string;
    status?: 'open' | 'won' | 'lost' | 'abandoned';
    tags?: string[];
    search?: string;
}

export const dealsAPI = {
    // Get all deals with optional filters
    async getAll(filters?: DealFilters) {
        let query = supabase
            .from('deals')
            .select(`
        *,
        contact:contacts(*),
        account:accounts(*),
        owner:users(*),
        pipeline:pipelines(*),
        activities:activities(count)
      `)
            .order('created_at', { ascending: false });

        if (filters?.stage) {
            query = query.eq('stage', filters.stage);
        }

        if (filters?.ownerId) {
            query = query.eq('owner_id', filters.ownerId);
        }

        if (filters?.pipelineId) {
            query = query.eq('pipeline_id', filters.pipelineId);
        }

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.tags && filters.tags.length > 0) {
            query = query.contains('tags', filters.tags);
        }

        if (filters?.search) {
            query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    // Get single deal by ID
    async getById(id: string) {
        const { data, error } = await supabase
            .from('deals')
            .select(`
        *,
        contact:contacts(*),
        account:accounts(*),
        owner:users(*),
        pipeline:pipelines(*),
        activities:activities(*),
        notes:notes(*),
        documents:documents(*),
        products:deal_products(*, product:products(*))
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create new deal
    async create(dealData: Partial<Deal>) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        // Get user's organization
        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const { data, error } = await supabase
            .from('deals')
            .insert({
                ...dealData,
                organization_id: user?.organization_id,
                created_by: userId,
                last_activity_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // Log audit trail
        await this.logAudit('create', data.id, null, data);

        return data;
    },

    // Update deal
    async update(id: string, updates: Partial<Deal>) {
        // Get current state for audit
        const current = await this.getById(id);

        const { data, error } = await supabase
            .from('deals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log audit trail
        await this.logAudit('update', id, current, data);

        return data;
    },

    // Update deal stage
    async updateStage(id: string, stage: string, lossReason?: string) {
        const updates: any = { stage };

        if (stage === 'closed_won') {
            updates.status = 'won';
            updates.closed_date = new Date().toISOString();
        } else if (stage === 'closed_lost') {
            updates.status = 'lost';
            updates.closed_date = new Date().toISOString();
            if (lossReason) updates.loss_reason = lossReason;
        }

        return this.update(id, updates);
    },

    // Delete deal
    async delete(id: string) {
        const current = await this.getById(id);

        const { error } = await supabase
            .from('deals')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Log audit trail
        await this.logAudit('delete', id, current, null);

        return true;
    },

    // Toggle follow status
    async toggleFollow(id: string) {
        const deal = await this.getById(id);
        return this.update(id, { is_followed: !deal.is_followed });
    },

    // Add product to deal
    async addProduct(dealId: string, productId: string, quantity: number, unitPrice: number) {
        const { data, error } = await supabase
            .from('deal_products')
            .insert({
                deal_id: dealId,
                product_id: productId,
                quantity,
                unit_price: unitPrice
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get pipeline metrics
    async getPipelineMetrics(pipelineId?: string) {
        let query = supabase
            .from('deal_pipeline_metrics')
            .select('*');

        if (pipelineId) {
            query = query.eq('pipeline_id', pipelineId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    // Calculate deal health score using AI
    async calculateHealthScore(dealId: string) {
        const deal = await this.getById(dealId);

        // Factors for health score
        let score = 50; // Base score

        // Time since last activity (negative factor)
        const daysSinceActivity = deal.stale_days || 0;
        if (daysSinceActivity > 30) score -= 30;
        else if (daysSinceActivity > 14) score -= 15;
        else if (daysSinceActivity > 7) score -= 5;

        // Activity count (positive factor)
        const activityCount = deal.activities?.length || 0;
        score += Math.min(activityCount * 2, 20);

        // Probability (positive factor)
        score += (deal.probability || 0) * 0.3;

        // Priority (adjustment)
        if (deal.priority === 'urgent') score += 10;
        else if (deal.priority === 'high') score += 5;
        else if (deal.priority === 'low') score -= 5;

        // Clamp between 0-100
        score = Math.max(0, Math.min(100, score));

        await this.update(dealId, { health_score: Math.round(score) });

        return score;
    },

    // Audit logging helper
    async logAudit(action: string, entityId: string, oldValues: any, newValues: any) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        await supabase.from('audit_logs').insert({
            organization_id: user?.organization_id,
            user_id: userId,
            action,
            entity_type: 'deal',
            entity_id: entityId,
            old_values: oldValues,
            new_values: newValues
        });
    },

    // Bulk operations
    async bulkUpdate(dealIds: string[], updates: Partial<Deal>) {
        const { data, error } = await supabase
            .from('deals')
            .update(updates)
            .in('id', dealIds)
            .select();

        if (error) throw error;
        return data;
    },

    async bulkDelete(dealIds: string[]) {
        const { error } = await supabase
            .from('deals')
            .delete()
            .in('id', dealIds);

        if (error) throw error;
        return true;
    }
};
