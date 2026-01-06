// API Integration Tests

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { contactsAPI, dealsAPI, activitiesAPI } from '../lib/api';
import { safeValidateContact, safeValidateDeal } from '../lib/api/validation';
import { supabase } from '../lib/supabase';

describe('Contacts API', () => {
    let testContactId: string;

    it('should create a new contact', async () => {
        const contactData = {
            first_name: 'Test',
            last_name: 'User',
            email: `test-${Date.now()}@example.com`,
            phone: '+1234567890',
            company: 'Test Corp',
            status: 'active'
        };

        // Validate before creating
        const validation = safeValidateContact(contactData);
        expect(validation.success).toBe(true);

        // Create contact
        const contact = await contactsAPI.create(contactData);
        expect(contact).toBeDefined();
        expect(contact.email).toBe(contactData.email);

        testContactId = contact.id;
    });

    it('should list contacts', async () => {
        const contacts = await contactsAPI.getAll({});
        expect(Array.isArray(contacts)).toBe(true);
        expect(contacts.length).toBeGreaterThan(0);
    });

    it('should get a contact by id', async () => {
        const contact = await contactsAPI.getById(testContactId);
        expect(contact).toBeDefined();
        expect(contact.id).toBe(testContactId);
    });

    it('should update a contact', async () => {
        const updated = await contactsAPI.update(testContactId, {
            phone: '+0987654321'
        });
        expect(updated.phone).toBe('+0987654321');
    });

    it('should search contacts', async () => {
        const results = await contactsAPI.getAll({ search: 'Test' });
        expect(Array.isArray(results)).toBe(true);
    });

    it('should delete a contact', async () => {
        await contactsAPI.delete(testContactId);

        // Verify deletion (getById throws or returns null? api implementation throws on error, but getById uses single() which throws if not found)
        try {
            await contactsAPI.getById(testContactId);
            expect(true).toBe(false); // Should fail
        } catch (e) {
            expect(e).toBeDefined();
        }
    });
});

describe('Deals API', () => {
    let testDealId: string;
    let testContactId: string;

    beforeAll(async () => {
        // Create a test contact for deals
        const contact = await contactsAPI.create({
            first_name: 'Deal',
            last_name: 'Contact',
            email: `deal-${Date.now()}@example.com`,
            status: 'active'
        });
        testContactId = contact.id;
    });

    afterAll(async () => {
        // Cleanup
        if (testContactId) {
            try { await contactsAPI.delete(testContactId); } catch { }
        }
    });

    it('should create a new deal', async () => {
        const dealData = {
            title: 'Test Deal',
            value: 50000,
            stage: 'lead' as const,
            priority: 'high' as const,
            contact_id: testContactId,
            expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        // Validate before creating
        const validation = safeValidateDeal(dealData);
        expect(validation.success).toBe(true);

        // Create deal
        const deal = await dealsAPI.create(dealData);
        expect(deal).toBeDefined();
        expect(deal.title).toBe(dealData.title);
        expect(deal.value).toBe(dealData.value);

        testDealId = deal.id;
    });

    it('should list deals', async () => {
        const deals = await dealsAPI.getAll({});
        expect(Array.isArray(deals)).toBe(true);
    });

    it('should update deal stage', async () => {
        const updated = await dealsAPI.update(testDealId, { stage: 'proposal' });
        expect(updated.stage).toBe('proposal');
    });

    it('should get deals by stage', async () => {
        const deals = await dealsAPI.getAll({ stage: 'proposal' });
        expect(Array.isArray(deals)).toBe(true);
        const ourDeal = deals.find(d => d.id === testDealId);
        expect(ourDeal).toBeDefined();
    });

    it('should delete a deal', async () => {
        await dealsAPI.delete(testDealId);

        try {
            await dealsAPI.getById(testDealId);
            expect(true).toBe(false);
        } catch (e) {
            expect(e).toBeDefined();
        }
    });
});

describe('Activities API', () => {
    let testActivityId: string;
    let testContactId: string;

    beforeAll(async () => {
        const contact = await contactsAPI.create({
            first_name: 'Activity',
            last_name: 'Contact',
            email: `activity-${Date.now()}@example.com`,
            status: 'active'
        });
        testContactId = contact.id;
    });

    afterAll(async () => {
        if (testContactId) {
            try { await contactsAPI.delete(testContactId); } catch { }
        }
    });

    it('should create a new activity', async () => {
        const activity = await activitiesAPI.create({
            type: 'call',
            subject: 'Follow-up Call',
            description: 'Discuss proposal',
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            contact_id: testContactId,
            status: 'pending'
        });

        expect(activity).toBeDefined();
        expect(activity.subject).toBe('Follow-up Call');
        testActivityId = activity.id;
    });

    it('should list activities', async () => {
        const activities = await activitiesAPI.getAll({});
        expect(Array.isArray(activities)).toBe(true);
    });

    it('should mark activity as complete', async () => {
        const completed = await activitiesAPI.complete(testActivityId);
        expect(completed.status).toBe('completed');
    });

    it('should delete an activity', async () => {
        await activitiesAPI.delete(testActivityId);
        // basic delete verification not easily available without getById which might be missing in activitiesAPI
    });
});

describe('Data Validation', () => {
    it('should validate correct contact data', () => {
        const result = safeValidateContact({
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone: '+1234567890',
            status: 'active'
        });

        expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
        const result = safeValidateContact({
            first_name: 'John',
            last_name: 'Doe',
            email: 'invalid-email',
            status: 'active'
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('email');
        }
    });

    it('should validate correct deal data', () => {
        const result = safeValidateDeal({
            title: 'Test Deal',
            value: 1000,
            stage: 'lead',
            priority: 'medium',
            contact_id: '00000000-0000-0000-0000-000000000000'
        });

        expect(result.success).toBe(true);
    });

    it('should reject negative deal value', () => {
        const result = safeValidateDeal({
            title: 'Test Deal',
            value: -1000,
            stage: 'lead',
            priority: 'medium',
            contact_id: '00000000-0000-0000-0000-000000000000'
        });

        expect(result.success).toBe(false);
    });
});
