
import { supabase } from '../supabase';

export const customFieldsAPI = {
    // Get all custom field definitions for an entity type
    async getDefinitions(entityType: 'contact' | 'deal' | 'account' | 'activity') {
        const { data, error } = await supabase
            .from('custom_field_definitions')
            .select('*')
            .eq('entity_type', entityType)
            .order('order_index');

        if (error) throw error;
        return data;
    },

    // Create a new custom field definition
    async createDefinition(definitionData: any) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const { data, error } = await supabase
            .from('custom_field_definitions')
            .insert({
                ...definitionData,
                organization_id: user?.organization_id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update custom field definition
    async updateDefinition(id: string, updates: any) {
        const { data, error } = await supabase
            .from('custom_field_definitions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete custom field definition
    async deleteDefinition(id: string) {
        const { error } = await supabase
            .from('custom_field_definitions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Get custom field values for a specific record
    async getValues(entityType: string, entityId: string) {
        const tableName = `${entityType}s`; // contacts, deals, accounts, activities

        const { data, error } = await supabase
            .from(tableName)
            .select('custom_fields')
            .eq('id', entityId)
            .single();

        if (error) throw error;
        return data?.custom_fields || {};
    },

    // Set custom field value for a record
    async setValue(entityType: string, entityId: string, fieldName: string, value: any) {
        const tableName = `${entityType}s`;

        // Get current custom_fields
        const { data: current } = await supabase
            .from(tableName)
            .select('custom_fields')
            .eq('id', entityId)
            .single();

        const customFields = current?.custom_fields || {};
        customFields[fieldName] = value;

        const { data, error } = await supabase
            .from(tableName)
            .update({ custom_fields: customFields })
            .eq('id', entityId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Validate custom field value against definition
    validateValue(definition: any, value: any): { valid: boolean; error?: string } {
        if (definition.is_required && (value === null || value === undefined || value === '')) {
            return { valid: false, error: `${definition.field_label} is required` };
        }

        switch (definition.field_type) {
            case 'number':
                if (value !== null && value !== undefined && isNaN(Number(value))) {
                    return { valid: false, error: `${definition.field_label} must be a number` };
                }
                break;

            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return { valid: false, error: `${definition.field_label} must be a valid email` };
                }
                break;

            case 'url':
                if (value && !/^https?:\/\/.+/.test(value)) {
                    return { valid: false, error: `${definition.field_label} must be a valid URL` };
                }
                break;

            case 'select':
            case 'multiselect':
                const options = definition.field_options || [];
                if (definition.field_type === 'select') {
                    if (value && !options.includes(value)) {
                        return { valid: false, error: `${definition.field_label} must be one of: ${options.join(', ')}` };
                    }
                } else {
                    if (value && Array.isArray(value)) {
                        const invalid = value.filter(v => !options.includes(v));
                        if (invalid.length > 0) {
                            return { valid: false, error: `Invalid options: ${invalid.join(', ')}` };
                        }
                    }
                }
                break;
        }

        return { valid: true };
    }
};
