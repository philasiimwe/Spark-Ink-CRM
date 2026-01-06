
import { supabase } from '../supabase';

export interface AccountFilters {
    ownerId?: string;
    parentAccountId?: string;
    industry?: string;
    search?: string;
}

export const accountsAPI = {
    async getAll(filters?: AccountFilters) {
        let query = supabase
            .from('accounts')
            .select(`
        *,
        owner:users(*),
        parent_account:accounts(id, name),
        child_accounts:accounts!parent_account_id(count),
        contacts:contacts(count),
        deals:deals(count)
      `)
            .order('created_at', { ascending: false });

        if (filters?.ownerId) {
            query = query.eq('owner_id', filters.ownerId);
        }

        if (filters?.parentAccountId) {
            query = query.eq('parent_account_id', filters.parentAccountId);
        }

        if (filters?.industry) {
            query = query.eq('industry', filters.industry);
        }

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,website.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('accounts')
            .select(`
        *,
        owner:users(*),
        parent_account:accounts(*),
        child_accounts:accounts!parent_account_id(*),
        contacts:contacts(*),
        deals:deals(*),
        documents:documents(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(accountData: any) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const { data, error } = await supabase
            .from('accounts')
            .insert({
                ...accountData,
                organization_id: user?.organization_id,
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('accounts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Get account hierarchy (parent and all children)
    async getHierarchy(accountId: string) {
        const account = await this.getById(accountId);

        // Get all descendants recursively
        const getDescendants = async (parentId: string): Promise<any[]> => {
            const { data } = await supabase
                .from('accounts')
                .select('*')
                .eq('parent_account_id', parentId);

            if (!data || data.length === 0) return [];

            const children = await Promise.all(
                data.map(async (child) => ({
                    ...child,
                    children: await getDescendants(child.id)
                }))
            );

            return children;
        };

        const descendants = await getDescendants(accountId);

        return {
            ...account,
            children: descendants
        };
    },

    // Get account metrics
    async getMetrics(accountId: string) {
        const { data: deals } = await supabase
            .from('deals')
            .select('value, status')
            .eq('account_id', accountId);

        const { data: contacts } = await supabase
            .from('contacts')
            .select('id')
            .eq('company', (await this.getById(accountId)).name);

        const totalValue = deals?.reduce((sum, d) => sum + d.value, 0) || 0;
        const wonValue = deals?.filter(d => d.status === 'won').reduce((sum, d) => sum + d.value, 0) || 0;

        return {
            totalDeals: deals?.length || 0,
            totalValue,
            wonValue,
            contactCount: contacts?.length || 0
        };
    }
};
