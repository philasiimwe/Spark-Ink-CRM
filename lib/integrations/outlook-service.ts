// Outlook/Microsoft Graph API Service
// Handles fetching, sending, and managing Outlook emails

import { getEmailProvider, getValidAccessToken } from './email-oauth';
import { supabase } from '../supabase';
import { EmailMessage } from './gmail-service';

interface OutlookMessage {
    id: string;
    conversationId: string;
    subject: string;
    bodyPreview: string;
    body: {
        contentType: 'text' | 'html';
        content: string;
    };
    from: {
        emailAddress: {
            name: string;
            address: string;
        };
    };
    toRecipients: Array<{
        emailAddress: {
            name: string;
            address: string;
        };
    }>;
    ccRecipients?: Array<{
        emailAddress: {
            name: string;
            address: string;
        };
    }>;
    bccRecipients?: Array<{
        emailAddress: {
            name: string;
            address: string;
        };
    }>;
    hasAttachments: boolean;
    receivedDateTime: string;
    internetMessageId: string;
}

/**
 * Fetch emails from Outlook
 */
export async function fetchOutlookMessages(maxResults: number = 50, skipToken?: string): Promise<{
    messages: EmailMessage[];
    nextSkipToken?: string;
}> {
    const provider = await getEmailProvider('outlook');
    if (!provider) {
        throw new Error('Outlook not connected');
    }

    const accessToken = await getValidAccessToken(provider);

    const url = new URL('https://graph.microsoft.com/v1.0/me/messages');
    url.searchParams.append('$top', maxResults.toString());
    url.searchParams.append('$orderby', 'receivedDateTime DESC');
    if (skipToken) {
        url.searchParams.append('$skip', skipToken);
    }

    const response = await fetch(url.toString(), {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch Outlook messages');
    }

    const data = await response.json();

    if (!data.value || data.value.length === 0) {
        return { messages: [], nextSkipToken: undefined };
    }

    const messages = data.value.map(parseOutlookMessage);

    // Fetch attachments for messages that have them
    for (const message of messages) {
        if (message.has_attachments) {
            const attachments = await fetchOutlookAttachments(message.id, accessToken);
            message.attachments = attachments;
        }
    }

    // Store in Supabase
    await storeEmailsInDatabase(messages, provider.user_id);

    return {
        messages,
        nextSkipToken: data['@odata.nextLink'] ? extractSkipToken(data['@odata.nextLink']) : undefined
    };
}

/**
 * Parse Outlook message to EmailMessage format
 */
function parseOutlookMessage(outlookMessage: OutlookMessage): EmailMessage {
    return {
        id: outlookMessage.id,
        thread_id: outlookMessage.conversationId,
        message_id: outlookMessage.internetMessageId,
        from: `${outlookMessage.from.emailAddress.name} <${outlookMessage.from.emailAddress.address}>`,
        to: outlookMessage.toRecipients.map(r => `${r.emailAddress.name} <${r.emailAddress.address}>`),
        cc: outlookMessage.ccRecipients?.map(r => `${r.emailAddress.name} <${r.emailAddress.address}>`),
        bcc: outlookMessage.bccRecipients?.map(r => `${r.emailAddress.name} <${r.emailAddress.address}>`),
        subject: outlookMessage.subject,
        body_text: outlookMessage.body.contentType === 'text' ? outlookMessage.body.content : '',
        body_html: outlookMessage.body.contentType === 'html' ? outlookMessage.body.content : '',
        snippet: outlookMessage.bodyPreview,
        has_attachments: outlookMessage.hasAttachments,
        received_at: new Date(outlookMessage.receivedDateTime),
        labels: []
    };
}

/**
 * Fetch attachments for an Outlook message
 */
async function fetchOutlookAttachments(messageId: string, accessToken: string): Promise<Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
}>> {
    const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok) {
        return [];
    }

    const data = await response.json();

    return data.value.map((att: any) => ({
        filename: att.name,
        mimeType: att.contentType,
        size: att.size,
        attachmentId: att.id
    }));
}

/**
 * Send email via Outlook
 */
export async function sendOutlookEmail(email: {
    to: string[];
    subject: string;
    body_html?: string;
    body_text?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: Array<{ filename: string; content: string; mimeType: string }>;
}): Promise<EmailMessage> {
    const provider = await getEmailProvider('outlook');
    if (!provider) {
        throw new Error('Outlook not connected');
    }

    const accessToken = await getValidAccessToken(provider);

    const message = {
        subject: email.subject,
        body: {
            contentType: email.body_html ? 'HTML' : 'Text',
            content: email.body_html || email.body_text || ''
        },
        toRecipients: email.to.map(e => ({
            emailAddress: {
                address: e
            }
        })),
        ccRecipients: email.cc?.map(e => ({
            emailAddress: {
                address: e
            }
        })),
        bccRecipients: email.bcc?.map(e => ({
            emailAddress: {
                address: e
            }
        })),
        attachments: email.attachments?.map(att => ({
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: att.filename,
            contentType: att.mimeType,
            contentBytes: att.content
        }))
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to send email: ${error.error?.message || 'Unknown error'}`);
    }

    // Outlook sendMail doesn't return the sent message, so we create a placeholder
    const sentMessage: EmailMessage = {
        id: `sent-${Date.now()}`,
        thread_id: '',
        message_id: '',
        from: provider.email,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        subject: email.subject,
        body_text: email.body_text || '',
        body_html: email.body_html || '',
        snippet: (email.body_text || email.body_html || '').substring(0, 100),
        has_attachments: (email.attachments?.length || 0) > 0,
        attachments: email.attachments?.map(att => ({
            filename: att.filename,
            mimeType: att.mimeType,
            size: att.content.length,
            attachmentId: ''
        })),
        received_at: new Date(),
        labels: []
    };

    // Store in database
    await storeEmailsInDatabase([sentMessage], provider.user_id);

    return sentMessage;
}

/**
 * Store emails in Supabase
 */
async function storeEmailsInDatabase(messages: EmailMessage[], userId: string): Promise<void> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!userData) return;

    const emailsToInsert = messages.map(msg => ({
        organization_id: userData.organization_id,
        message_id: msg.message_id,
        thread_id: msg.thread_id,
        user_id: userId,
        direction: 'inbound' as const,
        from_email: msg.from,
        to_emails: msg.to,
        cc_emails: msg.cc || [],
        bcc_emails: msg.bcc || [],
        subject: msg.subject,
        body_text: msg.body_text,
        body_html: msg.body_html,
        snippet: msg.snippet,
        has_attachments: msg.has_attachments,
        attachments: msg.attachments || [],
        received_at: msg.received_at.toISOString(),
        created_at: new Date().toISOString()
    }));

    await supabase
        .from('emails')
        .upsert(emailsToInsert, {
            onConflict: 'message_id',
            ignoreDuplicates: true
        });
}

function extractSkipToken(nextLink: string): string {
    const url = new URL(nextLink);
    return url.searchParams.get('$skip') || '';
}
