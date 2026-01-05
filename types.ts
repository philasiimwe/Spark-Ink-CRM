
export type Stage = 'LEAD' | 'CONTACTED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
export type DealPriority = 'HOT' | 'WARM' | 'COLD';
export type DealSource = 'WEBSITE' | 'REFERRAL' | 'COLD_OUTREACH' | 'PARTNER' | 'MARKETING' | 'OTHER';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  company: string;
  jobTitle: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  annualRevenue?: string;
}

export interface Activity {
  id: string;
  dealId: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK';
  subject: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED';
  notes?: string;
  duration?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  contactId: string;
  ownerId: string;
  stage: Stage;
  createdAt: string;
  updatedAt: string;
  probability: number;
  expectedCloseDate?: string;
  priority: DealPriority;
  source: DealSource;
  notes?: string;
  lossReason?: string;
  tags: string[];
  isFollowed: boolean;
}

export interface CRMState {
  deals: Deal[];
  contacts: Contact[];
  activities: Activity[];
  team: TeamMember[];
}

export type ViewType = 'PIPELINE' | 'CONTACTS' | 'ACTIVITIES' | 'INSIGHTS' | 'SETTINGS';
