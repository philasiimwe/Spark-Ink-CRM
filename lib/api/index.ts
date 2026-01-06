
import { supabase } from '../supabase';

// Export all API modules
export { dealsAPI } from './deals';
export { contactsAPI } from './contacts';
export { emailsAPI } from './emails';
export { accountsAPI } from './accounts';
export { notesAPI } from './notes';
export { tagsAPI } from './tags';
export { customFieldsAPI } from './customFields';
export { documentsAPI } from './documents';
export { pipelinesAPI } from './pipelines';

// Activities API
export const activitiesAPI = {
    async getAll(filters?: { dealId?: string; contactId?: string; ownerId?: string; type?: string }) {
        let query = supabase
            .from('activities')
            .select(`
        *,
        deal:deals(*),
        contact:contacts(*),
        owner:users(*)
      `)
            .order('due_date', { ascending: true });

        if (filters?.dealId) query = query.eq('deal_id', filters.dealId);
        if (filters?.contactId) query = query.eq('contact_id', filters.contactId);
        if (filters?.ownerId) query = query.eq('owner_id', filters.ownerId);
        if (filters?.type) query = query.eq('type', filters.type);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async create(activity: any) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const { data, error } = await supabase
            .from('activities')
            .insert({
                ...activity,
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
            .from('activities')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async complete(id: string, outcome?: string) {
        return this.update(id, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            outcome
        });
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('activities')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

export const workflowsAPI = {
    async getAll() {
        const { data, error } = await supabase
            .from('workflows')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(workflow: any) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const { data, error } = await supabase
            .from('workflows')
            .insert({
                ...workflow,
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
            .from('workflows')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async toggleActive(id: string) {
        const { data: workflow } = await supabase
            .from('workflows')
            .select('is_active')
            .eq('id', id)
            .single();

        return this.update(id, { is_active: !workflow?.is_active });
    },

    async execute(workflowId: string, triggerData: any) {
        // Create execution record
        const { data: execution, error } = await supabase
            .from('workflow_executions')
            .insert({
                workflow_id: workflowId,
                status: 'running',
                trigger_data: triggerData
            })
            .select()
            .single();

        if (error) throw error;

        try {
            // Get workflow
            const { data: workflow } = await supabase
                .from('workflows')
                .select('*')
                .eq('id', workflowId)
                .single();

            if (!workflow) throw new Error('Workflow not found');

            // Execute actions
            const result = await this.executeActions(workflow.actions, triggerData);

            // Update execution as completed
            await supabase
                .from('workflow_executions')
                .update({
                    status: 'completed',
                    result,
                    completed_at: new Date().toISOString()
                })
                .eq('id', execution.id);

            // Update workflow stats
            const { data: currentWorkflow } = await supabase
                .from('workflows')
                .select('run_count')
                .eq('id', workflowId)
                .single();

            await supabase
                .from('workflows')
                .update({
                    last_run_at: new Date().toISOString(),
                    run_count: (currentWorkflow?.run_count || 0) + 1
                })
                .eq('id', workflowId);

            return result;
        } catch (error: any) {
            // Update execution as failed
            await supabase
                .from('workflow_executions')
                .update({
                    status: 'failed',
                    error: error.message,
                    completed_at: new Date().toISOString()
                })
                .eq('id', execution.id);

            throw error;
        }
    },

    async executeActions(actions: any[], triggerData: any) {
        const results = [];

        for (const action of actions) {
            switch (action.type) {
                case 'send_email':
                    // Send email action
                    results.push({ action: 'send_email', status: 'success' });
                    break;

                case 'create_task':
                    // Create task action
                    await activitiesAPI.create({
                        type: 'task',
                        subject: action.config.subject,
                        description: action.config.description,
                        due_date: action.config.due_date
                    });
                    results.push({ action: 'create_task', status: 'success' });
                    break;

                case 'update_field':
                    // Update field action
                    results.push({ action: 'update_field', status: 'success' });
                    break;

                case 'webhook':
                    // Call webhook
                    await fetch(action.config.url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(triggerData)
                    });
                    results.push({ action: 'webhook', status: 'success' });
                    break;

                default:
                    results.push({ action: action.type, status: 'skipped' });
            }
        }

        return results;
    }
};

export const webhooksAPI = {
    async getAll() {
        const { data, error } = await supabase
            .from('webhooks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(webhook: any) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        // Generate secret
        const secret = crypto.randomUUID();

        const { data, error } = await supabase
            .from('webhooks')
            .insert({
                ...webhook,
                organization_id: user?.organization_id,
                created_by: userId,
                secret
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async trigger(event: string, payload: any) {
        // Get all webhooks for this event
        const { data: webhooks } = await supabase
            .from('webhooks')
            .select('*')
            .contains('events', [event])
            .eq('is_active', true);

        if (!webhooks) return;

        // Trigger each webhook
        for (const webhook of webhooks) {
            try {
                const response = await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Secret': webhook.secret,
                        ...webhook.headers
                    },
                    body: JSON.stringify({
                        event,
                        payload,
                        timestamp: new Date().toISOString()
                    })
                });

                // Log delivery
                await supabase.from('webhook_deliveries').insert({
                    webhook_id: webhook.id,
                    event_type: event,
                    payload,
                    response_status: response.status,
                    response_body: await response.text(),
                    attempts: 1,
                    delivered_at: new Date().toISOString()
                });
            } catch (error: any) {
                // Log failed delivery
                await supabase.from('webhook_deliveries').insert({
                    webhook_id: webhook.id,
                    event_type: event,
                    payload,
                    response_status: 0,
                    response_body: error.message,
                    attempts: 1
                });
            }
        }
    }
};

export const productsAPI = {
    async getAll() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return data;
    },

    async create(product: any) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const { data, error } = await supabase
            .from('products')
            .insert({
                ...product,
                organization_id: user?.organization_id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

export const reportsAPI = {
    async getAll() {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async create(report: any) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const { data, error } = await supabase
            .from('reports')
            .insert({
                ...report,
                organization_id: user?.organization_id,
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async execute(reportId: string) {
        const { data: report } = await supabase
            .from('reports')
            .select('*')
            .eq('id', reportId)
            .single();

        if (!report) throw new Error('Report not found');

        // Execute report based on type and config
        // This would build dynamic queries based on the report configuration
        return {
            data: [],
            metadata: report
        };
    }
};

export const notificationsAPI = {
    async getAll(unreadOnly: boolean = false) {
        let query = supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async markAsRead(id: string) {
        const { data, error } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async markAllAsRead() {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { error } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return true;
    }
};
