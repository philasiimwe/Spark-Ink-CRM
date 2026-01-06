// API Validation Schemas using Zod

import { z } from 'zod';

// Contact validation schema
export const contactSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address').optional().nullable(),
    phone: z.string().optional().nullable(),
    phone_country_code: z.string().default('+1'),
    mobile: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    job_title: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    linkedin_url: z.string().url('Invalid LinkedIn URL').optional().nullable(),
    twitter_url: z.string().url('Invalid Twitter URL').optional().nullable(),
    location: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    postal_code: z.string().optional().nullable(),
    industry: z.string().optional().nullable(),
    company_size: z.string().optional().nullable(),
    website: z.string().url('Invalid website URL').optional().nullable(),
    annual_revenue: z.number().optional().nullable(),
    lead_source: z.string().optional().nullable(),
    lead_score: z.number().min(0).max(100).default(0),
    tags: z.array(z.string()).default([]),
    custom_fields: z.record(z.any()).default({})
});

// Deal validation schema
export const dealSchema = z.object({
    title: z.string().min(1, 'Deal title is required'),
    value: z.number().min(0, 'Deal value must be positive').default(0),
    currency: z.string().default('USD'),
    contact_id: z.string().uuid('Invalid contact ID').optional().nullable(),
    account_id: z.string().uuid('Invalid account ID').optional().nullable(),
    pipeline_id: z.string().uuid('Invalid pipeline ID').optional().nullable(),
    stage: z.string().min(1, 'Stage is required'),
    status: z.enum(['open', 'won', 'lost', 'abandoned']).default('open'),
    probability: z.number().min(0).max(100).default(0),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    source: z.string().optional().nullable(),
    expected_close_date: z.string().optional().nullable(),
    closed_date: z.string().optional().nullable(),
    actual_value: z.number().optional().nullable(),
    loss_reason: z.string().optional().nullable(),
    next_step: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    tags: z.array(z.string()).default([]),
    is_followed: z.boolean().default(false),
    health_score: z.number().min(0).max(100).default(50),
    custom_fields: z.record(z.any()).default({})
});

// Activity validation schema
export const activitySchema = z.object({
    deal_id: z.string().uuid('Invalid deal ID').optional().nullable(),
    contact_id: z.string().uuid('Invalid contact ID').optional().nullable(),
    account_id: z.string().uuid('Invalid account ID').optional().nullable(),
    type: z.enum(['call', 'email', 'meeting', 'task', 'note', 'sms', 'whatsapp']),
    subject: z.string().min(1, 'Subject is required'),
    description: z.string().optional().nullable(),
    status: z.enum(['pending', 'completed', 'cancelled']).default('pending'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    due_date: z.string().optional().nullable(),
    completed_at: z.string().optional().nullable(),
    duration_minutes: z.number().optional().nullable(),
    outcome: z.string().optional().nullable(),
    recording_url: z.string().url('Invalid recording URL').optional().nullable(),
    transcript: z.string().optional().nullable(),
    metadata: z.record(z.any()).default({})
});

// Email validation schema
export const emailSchema = z.object({
    thread_id: z.string().optional().nullable(),
    message_id: z.string().optional().nullable(),
    deal_id: z.string().uuid('Invalid deal ID').optional().nullable(),
    contact_id: z.string().uuid('Invalid contact ID').optional().nullable(),
    account_id: z.string().uuid('Invalid account ID').optional().nullable(),
    direction: z.enum(['inbound', 'outbound']),
    from_email: z.string().email('Invalid from email'),
    to_emails: z.array(z.string().email('Invalid to email')),
    cc_emails: z.array(z.string().email('Invalid cc email')).optional().nullable(),
    bcc_emails: z.array(z.string().email('Invalid bcc email')).optional().nullable(),
    subject: z.string().optional().nullable(),
    body_text: z.string().optional().nullable(),
    body_html: z.string().optional().nullable(),
    has_attachments: z.boolean().default(false),
    attachments: z.array(z.any()).default([])
});

// Note validation schema
export const noteSchema = z.object({
    deal_id: z.string().uuid('Invalid deal ID').optional().nullable(),
    contact_id: z.string().uuid('Invalid contact ID').optional().nullable(),
    account_id: z.string().uuid('Invalid account ID').optional().nullable(),
    content: z.string().min(1, 'Note content is required'),
    is_pinned: z.boolean().default(false)
});

// Account validation schema
export const accountSchema = z.object({
    name: z.string().min(1, 'Account name is required'),
    parent_account_id: z.string().uuid('Invalid parent account ID').optional().nullable(),
    website: z.string().url('Invalid website URL').optional().nullable(),
    industry: z.string().optional().nullable(),
    employee_count: z.number().optional().nullable(),
    annual_revenue: z.number().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email('Invalid email').optional().nullable(),
    billing_address: z.string().optional().nullable(),
    shipping_address: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    logo_url: z.string().url('Invalid logo URL').optional().nullable(),
    status: z.string().default('active'),
    tags: z.array(z.string()).default([]),
    custom_fields: z.record(z.any()).default({})
});

// Pipeline validation schema
export const pipelineSchema = z.object({
    name: z.string().min(1, 'Pipeline name is required'),
    description: z.string().optional().nullable(),
    stages: z.array(z.object({
        id: z.string(),
        name: z.string(),
        probability: z.number().min(0).max(100),
        order: z.number()
    })),
    is_default: z.boolean().default(false),
    color: z.string().default('#3B82F6'),
    order_index: z.number().default(0)
});

// Validation helper functions
export function validateContact(data: unknown) {
    return contactSchema.parse(data);
}

export function validateDeal(data: unknown) {
    return dealSchema.parse(data);
}

export function validateActivity(data: unknown) {
    return activitySchema.parse(data);
}

export function validateEmail(data: unknown) {
    return emailSchema.parse(data);
}

export function validateNote(data: unknown) {
    return noteSchema.parse(data);
}

export function validateAccount(data: unknown) {
    return accountSchema.parse(data);
}

export function validatePipeline(data: unknown) {
    return pipelineSchema.parse(data);
}

// Safe validation that returns errors instead of throwing
export function safeValidateContact(data: unknown) {
    return contactSchema.safeParse(data);
}

export function safeValidateDeal(data: unknown) {
    return dealSchema.safeParse(data);
}

export function safeValidateActivity(data: unknown) {
    return activitySchema.safeParse(data);
}

export default {
    contactSchema,
    dealSchema,
    activitySchema,
    emailSchema,
    noteSchema,
    accountSchema,
    pipelineSchema,
    validateContact,
    validateDeal,
    validateActivity,
    validateEmail,
    validateNote,
    validateAccount,
    validatePipeline,
    safeValidateContact,
    safeValidateDeal,
    safeValidateActivity
};
