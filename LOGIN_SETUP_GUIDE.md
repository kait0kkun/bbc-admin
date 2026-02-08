# Login Feature Setup Guide

## Overview
The login feature adds user authentication to the BBC Church Admin system using JWT tokens.

## Setup Steps

### 1. Install JWT Package
```bash
npm install jsonwebtoken
```

### 2. Create Users Table in Supabase
- Go to https://supabase.com and log into your project
- Open the SQL Editor
- Copy and paste the contents of `USERS_TABLE_SCHEMA.sql`
- Click "Run" to execute the SQL
- This creates:
  - `users` table with columns: id, email, password, name, role
  - Default admin user: `admin@church.com` / `admin123`

### 3. Update .env File (if needed)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
JWT_SECRET=change-this-to-a-secure-random-string
PORT=3000
```

### 4. Start the Server
```bash
node server.js
```

### 5. Access the Application
- Open http://localhost:3000
- You'll see the login page
- Default credentials:
  - Email: `admin@church.com`
  - Password: `admin123`

## Important Security Notes

⚠️ **CHANGE THE DEFAULT PASSWORD IMMEDIATELY!**

### Password Security (Current)
- Currently using plain text passwords (for demo)
- In production, implement bcrypt hashing:
```bash
npm install bcrypt
```

To add bcrypt:
1. Hash password on register/setup:
```javascript
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
```

2. Verify password on login:
```javascript
const passwordMatch = await bcrypt.compare(password, hashedPassword);
```

### JWT Security
- Default JWT_SECRET should be changed to a random, secure string
- JWT tokens expire after 7 days
- Store tokens in `localStorage` (current approach)
- Consider using `httpOnly` cookies for enhanced security

## Creating Additional Users

Currently, users can only be created via:
1. SQL INSERT directly into Supabase
2. Creating the first admin via `/api/auth/setup` endpoint

To allow admin user creation through the UI, you would need to:
1. Add a user management modal
2. Create POST `/api/auth/register` endpoint with `verifyToken` middleware
3. Only allow authenticated admins to create new users

## Session Management

- Users remain logged in for 7 days (JWT expiration)
- Logging out clears the token from localStorage
- Closing the browser will NOT log the user out
- To force logout, user must click "Sign Out" button

## Troubleshooting

### 401 Unauthorized Error
- Token may have expired (7 days)
- Click "Sign Out" and log back in

### Login fails with "Invalid email or password"
- Check email case sensitivity (currently case-sensitive)
- Verify credentials in users table

### "Access token required" on API calls
- Check browser console for auth token
- Try clearing localStorage and logging in again

## Next Steps (Optional Enhancements)

1. Add "Remember Me" functionality
2. Add password reset capability
3. Add user role-based access control
4. Add audit logging for user actions
5. Add passwordhashing with bcrypt
6. Add session timeout warnings
7. Add API rate limiting
