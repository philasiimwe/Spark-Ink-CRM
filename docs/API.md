# Nexus CRM - API Documentation

## Overview

The Nexus CRM API provides a comprehensive set of endpoints for managing customer relationships, sales pipelines, and business operations. All API calls are authenticated using Supabase Auth and protected by Role-Based Access Control (RBAC).

## Base URL

```
Production: https://your-app.com/api
Development: http://localhost:3000/api
```

## Authentication

All API requests require authentication using a valid Supabase JWT token.

### Headers

```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### Getting a Token

```typescript
import { auth } from './lib/supabase';

const { data: { session } } = await auth.getSession();
const token = session?.access_token;
```

## Rate Limiting

The API implements client-side rate limiting to prevent abuse:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Standard API | 60 requests | 1 minute |
| Search | 30 requests | 1 minute |
| File Upload | 10 requests | 1 minute |
| AI Operations | 20 requests | 1 minute |
| Email Sending | 50 requests | 1 hour |

When rate limits are exceeded and queueing is enabled, requests will be automatically queued and processed when capacity becomes available.

## Permissions

All API endpoints are protected by RBAC. See the [Permissions](#permissions-reference) section for details.

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages.

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly error message",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Contacts API

### List Contacts

```http
GET /api/contacts
```

**Query Parameters:**
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `search` (string): Search by name, email, company
- `status` (string): Filter by status (active, inactive)

**Required Permission:** `contact:view`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Acme Inc",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

### Get Contact

```http
GET /api/contacts/:id
```

**Required Permission:** `contact:view`

**Response:**
```json
{
  "id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Inc",
  "job_title": "CEO",
  "status": "active",
  "tags": ["vip", "enterprise"],
  "custom_fields": {},
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### Create Contact

```http
POST /api/contacts
```

**Required Permission:** `contact:create`

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Inc",
  "job_title": "CEO",
  "status": "active"
}
```

**Response:** `201 Created`

---

### Update Contact

```http
PUT /api/contacts/:id
```

**Required Permission:** `contact:edit` (or `contact:edit_own` if you're the owner)

**Request Body:** (partial updates allowed)
```json
{
  "phone": "+0987654321",
  "status": "inactive"
}
```

**Response:** `200 OK`

---

### Delete Contact

```http
DELETE /api/contacts/:id
```

**Required Permission:** `contact:delete`

**Response:** `204 No Content`

---

## Deals API

### List Deals

```http
GET /api/deals
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `stage` (string): Filter by stage (lead, contacted, proposal, negotiation, won, lost)
- `priority` (string): Filter by priority (high, medium, low)
- `owner_id` (uuid): Filter by deal owner

**Required Permission:** `deal:view`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Enterprise Deal",
      "amount": 50000,
      "stage": "proposal",
      "priority": "high",
      "contact_id": "uuid",
      "owner_id": "uuid",
      "expected_close_date": "2024-02-01",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### Create Deal

```http
POST /api/deals
```

**Required Permission:** `deal:create`

**Request Body:**
```json
{
  "title": "Enterprise Deal",
  "amount": 50000,
  "stage": "lead",
  "priority": "high",
  "contact_id": "uuid",
  "expected_close_date": "2024-02-01",
  "description": "Large enterprise opportunity"
}
```

---

### Update Deal Stage

```http
PATCH /api/deals/:id/stage
```

**Required Permission:** `deal:edit`

**Request Body:**
```json
{
  "stage": "won",
  "notes": "Deal closed successfully"
}
```

---

## Activities API

### List Activities

```http
GET /api/activities
```

**Query Parameters:**
- `contact_id` (uuid): Filter by contact
- `deal_id` (uuid): Filter by deal
- `type` (string): Filter by type (call, email, meeting, task, note)
- `status` (string): Filter by status (pending, completed, cancelled)

**Required Permission:** `activity:view`

---

### Create Activity

```http
POST /api/activities
```

**Required Permission:** `activity:create`

**Request Body:**
```json
{
  "type": "meeting",
  "title": "Product Demo",
  "description": "Demonstrate features",
  "due_date": "2024-01-15T14:00:00Z",
  "contact_id": "uuid",
  "deal_id": "uuid",
  "status": "pending"
}
```

---

## Email API

### Send Email

```http
POST /api/emails/send
```

**Required Permission:** `email:send`

**Request Body:**
```json
{
  "to": ["contact@example.com"],
  "subject": "Follow-up",
  "body": "Email content",
  "template_id": "uuid",
  "contact_id": "uuid"
}
```

---

### Track Email Open

```http
POST /api/emails/:id/track/open
```

Automatically called when email is opened (tracking pixel).

---

### Track Email Click

```http
POST /api/emails/:id/track/click
```

**Request Body:**
```json
{
  "url": "https://example.com/link"
}
```

---

##Permissions Reference

### Contact Permissions
- `contact:view` - View contacts
- `contact:create` - Create new contacts
- `contact:edit` - Edit any contact
- `contact:edit_own` - Edit owned contacts only
- `contact:delete` - Delete contacts

### Deal Permissions
- `deal:view` - View deals
- `deal:view_all` - View all deals (not just own)
- `deal:create` - Create deals
- `deal:edit` - Edit any deal
- `deal:edit_own` - Edit owned deals only
- `deal:delete` - Delete deals

### Activity Permissions
- `activity:view` - View activities
- `activity:create` - Create activities
- `activity:edit` - Edit activities
- `activity:delete` - Delete activities

### Email Permissions
- `email:view` - View emails
- `email:send` - Send emails
- `email:template_create` - Create email templates

### User Permissions
- `user:view` - View users
- `user:create` - Create users (invite)
- `user:edit` - Edit users
- `user:delete` - Delete users

### Organization Permissions
- `organization:edit` - Edit organization settings
- `organization:billing` - Manage billing

---

## Data Validation

All API requests are validated using Zod schemas. Common validation rules:

### Email
- Must be a valid email format
- Example: `user@example.com`

### Phone
- Optional but must be valid if provided
- Example: `+1234567890`

### Deal Amount
- Must be a positive number
- Example: `50000.00`

### Dates
- Must be ISO 8601 format
- Example: `2024-01-15T14:00:00Z`

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { contactsAPI } from './lib/api';
import { withRateLimit } from './lib/api/rate-limiter';

// Create a contact with rate limiting
const contact = await withRateLimit('api', async () => {
  return await contactsAPI.create({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com'
  });
});

// List contacts
const contacts = await contactsAPI.list({ page: 1, limit: 20 });

// Update contact
await contactsAPI.update(contact.id, {
  phone: '+1234567890'
});
```

---

## Webhooks

The API supports webhooks for real-time event notifications. See Webhook documentation for details.

### Available Events
- `contact.created`
- `contact.updated`
- `deal.created`
- `deal.stage_changed`
- `activity.completed`
- `email.sent`
- `email.opened`
- `email.clicked`

---

## Best Practices

1. **Use Rate Limiting**: Always wrap API calls with `withRateLimit()` to queue requests
2. **Handle Errors**: Use try-catch blocks and check for specific error codes
3. **Validate Input**: Use the provided Zod schemas before making API calls
4. **Batch Requests**: When possible, batch related operations
5. **Cache Responses**: Cache frequently accessed data on the client
6. **Use Pagination**: Don't fetch all records at once, use pagination
7. **Respect Permissions**: Check permissions before showing UI elements

---

## Support

For API support, contact: support@nexuscrm.com
