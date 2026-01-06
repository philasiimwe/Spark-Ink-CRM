// Twilio Integration for SMS, WhatsApp, and Voice calls
// Handles messaging and telephony features

const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER || '';
const TWILIO_WHATSAPP_NUMBER = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || '';

const TWILIO_BASE_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}`;

export interface TwilioMessage {
    sid: string;
    from: string;
    to: string;
    body: string;
    status: 'queued' | 'sent' | 'delivered' | 'failed';
    dateSent: string;
    mediaUrl?: string[];
}

/**
 * Send SMS message
 */
export async function sendSMS(to: string, message: string, mediaUrls?: string[]): Promise<TwilioMessage> {
    const formData = new URLSearchParams({
        To: to,
        From: TWILIO_PHONE_NUMBER,
        Body: message
    });

    if (mediaUrls && mediaUrls.length > 0) {
        mediaUrls.forEach(url => {
            formData.append('MediaUrl', url);
        });
    }

    const response = await fetch(`${TWILIO_BASE_URL}/Messages.json`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to send SMS: ${error.message || 'Unknown error'}`);
    }

    const data = await response.json();

    return {
        sid: data.sid,
        from: data.from,
        to: data.to,
        body: data.body,
        status: data.status,
        dateSent: data.date_sent,
        mediaUrl: data.media && data.media.length > 0 ? data.media.map((m: any) => m.url) : undefined
    };
}

/**
 * Send WhatsApp message
 */
export async function sendWhatsApp(to: string, message: string, mediaUrls?: string[]): Promise<TwilioMessage> {
    const formData = new URLSearchParams({
        To: `whatsapp:${to}`,
        From: `whatsapp:${TWILIO_WHATSAPP_NUMBER}`,
        Body: message
    });

    if (mediaUrls && mediaUrls.length > 0) {
        mediaUrls.forEach(url => {
            formData.append('MediaUrl', url);
        });
    }

    const response = await fetch(`${TWILIO_BASE_URL}/Messages.json`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to send WhatsApp message: ${error.message || 'Unknown error'}`);
    }

    const data = await response.json();

    return {
        sid: data.sid,
        from: data.from,
        to: data.to,
        body: data.body,
        status: data.status,
        dateSent: data.date_sent,
        mediaUrl: data.media && data.media.length > 0 ? data.media.map((m: any) => m.url) : undefined
    };
}

/**
 * Make outbound voice call
 */
export async function makeCall(to: string, callbackUrl: string): Promise<{
    sid: string;
    status: string;
}> {
    const formData = new URLSearchParams({
        To: to,
        From: TWILIO_PHONE_NUMBER,
        Url: callbackUrl // TwiML instructions for the call
    });

    const response = await fetch(`${TWILIO_BASE_URL}/Calls.json`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to make call: ${error.message || 'Unknown error'}`);
    }

    const data = await response.json();

    return {
        sid: data.sid,
        status: data.status
    };
}

/**
 * Get call recording
 */
export async function getCallRecording(callSid: string): Promise<{
    sid: string;
    url: string;
    duration: number;
}> {
    const response = await fetch(`${TWILIO_BASE_URL}/Calls/${callSid}/Recordings.json`, {
        headers: {
            Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch recording');
    }

    const data = await response.json();

    if (data.recordings && data.recordings.length > 0) {
        const recording = data.recordings[0];
        return {
            sid: recording.sid,
            url: `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`,
            duration: parseInt(recording.duration)
        };
    }

    throw new Error('No recording found');
}

/**
 * Get message status
 */
export async function getMessageStatus(messageSid: string): Promise<TwilioMessage> {
    const response = await fetch(`${TWILIO_BASE_URL}/Messages/${messageSid}.json`, {
        headers: {
            Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch message status');
    }

    const data = await response.json();

    return {
        sid: data.sid,
        from: data.from,
        to: data.to,
        body: data.body,
        status: data.status,
        dateSent: data.date_sent
    };
}

export default {
    sendSMS,
    sendWhatsApp,
    makeCall,
    getCallRecording,
    getMessageStatus
};
