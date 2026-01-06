
import { supabase } from '../supabase';

export const notesAPI = {
    async getAll(filters?: { dealId?: string; contactId?: string; accountId?: string }) {
        let query = supabase
            .from('notes')
            .select(`
        *,
        deal:deals(id, title),
        contact:contacts(id, full_name),
        account:accounts(id, name),
        created_by_user:users(id, full_name, avatar_url)
      `)
            .order('created_at', { ascending: false });

        if (filters?.dealId) query = query.eq('deal_id', filters.dealId);
        if (filters?.contactId) query = query.eq('contact_id', filters.contactId);
        if (filters?.accountId) query = query.eq('account_id', filters.accountId);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('notes')
            .select(`
        *,
        deal:deals(*),
        contact:contacts(*),
        account:accounts(*),
        created_by_user:users(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(noteData: any) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const { data, error } = await supabase
            .from('notes')
            .insert({
                ...noteData,
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
            .from('notes')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async togglePin(id: string) {
        const note = await this.getById(id);
        return this.update(id, { is_pinned: !note.is_pinned });
    }
};
