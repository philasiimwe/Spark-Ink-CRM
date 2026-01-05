
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CRMState, Deal, Contact, Activity, Stage, TeamMember } from './types';

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  avatar?: string;
  googleClientId?: string;
}

interface CRMContextValue extends CRMState {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  addDeal: (dealData: any, newContactData?: Omit<Contact, 'id'>) => void;
  updateDealStage: (dealId: string, stage: Stage, lossReason?: string) => void;
  updateDeal: (dealId: string, updates: Partial<Deal>) => void;
  deleteDeal: (dealId: string) => void;
  addContact: (contact: Omit<Contact, 'id'>) => Contact;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  toggleFollowDeal: (dealId: string) => void;
  activeDealId: string | null;
  setActiveDealId: (id: string | null) => void;
}

const CRMContext = createContext<CRMContextValue | undefined>(undefined);

const TEAM: TeamMember[] = [
  { id: 'tm1', name: 'John Doe', role: 'Senior Partner' },
  { id: 'tm2', name: 'Sarah Chen', role: 'Account Executive' },
  { id: 'tm3', name: 'Michael Okello', role: 'Sales Lead' },
  { id: 'tm4', name: 'Elena Rodriguez', role: 'BDM' },
];

const INITIAL_STATE: CRMState & { user: UserProfile } = {
  user: {
    name: 'John Doe',
    email: 'john@nexus.com',
    bio: 'Senior Partner managing the EMEA region expansion deals.',
    googleClientId: ''
  },
  team: TEAM,
  deals: [
    { 
      id: '1', title: 'TechCorp Expansion', value: 25000, currency: 'USD', contactId: 'c1', ownerId: 'tm1', stage: 'LEAD', 
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), probability: 20,
      priority: 'HOT', source: 'REFERRAL', expectedCloseDate: '2025-12-15', tags: ['Enterprise', 'Q4'], isFollowed: true
    },
    { 
      id: '2', title: 'Global Logistics Software', value: 180000000, currency: 'UGX', contactId: 'c2', ownerId: 'tm2', stage: 'CONTACTED', 
      createdAt: new Date(Date.now() - 604800000 * 2).toISOString(), updatedAt: new Date(Date.now() - 604800000 * 2).toISOString(), probability: 40,
      priority: 'WARM', source: 'WEBSITE', expectedCloseDate: '2025-11-30', tags: ['SaaS'], isFollowed: false
    },
  ],
  contacts: [
    { 
      id: 'c1', firstName: 'Alice', lastName: 'Johnson', name: 'Alice Johnson', 
      email: 'alice@techcorp.com', phone: '772123456', phoneCountryCode: '+256', company: 'TechCorp',
      jobTitle: 'VP of Engineering', linkedinUrl: 'https://linkedin.com/in/alice',
      location: 'San Francisco, CA', industry: 'SaaS', companySize: '500-1000'
    },
    { 
      id: 'c2', firstName: 'Bob', lastName: 'Smith', name: 'Bob Smith', 
      email: 'bob@logistics.co', phone: '701987654', phoneCountryCode: '+256', company: 'Global Logistics',
      jobTitle: 'Director of Operations', linkedinUrl: 'https://linkedin.com/in/bobsmith',
      location: 'Chicago, IL', industry: 'Logistics', companySize: '1000+'
    },
  ],
  activities: [
    { id: 'a1', dealId: '1', type: 'CALL', subject: 'Initial Discovery Call', dueDate: '2024-05-20', status: 'PENDING' },
  ],
};

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CRMState & { user: UserProfile }>(() => {
    const saved = localStorage.getItem('nexus_crm_data_v7');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });
  const [activeDealId, setActiveDealId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('nexus_crm_data_v7', JSON.stringify(state));
  }, [state]);

  const updateUser = useCallback((updates: Partial<UserProfile>) => {
    setState(prev => ({ ...prev, user: { ...prev.user, ...updates } }));
  }, []);

  const updateTeamMember = useCallback((id: string, updates: Partial<TeamMember>) => {
    setState(prev => ({
      ...prev,
      team: prev.team.map(m => m.id === id ? { ...m, ...updates } : m)
    }));
  }, []);

  const addContact = useCallback((contactData: Omit<Contact, 'id'>): Contact => {
    const newContact: Contact = { 
      ...contactData, 
      id: 'c' + Date.now(),
      name: `${contactData.firstName} ${contactData.lastName}`
    };
    setState(prev => ({ ...prev, contacts: [newContact, ...prev.contacts] }));
    return newContact;
  }, []);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setState(prev => ({
      ...prev,
      contacts: prev.contacts.map(c => c.id === id ? { ...c, ...updates, name: updates.firstName && updates.lastName ? `${updates.firstName} ${updates.lastName}` : c.name } : c)
    }));
  }, []);

  const addDeal = useCallback((dealData: any, newContactData?: Omit<Contact, 'id'>) => {
    let finalContactId = dealData.contactId;
    
    if (newContactData) {
      const created = addContact(newContactData);
      finalContactId = created.id;
    }

    const newDeal: Deal = {
      ...dealData,
      contactId: finalContactId,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFollowed: false
    };
    setState(prev => ({ ...prev, deals: [newDeal, ...prev.deals] }));
  }, [addContact]);

  const updateDeal = useCallback((dealId: string, updates: Partial<Deal>) => {
    setState(prev => ({
      ...prev,
      deals: prev.deals.map(d => d.id === dealId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d)
    }));
  }, []);

  const updateDealStage = useCallback((dealId: string, stage: Stage, lossReason?: string) => {
    setState(prev => ({
      ...prev,
      deals: prev.deals.map(d => d.id === dealId ? { 
        ...d, 
        stage, 
        lossReason: stage === 'CLOSED_LOST' ? lossReason : d.lossReason,
        updatedAt: new Date().toISOString() 
      } : d)
    }));
  }, []);

  const toggleFollowDeal = useCallback((dealId: string) => {
    setState(prev => ({
      ...prev,
      deals: prev.deals.map(d => d.id === dealId ? { ...d, isFollowed: !d.isFollowed } : d)
    }));
  }, []);

  const deleteDeal = useCallback((dealId: string) => {
    setState(prev => ({ ...prev, deals: prev.deals.filter(d => d.id !== dealId) }));
  }, []);

  const addActivity = useCallback((activityData: Omit<Activity, 'id'>) => {
    const newActivity: Activity = { ...activityData, id: 'a' + Date.now() };
    setState(prev => ({ ...prev, activities: [newActivity, ...prev.activities] }));
  }, []);

  return (
    <CRMContext.Provider value={{ 
      ...state, 
      updateUser,
      updateTeamMember,
      addDeal, 
      updateDealStage, 
      updateDeal, 
      deleteDeal, 
      addContact, 
      updateContact,
      addActivity, 
      toggleFollowDeal,
      activeDealId,
      setActiveDealId
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) throw new Error('useCRM must be used within CRMProvider');
  return context;
};
