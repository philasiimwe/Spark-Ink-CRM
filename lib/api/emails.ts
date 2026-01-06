
import { supabase } from '../supabase';

export interface EmailMessage {
    id?: string;
    thread_id?: string;
    deal_id?: string;
    contact_id?: string;
    from_email: string;
    to_emails: string[];
    cc_emails?: string[];
    bcc_emails?: string[];
    subject: string;
    body_html?: string;
    body_text: string;
    attachments?: any[];
}

export const emailsAPI = {
    // Get all emails
    async getAll(filters?: { dealId?: string; contactId?: string; threadId?: string }) {
        let query = supabase
            .from('emails')
            .select(`
        *,
        contact:contacts(*),
        deal:deals(*),
        user:users(*)
      `)
            .order('received_at', { ascending: false });

        if (filters?.dealId) query = query.eq('deal_id', filters.dealId);
        if (filters?.contactId) query = query.eq('contact_id', filters.contactId);
        if (filters?.threadId) query = query.eq('thread_id', filters.threadId);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // Send email
    async send(email: EmailMessage) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const { data, error } = await supabase
            .from('emails')
            .insert({
                ...email,
                organization_id: user?.organization_id,
                user_id: userId,
                direction: 'outbound',
                status: 'sent',
                sent_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // TODO: Integrate with actual email provider (Gmail API, SendGrid, etc.)
        // await sendEmailViaProvider(email);

        return data;
    },

    // Track email opens
    async trackOpen(emailId: string) {
        // Get current count first
        const { data: current } = await supabase
            .from('emails')
            .select('open_count')
            .eq('id', emailId)
            .single();

        const { data, error } = await supabase
            .from('emails')
            .update({
                opened_at: new Date().toISOString(),
                open_count: (current?.open_count || 0) + 1
            })
            .eq('id', emailId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Track email clicks
    async trackClick(emailId: string) {
        // Get current count first
        const { data: current } = await supabase
            .from('emails')
            .select('click_count')
            .eq('id', emailId)
            .single();

        const { data, error } = await supabase
            .from('emails')
            .update({
                clicked_at: new Date().toISOString(),
                click_count: (current?.click_count || 0) + 1
            })
            .eq('id', emailId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get email templates
    async getTemplates() {
        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .order('name');

        if (error) throw error;
        return data;
    },

    // Create template
    async createTemplate(template: any) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const { data, error } = await supabase
            .from('email_templates')
            .insert({
                ...template,
                organization_id: user?.organization_id,
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get email sequences
    async getSequences() {
        const { data, error } = await supabase
            .from('email_sequences')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Create sequence
    async createSequence(sequence: any) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        const { data, error } = await supabase
            .from('email_sequences')
            .insert({
                ...sequence,
                organization_id: user?.organization_id,
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Sync Gmail
    async syncGmail(accessToken: string) {
        // TODO: Implement Gmail API sync
        // This would fetch emails from Gmail and store them in the database
        console.log('Gmail sync not yet implemented');
    },

    // Sync Outlook
    async syncOutlook(accessToken: string) {
        // TODO: Implement Microsoft Graph API sync
        console.log('Outlook sync not yet implemented');
    }
};
