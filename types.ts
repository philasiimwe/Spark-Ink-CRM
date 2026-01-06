export type Stage = 'lead' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type DealPriority = 'low' | 'medium' | 'high' | 'urgent';
export type DealSource = 'website' | 'referral' | 'cold_outreach' | 'partner' | 'marketing' | 'other';

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_country_code?: string;
  company: string;
  job_title: string;
  linkedin_url?: string;
  twitter_url?: string;
  location?: string;
  industry?: string;
  company_size?: string;
  website?: string;
  annual_revenue?: number;
  tags?: string[];
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Activity {
  id: string;
  deal_id?: string;
  contact_id?: string;
  account_id?: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'sms' | 'whatsapp';
  subject: string;
  due_date?: string;
  status: 'pending' | 'completed' | 'cancelled';
  description?: string;
  duration_minutes?: number;
  outcome?: string;
  created_at?: string;
}

export interface TeamMember {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url?: string;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  contact_id?: string;
  owner_id: string;
  stage: Stage;
  status: 'open' | 'won' | 'lost' | 'abandoned';
  created_at: string;
  updated_at: string;
  probability: number;
  expected_close_date?: string;
  priority: DealPriority;
  source?: string;
  description?: string;
  loss_reason?: string;
  tags: string[];
  is_followed: boolean;
}

export interface CRMState {
  deals: Deal[];
  contacts: Contact[];
  activities: Activity[];
  team: TeamMember[];
}

export type ViewType = 'PIPELINE' | 'CONTACTS' | 'ACTIVITIES' | 'INSIGHTS' | 'SETTINGS';
