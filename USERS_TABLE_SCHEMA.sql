-- Create the users table
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON public.users(email);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to authenticate
-- (This is intentionally open for login endpoint)
CREATE POLICY "Allow authentication" ON public.users
    FOR SELECT USING (true);

-- Insert a default admin user (change these credentials!)
-- Email: admin@church.com
-- Password: admin123 (CHANGE THIS!)

INSERT INTO public.users (email, password, name, role) VALUES
    ('admin@church.com', 'admin123', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;
