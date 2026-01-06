
import { supabase } from '../supabase';

export const tagsAPI = {
    async getAll(entityType?: string) {
        let query = supabase
            .from('tags')
            .select('*')
            .order('name');

        if (entityType) {
            query = query.eq('entity_type', entityType);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('tags')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(tagData: { name: string; color?: string; entity_type?: string }) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const { data, error } = await supabase
            .from('tags')
            .insert({
                ...tagData,
                organization_id: user?.organization_id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('tags')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('tags')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Find or create tag by name
    async findOrCreate(name: string, entityType?: string) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        // Try to find existing tag
        const { data: existing } = await supabase
            .from('tags')
            .select('*')
            .eq('name', name)
            .eq('organization_id', user?.organization_id)
            .eq('entity_type', entityType || null)
            .single();

        if (existing) return existing;

        // Create new tag
        return this.create({ name, entity_type: entityType });
    }
};
