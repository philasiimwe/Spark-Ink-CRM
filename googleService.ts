
/**
 * Google Service for Nexus CRM
 * Handles Google Calendar and Meet integrations using Google Identity Services.
 */

declare var google: any;

const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

export interface GoogleEventParams {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  attendees: string[];
  useMeet?: boolean;
}

class GoogleIntegrationService {
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private currentClientId: string = '';

  /**
   * Configures the Google OAuth2 client with a Client ID.
   * This must be called before attempting to connect.
   */
  public setClientId(clientId: string) {
    if (!clientId || clientId === this.currentClientId) return;
    
    this.currentClientId = clientId;
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
      try {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.error !== undefined) {
              console.error('OAuth Error Response:', response);
              return;
            }
            this.accessToken = response.access_token;
            console.log('Google Access Token successfully acquired');
          },
        });
      } catch (e) {
        console.error('GIS initialization error:', e);
      }
    } else {
      console.warn('Google Identity Services script not loaded yet or unavailable.');
    }
  }

  /**
   * Triggers the Google OAuth2 consent flow.
   */
  public async connect(clientId?: string): Promise<string> {
    if (clientId) {
      this.setClientId(clientId);
    }
    
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        return reject(new Error('Google Client ID is not configured. Please visit Settings > Integrations to set your Client ID.'));
      }
      
      // Override the callback for this specific connection request
      this.tokenClient.callback = (response: any) => {
        if (response.error !== undefined) {
          return reject(new Error(`Authentication failed: ${response.error_description || response.error}`));
        }
        this.accessToken = response.access_token;
        resolve(this.accessToken);
      };

      try {
        if (this.accessToken === null) {
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
          this.tokenClient.requestAccessToken({ prompt: '' });
        }
      } catch (e: any) {
        reject(new Error(`Failed to request access token: ${e.message || 'Unknown error'}`));
      }
    });
  }

  /**
   * Creates a Google Calendar event, optionally with a Google Meet link.
   */
  public async createCalendarEvent(params: GoogleEventParams) {
    if (!this.accessToken) {
      await this.connect();
    }

    const event: any = {
      'summary': params.summary,
      'description': params.description,
      'start': {
        'dateTime': params.startDateTime,
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      'end': {
        'dateTime': params.endDateTime,
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      'attendees': params.attendees.map(email => ({ 'email': email })),
      'reminders': {
        'useDefault': true,
      },
    };

    // Add Google Meet configuration
    if (params.useMeet) {
      event.conferenceData = {
        createRequest: {
          requestId: Math.random().toString(36).substring(7),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    try {
      // Use standard Fetch API with the OAuth2 Bearer token
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      const data = await response.json();
      
      if (data.error) {
        // Handle token expiration or common errors
        if (data.error.code === 401) {
          this.accessToken = null; // Reset token on 401
          return this.createCalendarEvent(params); // Retry once (will trigger connect())
        }
        throw new Error(data.error.message || 'Unknown Calendar API Error');
      }
      
      return data;
    } catch (err: any) {
      console.error('Error creating Google Calendar event:', err);
      throw err;
    }
  }

  /**
   * Returns true if a valid access token exists.
   */
  public isConnected() {
    return !!this.accessToken;
  }
}

export const googleService = new GoogleIntegrationService();
