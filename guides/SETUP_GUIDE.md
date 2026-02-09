# 🎉 COMPLETE CHURCH ADMIN SYSTEM - INSTALLATION GUIDE FOR WINDOWS

## 📦 What You Got

A **complete, working** Church Admin System with:
- ✅ Full backend API (Node.js/Express)
- ✅ Beautiful frontend interface
- ✅ Member management
- ✅ Event management  
- ✅ Event registration tracking
- ✅ Docker ready
- ✅ Data persistence

## 🚀 INSTALLATION - Choose Your Method

---

### ⚡ METHOD 1: DOCKER (RECOMMENDED - 2 MINUTES)

#### Step 1: Copy Files to Your Project

1. **Download** the `church-admin-complete` folder
2. **Copy ALL files** to your existing folder:
   ```
   C:\Users\Erika Baldove\Documents\Vibe Codes\Admin
   ```
3. **Replace** any existing files when prompted

#### Step 2: Start with Docker

Open PowerShell in your project folder and run:

```powershell
# Navigate to project
cd "C:\Users\Erika Baldove\Documents\Vibe Codes\Admin"

# Start the application
docker-compose up -d

# Check if it's running
docker ps
```

#### Step 3: Access the Application

Open your browser to: **http://localhost:3000**

**That's it!** 🎉

---

### 💻 METHOD 2: WITHOUT DOCKER (3 MINUTES)

#### Step 1: Copy Files

Same as Method 1 - copy all files to your project folder.

#### Step 2: Install Dependencies

```powershell
cd "C:\Users\Erika Baldove\Documents\Vibe Codes\Admin"

# Install Node.js packages
npm install
```

#### Step 3: Start the Server

```powershell
# Start the application
npm start
```

You should see:
```
╔══════════════════════════════════════════╗
║   Church Admin System                    ║
╚══════════════════════════════════════════╝

✓ Server running on port 3000
✓ Access at: http://localhost:3000
```

#### Step 4: Access the Application

Open your browser to: **http://localhost:3000**

---

## 📋 FILE STRUCTURE AFTER INSTALLATION

Your folder should look like this:

```
C:\Users\Erika Baldove\Documents\Vibe Codes\Admin\
├── server.js              ← Backend server
├── package.json           ← Dependencies
├── Dockerfile            ← Docker config
├── docker-compose.yml    ← Docker Compose
├── .dockerignore
├── .env.example
├── README.md
├── public/
│   ├── index.html        ← Main page
│   └── app.js            ← Frontend code
└── data/                 ← Created automatically
    ├── members.json
    ├── events.json
    └── registrations.json
```

---

## ✅ VERIFY INSTALLATION

### 1. Check Files Exist

```powershell
# Run this in your project folder
Test-Path "package.json"
Test-Path "server.js"
Test-Path "public/index.html"
```

All should return `True`

### 2. Check Docker is Running

If using Docker:
```powershell
docker ps
```

You should see a container named `church-admin`

### 3. Access the Website

Open http://localhost:3000 in your browser.

You should see a beautiful purple interface with:
- 🏛️ Church Admin System header
- Three stat cards (Members, Events, Registrations)
- Tabs for Members, Events, and Registrations

---

## 🎯 USING THE SYSTEM

### Add Your First Member

1. Click the **"Members"** tab
2. Click **"+ Add Member"**
3. Fill in the form:
   - Name: John Doe
   - Email: john@example.com
   - Phone: 123-456-7890
   - Gender: Male
   - Ministry: Worship Team
4. Click **"Save Member"**
5. See the member appear in the table!

### Create Your First Event

1. Click the **"Events"** tab
2. Click **"+ Create Event"**
3. Fill in the form:
   - Event Name: Sunday Service
   - Description: Weekly worship service
   - Date: (select a date)
   - Time: 10:00 AM
   - Location: Main Sanctuary
4. Click **"Save Event"**

### Register Someone for an Event

1. Click the **"Registrations"** tab
2. Click **"+ Register for Event"**
3. Select an event and member
4. Click **"Register"**

---

## 🐳 DOCKER COMMANDS

### Common Commands:

```powershell
# Start the application
docker-compose up -d

# Stop the application
docker-compose down

# View logs (see what's happening)
docker-compose logs -f

# Restart the application
docker-compose restart

# Rebuild after making changes
docker-compose up -d --build

# Check if container is running
docker ps

# Access container shell (advanced)
docker exec -it church-admin sh
```

---

## 💾 YOUR DATA

All your data is stored in the `data` folder:
- `data/members.json` - All members
- `data/events.json` - All events
- `data/registrations.json` - All registrations

### Backup Your Data

```powershell
# Create backup
Copy-Item -Path "data" -Destination "data-backup-$(Get-Date -Format 'yyyyMMdd')" -Recurse
```

### Restore Data

```powershell
# Restore from backup
Copy-Item -Path "data-backup-20240206\*" -Destination "data\" -Force
```

---

## 🛠️ TROUBLESHOOTING

### Issue: Port 3000 already in use

**Solution:**
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill that process
taskkill /PID <process_id> /F

# Or change port in docker-compose.yml:
# Change "3000:3000" to "3001:3000"
```

### Issue: Docker build fails

**Solution:**
```powershell
# Clean everything
docker-compose down
docker system prune -f

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Can't access http://localhost:3000

**Solutions:**
1. Check if server is running: `docker ps`
2. Check logs: `docker-compose logs -f`
3. Try http://127.0.0.1:3000
4. Restart: `docker-compose restart`

### Issue: Changes not showing

**Solution:**
```powershell
# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Issue: Data disappeared

**Check if data folder exists:**
```powershell
Test-Path "data"
```

If `False`, create it:
```powershell
mkdir data
docker-compose restart
```

---

## 🎨 CUSTOMIZATION

### Change Church Name

Edit `server.js` and add:
```javascript
const CHURCH_NAME = "Your Church Name";
```

### Change Colors

Edit `public/index.html` and look for the `<style>` section. Change:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```
To your preferred colors!

### Add More Fields

Edit the forms in `public/index.html` to add more fields like:
- Address
- Birthday
- Join Date
- etc.

---

## 📱 MOBILE ACCESS

The system works on mobile devices!

### Access from Phone/Tablet:

1. Find your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. On your phone/tablet, open browser to:
   ```
   http://192.168.1.100:3000
   ```

---

## 🔒 SECURITY NOTES

**This is for internal church use.** For public deployment:

1. Add authentication (login/password)
2. Use HTTPS (SSL certificates)
3. Use a real database (PostgreSQL)
4. Add input validation
5. Implement backups

---

## 📞 NEED HELP?

### Quick Diagnostics

Run this to see status:
```powershell
# Check if files are correct
Get-ChildItem | Format-Table Name

# Check if Docker is running
docker ps

# Check logs
docker-compose logs --tail 50

# Check if port is available
Test-NetConnection -ComputerName localhost -Port 3000
```

Send me the output if you need help!

---

## 🎉 NEXT STEPS

Now that it's working:

1. ✅ Add your first members
2. ✅ Create your first events
3. ✅ Test registrations
4. ✅ Customize colors/branding
5. ✅ Set up regular backups
6. ✅ Train your team

---

## 📚 ADDITIONAL RESOURCES

- **View API Docs**: http://localhost:3000/api/members
- **Check Health**: http://localhost:3000/health
- **Read README**: Open README.md in your project folder

---

**🙏 May this system bless your church ministry!**

Questions? Issues? Just ask!
