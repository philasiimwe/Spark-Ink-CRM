// Gmail API Service
// Handles fetching, sending, and managing Gmail emails

import { getEmailProvider, getValidAccessToken } from './email-oauth';
import { supabase } from '../supabase';

export interface GmailMessage {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    payload: {
        headers: Array<{ name: string; value: string }>;
        parts?: Array<{
            mimeType: string;
            body: { data?: string; attachmentId?: string; size: number };
            filename?: string;
        }>;
        body: { data?: string; size: number };
        mimeType: string;
    };
    internalDate: string;
    sizeEstimate: number;
}

export interface EmailMessage {
    id: string;
    thread_id: string;
    message_id: string;
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body_text: string;
    body_html: string;
    snippet: string;
    has_attachments: boolean;
    attachments?: Array<{
        filename: string;
        mimeType: string;
        size: number;
        attachmentId: string;
    }>;
    received_at: Date;
    labels: string[];
}

/**
 * Fetch emails from Gmail
 */
export async function fetchGmailMessages(maxResults: number = 50, pageToken?: string): Promise<{
    messages: EmailMessage[];
    nextPageToken?: string;
}> {
    const provider = await getEmailProvider('gmail');
    if (!provider) {
        throw new Error('Gmail not connected');
    }

    const accessToken = await getValidAccessToken(provider);

    // Fetch message list
    const listUrl = new URL('https://www.googleapis.com/gmail/v1/users/me/messages');
    listUrl.searchParams.append('maxResults', maxResults.toString());
    if (pageToken) {
        listUrl.searchParams.append('pageToken', pageToken);
    }

    const listResponse = await fetch(listUrl.toString(), {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!listResponse.ok) {
        throw new Error('Failed to fetch Gmail messages');
    }

    const listData = await listResponse.json();

    if (!listData.messages || listData.messages.length === 0) {
        return { messages: [], nextPageToken: undefined };
    }

    // Fetch full message details
    const messages = await Promise.all(
        listData.messages.map((msg: { id: string }) => fetchGmailMessageById(msg.id, accessToken))
    );

    // Store in Supabase
    await storeEmailsInDatabase(messages, provider.user_id);

    return {
        messages,
        nextPageToken: listData.nextPageToken
    };
}

/**
 * Fetch a single Gmail message by ID
 */
async function fetchGmailMessageById(messageId: string, accessToken: string): Promise<EmailMessage> {
    const response = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch message ${messageId}`);
    }

    const gmailMessage: GmailMessage = await response.json();
    return parseGmailMessage(gmailMessage);
}

/**
 * Parse Gmail message to EmailMessage format
 */
function parseGmailMessage(gmailMessage: GmailMessage): EmailMessage {
    const headers = gmailMessage.payload.headers;
    const getHeader = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const from = getHeader('From');
    const to = getHeader('To').split(',').map(e => e.trim()).filter(Boolean);
    const cc = getHeader('Cc').split(',').map(e => e.trim()).filter(Boolean);
    const bcc = getHeader('Bcc').split(',').map(e => e.trim()).filter(Boolean);
    const subject = getHeader('Subject');
    const messageId = getHeader('Message-ID');

    // Parse body
    let body_text = '';
    let body_html = '';
    const attachments: Array<{ filename: string; mimeType: string; size: number; attachmentId: string }> = [];

    if (gmailMessage.payload.parts) {
        for (const part of gmailMessage.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body.data) {
                body_text = decodeBase64Url(part.body.data);
            } else if (part.mimeType === 'text/html' && part.body.data) {
                body_html = decodeBase64Url(part.body.data);
            } else if (part.filename && part.body.attachmentId) {
                attachments.push({
                    filename: part.filename,
                    mimeType: part.mimeType,
                    size: part.body.size,
                    attachmentId: part.body.attachmentId
                });
            }
        }
    } else if (gmailMessage.payload.body.data) {
        const data = decodeBase64Url(gmailMessage.payload.body.data);
        if (gmailMessage.payload.mimeType === 'text/html') {
            body_html = data;
        } else {
            body_text = data;
        }
    }

    return {
        id: gmailMessage.id,
        thread_id: gmailMessage.threadId,
        message_id: messageId,
        from,
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        subject,
        body_text,
        body_html,
        snippet: gmailMessage.snippet,
        has_attachments: attachments.length > 0,
        attachments: attachments.length > 0 ? attachments : undefined,
        received_at: new Date(parseInt(gmailMessage.internalDate)),
        labels: gmailMessage.labelIds
    };
}

/**
 * Send email via Gmail
 */
export async function sendGmailEmail(email: {
    to: string[];
    subject: string;
    body_html?: string;
    body_text?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: Array<{ filename: string; content: string; mimeType: string }>;
    threadId?: string;
}): Promise<EmailMessage> {
    const provider = await getEmailProvider('gmail');
    if (!provider) {
        throw new Error('Gmail not connected');
    }

    const accessToken = await getValidAccessToken(provider);

    // Construct email in RFC 2822 format
    const emailLines: string[] = [];
    emailLines.push(`To: ${email.to.join(', ')}`);
    if (email.cc && email.cc.length > 0) {
        emailLines.push(`Cc: ${email.cc.join(', ')}`);
    }
    if (email.bcc && email.bcc.length > 0) {
        emailLines.push(`Bcc: ${email.bcc.join(', ')}`);
    }
    emailLines.push(`Subject: ${email.subject}`);
    emailLines.push('MIME-Version: 1.0');

    if (email.attachments && email.attachments.length > 0) {
        // Multipart email with attachments
        const boundary = `boundary_${Date.now()}`;
        emailLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
        emailLines.push('');

        // Text/HTML part
        emailLines.push(`--${boundary}`);
        if (email.body_html) {
            emailLines.push('Content-Type: text/html; charset=UTF-8');
        } else {
            emailLines.push('Content-Type: text/plain; charset=UTF-8');
        }
        emailLines.push('');
        emailLines.push(email.body_html || email.body_text || '');
        emailLines.push('');

        // Attachments
        for (const attachment of email.attachments) {
            emailLines.push(`--${boundary}`);
            emailLines.push(`Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`);
            emailLines.push('Content-Transfer-Encoding: base64');
            emailLines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
            emailLines.push('');
            emailLines.push(attachment.content);
            emailLines.push('');
        }

        emailLines.push(`--${boundary}--`);
    } else {
        // Simple email
        if (email.body_html) {
            emailLines.push('Content-Type: text/html; charset=UTF-8');
        } else {
            emailLines.push('Content-Type: text/plain; charset=UTF-8');
        }
        emailLines.push('');
        emailLines.push(email.body_html || email.body_text || '');
    }

    const rawEmail = emailLines.join('\r\n');
    const encodedEmail = encodeBase64Url(rawEmail);

    // Send email
    const url = 'https://www.googleapis.com/gmail/v1/users/me/messages/send';
    const body: any = {
        raw: encodedEmail
    };

    if (email.threadId) {
        body.threadId = email.threadId;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to send email: ${error.error?.message || 'Unknown error'}`);
    }

    const sentMessage = await response.json();

    // Fetch the sent message details
    const messageDetails = await fetchGmailMessageById(sentMessage.id, accessToken);

    // Store in database
    await storeEmailsInDatabase([messageDetails], provider.user_id);

    return messageDetails;
}

/**
 * Watch Gmail for new messages (webhook setup)
 */
export async function setupGmailWatch(): Promise<void> {
    const provider = await getEmailProvider('gmail');
    if (!provider) {
        throw new Error('Gmail not connected');
    }

    const accessToken = await getValidAccessToken(provider);

    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/watch', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            topicName: `projects/${import.meta.env.VITE_GCP_PROJECT_ID}/topics/gmail`,
            labelIds: ['INBOX']
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to setup watch: ${error.error?.message || 'Unknown error'}`);
    }
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

// Helper functions
function decodeBase64Url(str: string): string {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    return atob(base64 + padding);
}

function encodeBase64Url(str: string): string {
    const base64 = btoa(unescape(encodeURIComponent(str)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
