
import { supabase, storage } from '../supabase';

export const documentsAPI = {
    async getAll(filters?: { dealId?: string; contactId?: string; accountId?: string; folder?: string }) {
        let query = supabase
            .from('documents')
            .select(`
        *,
        deal:deals(id, title),
        contact:contacts(id, full_name),
        account:accounts(id, name),
        uploaded_by_user:users(id, full_name, avatar_url)
      `)
            .order('created_at', { ascending: false });

        if (filters?.dealId) query = query.eq('deal_id', filters.dealId);
        if (filters?.contactId) query = query.eq('contact_id', filters.contactId);
        if (filters?.accountId) query = query.eq('account_id', filters.accountId);
        if (filters?.folder) query = query.eq('folder', filters.folder);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('documents')
            .select(`
        *,
        deal:deals(*),
        contact:contacts(*),
        account:accounts(*),
        uploaded_by_user:users(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async upload(file: File, metadata: {
        name?: string;
        dealId?: string;
        contactId?: string;
        accountId?: string;
        folder?: string;
    }) {
        const { data: session } = await supabase.auth.getSession();
        const userId = session?.session?.user?.id;

        const { data: user } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', userId)
            .single();

        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user?.organization_id}/${metadata.folder || 'general'}/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await storage.uploadFile(
            'documents',
            filePath,
            file
        );

        if (uploadError) throw uploadError;

        // Get public URL
        const fileUrl = storage.getPublicUrl('documents', filePath);

        // Create document record
        const { data, error } = await supabase
            .from('documents')
            .insert({
                name: metadata.name || file.name,
                file_url: fileUrl,
                file_type: file.type,
                file_size: file.size,
                deal_id: metadata.dealId,
                contact_id: metadata.contactId,
                account_id: metadata.accountId,
                folder: metadata.folder || 'general',
                organization_id: user?.organization_id,
                uploaded_by: userId
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async download(id: string) {
        const document = await this.getById(id);

        // Extract path from URL
        const url = new URL(document.file_url);
        const path = url.pathname.split('/documents/')[1];

        return storage.downloadFile('documents', path);
    },

    async delete(id: string) {
        const document = await this.getById(id);

        // Extract path from URL
        const url = new URL(document.file_url);
        const path = url.pathname.split('/documents/')[1];

        // Delete from storage
        await storage.deleteFile('documents', path);

        // Delete record
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    async createVersion(documentId: string, file: File) {
        const original = await this.getById(documentId);

        // Upload new version
        const newDocument = await this.upload(file, {
            name: original.name,
            dealId: original.deal_id,
            contactId: original.contact_id,
            accountId: original.account_id,
            folder: original.folder
        });

        // Update version number
        await supabase
            .from('documents')
            .update({ version: original.version + 1 })
            .eq('id', newDocument.id);

        return newDocument;
    },

    async markAsSigned(id: string) {
        const { data, error } = await supabase
            .from('documents')
            .update({
                is_signed: true,
                signed_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
