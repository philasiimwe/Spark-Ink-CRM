-- ============================================
-- NEXUS CRM - Complete Database Schema
-- Database: Supabase (PostgreSQL)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ORGANIZATIONS & TENANCY
-- ============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  industry TEXT,
  size TEXT,
  website TEXT,
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  avatar_url TEXT,
  phone TEXT,
  job_title TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member', 'viewer')),
  permissions JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en-US',
  preferences JSONB DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTACTS
-- ============================================

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email TEXT,
  phone TEXT,
  phone_country_code TEXT DEFAULT '+1',
  mobile TEXT,
  company TEXT,
  job_title TEXT,
  department TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  location TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  industry TEXT,
  company_size TEXT,
  website TEXT,
  annual_revenue NUMERIC,
  lead_source TEXT,
  lead_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_organization ON contacts(organization_id);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_company ON contacts(company);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);

-- ============================================
-- ACCOUNTS (Companies)
-- ============================================

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id),
  parent_account_id UUID REFERENCES accounts(id),
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  employee_count INTEGER,
  annual_revenue NUMERIC,
  phone TEXT,
  email TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  description TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'active',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounts_organization ON accounts(organization_id);
CREATE INDEX idx_accounts_owner ON accounts(owner_id);

-- ============================================
-- DEALS (Opportunities)
-- ============================================

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id UUID REFERENCES pipelines(id),
  title TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  contact_id UUID REFERENCES contacts(id),
  account_id UUID REFERENCES accounts(id),
  owner_id UUID REFERENCES users(id),
  stage TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  probability INTEGER DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  source TEXT,
  expected_close_date DATE,
  closed_date DATE,
  actual_value NUMERIC,
  loss_reason TEXT,
  next_step TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_followed BOOLEAN DEFAULT false,
  health_score INTEGER DEFAULT 50,
  last_activity_at TIMESTAMPTZ,
  stale_days INTEGER GENERATED ALWAYS AS (
    EXTRACT(DAY FROM (NOW() - COALESCE(last_activity_at, updated_at)))
  ) STORED,
  custom_fields JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deals_organization ON deals(organization_id);
CREATE INDEX idx_deals_pipeline ON deals(pipeline_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_tags ON deals USING GIN(tags);

-- ============================================
-- PIPELINES
-- ============================================

CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  stages JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#3B82F6',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITIES
-- ============================================

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  account_id UUID REFERENCES accounts(id),
  owner_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'task', 'note', 'sms', 'whatsapp')),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  outcome TEXT,
  recording_url TEXT,
  transcript TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_organization ON activities(organization_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_owner ON activities(owner_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_due_date ON activities(due_date);

-- ============================================
-- EMAILS
-- ============================================

CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  thread_id TEXT,
  message_id TEXT UNIQUE,
  deal_id UUID REFERENCES deals(id),
  contact_id UUID REFERENCES contacts(id),
  account_id UUID REFERENCES accounts(id),
  user_id UUID REFERENCES users(id),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  from_email TEXT NOT NULL,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  snippet TEXT,
  has_attachments BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  status TEXT DEFAULT 'sent',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emails_organization ON emails(organization_id);
CREATE INDEX idx_emails_thread ON emails(thread_id);
CREATE INDEX idx_emails_deal ON emails(deal_id);
CREATE INDEX idx_emails_contact ON emails(contact_id);

-- ============================================
-- EMAIL TEMPLATES
-- ============================================

CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  category TEXT,
  variables TEXT[] DEFAULT '{}',
  is_shared BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMAIL SEQUENCES
-- ============================================

CREATE TABLE email_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  steps JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS
-- ============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  category TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC,
  currency TEXT DEFAULT 'USD',
  billing_period TEXT CHECK (billing_period IN ('one-time', 'monthly', 'quarterly', 'annually')),
  is_active BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEAL PRODUCTS (Line Items)
-- ============================================

CREATE TABLE deal_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  tax_percent NUMERIC DEFAULT 0,
  total_amount NUMERIC GENERATED ALWAYS AS (
    (quantity * unit_price) - discount_amount - (quantity * unit_price * discount_percent / 100)
  ) STORED,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS
-- ============================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  deal_id UUID REFERENCES deals(id),
  contact_id UUID REFERENCES contacts(id),
  account_id UUID REFERENCES accounts(id),
  folder TEXT,
  version INTEGER DEFAULT 1,
  is_signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKFLOWS (Automation)
-- ============================================

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  conditions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKFLOW EXECUTIONS
-- ============================================

CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  trigger_data JSONB,
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- WEBHOOKS
-- ============================================

CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  headers JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEBHOOK DELIVERIES
-- ============================================

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 0,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTES
-- ============================================

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id),
  contact_id UUID REFERENCES contacts(id),
  account_id UUID REFERENCES accounts(id),
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- REPORTS
-- ============================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  filters JSONB DEFAULT '{}',
  columns JSONB DEFAULT '[]',
  chart_config JSONB,
  is_shared BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INTEGRATIONS
-- ============================================

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  credentials JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOM FIELDS
-- ============================================

CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'deal', 'account', 'activity')),
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect', 'url', 'email', 'phone')),
  field_options JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, entity_type, field_name)
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================
-- TAGS
-- ============================================

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  entity_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name, entity_type)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multi-tenant access
-- Policy pattern: Users can only access data from their organization

CREATE POLICY "Users can access their organization data" ON contacts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization deals" ON deals
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization activities" ON activities
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization accounts" ON accounts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization emails" ON emails
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization email_templates" ON email_templates
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization email_sequences" ON email_sequences
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization products" ON products
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization documents" ON documents
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization workflows" ON workflows
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization webhooks" ON webhooks
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization notes" ON notes
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization audit_logs" ON audit_logs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization reports" ON reports
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization integrations" ON integrations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization notifications" ON notifications
  FOR ALL USING (
    user_id = auth.uid()
  );

