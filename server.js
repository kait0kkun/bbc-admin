const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Missing Supabase credentials!');
    console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory with absolute path
const publicPath = path.join(__dirname, 'public');
console.log(`📁 Serving static files from: ${publicPath}`);
app.use(express.static(publicPath));

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// ============================================
// API Routes
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: 'Supabase'
    });
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        // Query users table
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error || !data) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Simple password validation (in production, use bcrypt)
        // For now, we'll do a basic comparison
        if (data.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { id: data.id, email: data.email, name: data.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({ token, user: { id: data.id, email: data.email, name: data.name } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});

// Setup - Create first admin user (only works if no users exist)
app.post('/api/auth/setup', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        
        // Check if users table has any records
        const { data: existingUsers } = await supabase
            .from('users')
            .select('id')
            .limit(1);
        
        if (existingUsers && existingUsers.length > 0) {
            return res.status(403).json({ message: 'Setup already completed' });
        }
        
        // Create first user
        const { data, error } = await supabase
            .from('users')
            .insert([{
                email,
                password,
                name,
                role: 'admin'
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.status(201).json({ message: 'Admin user created successfully' });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ message: 'Setup failed' });
    }
});

// ============================================
// USERS MANAGEMENT ROUTES
// ============================================

// Get all users
app.get('/api/users', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single user
app.get('/api/users/:id', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, email, name, role, created_at')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(404).json({ error: 'User not found' });
    }
});

// Create user
app.post('/api/users', verifyToken, async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        const { data, error } = await supabase
            .from('users')
            .insert([{
                email,
                password,
                name,
                role: role || 'user'
            }])
            .select('id, email, name, role, created_at');

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'Email already exists' });
            }
            throw error;
        }
        
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update user
app.put('/api/users/:id', verifyToken, async (req, res) => {
    try {
        const { email, name, role } = req.body;
        const updateData = {};
        
        if (email) updateData.email = email;
        if (name) updateData.name = name;
        if (role) updateData.role = role;
        
        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', req.params.id)
            .select('id, email, name, role, created_at')
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete user
app.delete('/api/users/:id', verifyToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// MEMBERS ROUTES
// ============================================

// Get all members
app.get('/api/members', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single member
app.get('/api/members/:id', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching member:', error);
        res.status(404).json({ error: 'Member not found' });
    }
});

// Create member
app.post('/api/members', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
        .from("members")
        .insert([req.body])
        .select();

        if (error) {
        console.error("SUPABASE INSERT ERROR:", error);
        return res.status(400).json({
            message: error.message,
            details: error.details,
            hint: error.hint,
        });
        }
        
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating member:', error);
        res.status(500).json({ error: error.message });
    }
});


// Update member
app.put('/api/members/:id', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('members')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete member
app.delete('/api/members/:id', verifyToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Member deleted successfully' });
    } catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// EVENTS ROUTES
// ============================================

// Get all events
app.get('/api/events', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get single event
app.get('/api/events/:id', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(404).json({ error: 'Event not found' });
    }
});

// Create event
app.post('/api/events', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('events')
            .insert([req.body])
            .select()

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update event
app.put('/api/events/:id', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('events')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete event
app.delete('/api/events/:id', verifyToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// REGISTRATIONS ROUTES
// ============================================

// Get all registrations with member and event details
app.get('/api/registrations', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('registrations')
            .select(`
                *,
                member:member_id(id, name, email),
                event:event_id(id, name, date)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create registration
app.post('/api/registrations', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('registrations')
            .insert([{
                member_id: req.body.memberId,
                event_id: req.body.eventId
            }])
            .select();

        if (error) {
            // Check for duplicate registration error
            if (error.code === '23505') {
                return res.status(409).json({ 
                    error: 'This member is already registered for this event',
                    code: 'DUPLICATE_REGISTRATION'
                });
            }
            throw error;
        }

        res.status(201).json(data[0]); // send back the inserted registration
    } catch (error) {
        console.error('Error creating registration:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete registration
app.delete('/api/registrations/:id', verifyToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('registrations')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Registration deleted successfully' });
    } catch (error) {
        console.error('Error deleting registration:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// DONATIONS ROUTES (NEW)
// ============================================

// Get all donations
app.get('/api/donations', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('donations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Error fetching donations:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create donation
app.post('/api/donations', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('donations')
            .insert([req.body])
            .select();

        if (error) {
            console.error('SUPABASE INSERT ERROR:', error);
            return res.status(400).json({
                message: error.message,
                details: error.details,
                hint: error.hint,
            });
        }
        
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating donation:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update donation
app.put('/api/donations/:id', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('donations')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error updating donation:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete donation
app.delete('/api/donations/:id', verifyToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('donations')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Donation deleted successfully' });
    } catch (error) {
        console.error('Error deleting donation:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Serve Frontend
// ============================================

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Error loading page');
        }
    });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, '0.0.0.0', () => {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   Church Admin System                    ║');
    console.log('║   with Supabase Database                 ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log('');
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Access at: http://localhost:${PORT}`);
    console.log(`✓ Database: Supabase`);
    console.log(`✓ API available at: http://localhost:${PORT}/api`);
    console.log(`✓ Health check: http://localhost:${PORT}/health`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('');
});
