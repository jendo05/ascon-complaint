
CREATE TYPE user_role AS ENUM ('customer', 'dept_member', 'admin');
CREATE TYPE ticket_status AS ENUM ('open', 'escalated', 'pending_user_confirmation', 'resolved');


-- Departments Table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL
);

-- Profiles Table (Automatically links to Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'customer',
    department_id UUID REFERENCES departments(id),
    email TEXT,
    username TEXT UNIQUE
);

-- Function to automatically create a profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username' -- Pulls username from signup data
  );
  RETURN new;
END;
$$;

-- Trigger that listens for new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Complaints Table
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES profiles(id) NOT NULL,
    department_id UUID REFERENCES departments(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status ticket_status DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Replies Table (For the chat/resolution history)
CREATE TABLE replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- These safely grab the user's role/department without querying the table heavily
CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role
LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_dept() RETURNS UUID
LANGUAGE sql SECURITY DEFINER STABLE AS $$
    SELECT department_id FROM profiles WHERE id = auth.uid();
$$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read, users can update their own
CREATE POLICY "Read profiles" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Departments: Anyone can view departments
CREATE POLICY "View departments" ON departments FOR SELECT USING (true);

-- Complaints SELECT: Customers see their own. Dept members see their department's. Admins see all.
CREATE POLICY "Select complaints" ON complaints FOR SELECT
USING (
    customer_id = auth.uid() 
    OR get_user_role() = 'admin' 
    OR (get_user_role() = 'dept_member' AND department_id = get_user_dept())
);

-- Complaints INSERT: Customers can create complaints
CREATE POLICY "Insert complaints" ON complaints FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Complaints UPDATE (Staff): Admins and Dept Members can update statuses freely
CREATE POLICY "Update complaints (Staff)" ON complaints FOR UPDATE
USING (
    get_user_role() = 'admin' 
    OR (get_user_role() = 'dept_member' AND department_id = get_user_dept())
);

-- Complaints UPDATE (Customers): Customers can ONLY update to confirm resolution. 
-- They cannot escalate or change the status to anything other than 'resolved'.
CREATE POLICY "Customers confirm resolution" ON complaints FOR UPDATE
USING (
    auth.uid() = customer_id AND status = 'pending_user_confirmation'
)
WITH CHECK (
    status = 'resolved'
);

-- Replies: Viewable if you have access to the parent complaint
CREATE POLICY "Select replies" ON replies FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM complaints c
        WHERE c.id = complaint_id
        AND (c.customer_id = auth.uid() OR get_user_role() = 'admin' OR (get_user_role() = 'dept_member' AND c.department_id = get_user_dept()))
    )
);

CREATE POLICY "Insert replies" ON replies FOR INSERT
WITH CHECK (auth.uid() = sender_id);


-- Enable pg_cron (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule auto-escalation (Runs at midnight daily, escalates 3-day old open tickets)
SELECT cron.schedule(
    'auto_escalate_complaints',
    '0 0 * * *', 
    $$
    UPDATE complaints 
    SET status = 'escalated' 
    WHERE status = 'open' AND created_at < NOW() - INTERVAL '3 days';
    $$
);