CREATE POLICY "Users can access their organization tags" ON tags
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization custom_field_definitions" ON custom_field_definitions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their organization pipelines" ON pipelines
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Special policy for users table - users can see their own profile and colleagues
CREATE POLICY "Users can access their organization users" ON users
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Special policy for organizations - users can see their own organization
CREATE POLICY "Users can access their organization" ON organizations
  FOR ALL USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );


-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_sequences_updated_at BEFORE UPDATE ON email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update deal's last_activity_at when activities are created
CREATE OR REPLACE FUNCTION update_deal_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deal_id IS NOT NULL THEN
    UPDATE deals SET last_activity_at = NOW() WHERE id = NEW.deal_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deal_activity_timestamp
  AFTER INSERT ON activities
  FOR EACH ROW EXECUTE FUNCTION update_deal_last_activity();

-- Function to automatically create audit log entries
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Get organization_id from the record
  IF TG_OP = 'DELETE' THEN
    org_id := OLD.organization_id;
    INSERT INTO audit_logs (
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      created_at
    ) VALUES (
      org_id,
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD),
      NOW()
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    org_id := NEW.organization_id;
    INSERT INTO audit_logs (
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      created_at
    ) VALUES (
      org_id,
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW),
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    org_id := NEW.organization_id;
    INSERT INTO audit_logs (
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      new_values,
      created_at
    ) VALUES (
      org_id,
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW),
      NOW()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create audit triggers for critical tables
CREATE TRIGGER audit_deals_changes
  AFTER INSERT OR UPDATE OR DELETE ON deals
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_contacts_changes
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_accounts_changes
  AFTER INSERT OR UPDATE OR DELETE ON accounts
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Function to generate unique slug for organizations
CREATE OR REPLACE FUNCTION generate_unique_slug(org_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Create base slug: lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  final_slug := base_slug;
  
  -- Check if slug exists, if so, append number
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = final_slug) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ language 'plpgsql';

-- Function to archive old completed activities
CREATE OR REPLACE FUNCTION archive_old_activities()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Archive activities completed more than 90 days ago
  WITH archived AS (
    UPDATE activities
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'),
      '{archived}',
      'true'::jsonb
    )
    WHERE status = 'completed'
      AND completed_at < NOW() - INTERVAL '90 days'
      AND NOT (metadata->>'archived')::boolean
    RETURNING id
  )
  SELECT COUNT(*) INTO archived_count FROM archived;
  
  RETURN archived_count;
END;
$$ language 'plpgsql';

-- Function to auto-assign deals based on round-robin
CREATE OR REPLACE FUNCTION auto_assign_deal()
RETURNS TRIGGER AS $$
DECLARE
  next_owner_id UUID;
BEGIN
  -- If no owner assigned, find the team member with fewest open deals
  IF NEW.owner_id IS NULL THEN
    SELECT u.id INTO next_owner_id
    FROM users u
    WHERE u.organization_id = NEW.organization_id
      AND u.role IN ('owner', 'admin', 'manager', 'member')
      AND u.status = 'active'
    LEFT JOIN deals d ON d.owner_id = u.id AND d.status = 'open'
    GROUP BY u.id
    ORDER BY COUNT(d.id) ASC, RANDOM()
    LIMIT 1;
    
    IF next_owner_id IS NOT NULL THEN
      NEW.owner_id := next_owner_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-assignment (optional - commented out by default)
-- CREATE TRIGGER auto_assign_new_deals
--   BEFORE INSERT ON deals
--   FOR EACH ROW EXECUTE FUNCTION auto_assign_deal();


-- ============================================
-- VIEWS
-- ============================================

-- Deal Pipeline View with metrics
CREATE OR REPLACE VIEW deal_pipeline_metrics AS
SELECT 
  d.organization_id,
  d.pipeline_id,
  d.stage,
  d.owner_id,
  COUNT(*) as deal_count,
  SUM(d.value) as total_value,
  AVG(d.probability) as avg_probability,
  AVG(EXTRACT(DAY FROM (NOW() - d.created_at))) as avg_age_days
FROM deals d
WHERE d.status = 'open'
GROUP BY d.organization_id, d.pipeline_id, d.stage, d.owner_id;

-- Contact engagement view
CREATE OR REPLACE VIEW contact_engagement AS
SELECT 
  c.id,
  c.organization_id,
  c.full_name,
  c.email,
  COUNT(DISTINCT a.id) as activity_count,
  MAX(a.created_at) as last_activity_at,
  COUNT(DISTINCT d.id) as deal_count,
  SUM(d.value) as total_deal_value
FROM contacts c
LEFT JOIN activities a ON a.contact_id = c.id
LEFT JOIN deals d ON d.contact_id = c.id
GROUP BY c.id, c.organization_id, c.full_name, c.email;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default pipeline stages
INSERT INTO pipelines (organization_id, name, stages, is_default) VALUES
  (
    (SELECT id FROM organizations LIMIT 1),
    'Sales Pipeline',
    '[
      {"id": "lead", "label": "Lead", "color": "#6366F1"},
      {"id": "contacted", "label": "Contacted", "color": "#8B5CF6"},
      {"id": "proposal", "label": "Proposal", "color": "#3B82F6"},
      {"id": "negotiation", "label": "Negotiation", "color": "#F59E0B"},
      {"id": "closed_won", "label": "Closed Won", "color": "#10B981"},
      {"id": "closed_lost", "label": "Closed Lost", "color": "#EF4444"}
    ]'::jsonb,
    true
  );
