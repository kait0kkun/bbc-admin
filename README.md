# 🏛️ Church Admin System

A complete church administration and management system with Docker support.

## ✨ Features

- **Member Management** - Add, edit, and manage church members
- **Event Management** - Create and organize church events
- **Event Registration** - Track member registrations for events
- **Beautiful UI** - Modern, responsive interface
- **Docker Ready** - Easy deployment with Docker
- **Data Persistence** - JSON file-based storage
- **RESTful API** - Full REST API for all operations

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed

### Installation

1. **Navigate to the project folder:**
   ```bash
   cd church-admin-complete
   ```

2. **Start with Docker:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Open your browser to: http://localhost:3000

That's it! 🎉

## 📋 Manual Installation (Without Docker)

### Prerequisites
- Node.js 18+ installed

### Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Access the application:**
   - Open your browser to: http://localhost:3000

## 🎯 Usage

### Members
1. Click on the "Members" tab
2. Click "+ Add Member"
3. Fill in member details
4. Click "Save Member"

### Events
1. Click on the "Events" tab
2. Click "+ Create Event"
3. Fill in event details
4. Click "Save Event"

### Registrations
1. Click on the "Registrations" tab
2. Click "+ Register for Event"
3. Select an event and member
4. Click "Register"

## 🐳 Docker Commands

### Start the application:
```bash
docker-compose up -d
```

### Stop the application:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f
```

### Rebuild after changes:
```bash
docker-compose up -d --build
```

### Clean everything:
```bash
docker-compose down -v
docker system prune -f
```

## 📁 Project Structure

```
church-admin-complete/
├── server.js              # Backend server
├── package.json           # Dependencies
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose configuration
├── .dockerignore         # Docker ignore rules
├── .env.example          # Environment variables template
├── public/               # Frontend files
│   ├── index.html       # Main HTML file
│   └── app.js           # Frontend JavaScript
└── data/                # Data storage (auto-created)
    ├── members.json
    ├── events.json
    └── registrations.json
```

## 🔧 API Endpoints

### Members
- `GET /api/members` - Get all members
- `GET /api/members/:id` - Get single member
- `POST /api/members` - Create member
- `PUT /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Registrations
- `GET /api/registrations` - Get all registrations
- `POST /api/registrations` - Create registration
- `DELETE /api/registrations/:id` - Delete registration

### Health Check
- `GET /health` - Server health check

## 💾 Data Persistence

Data is stored in supabase:
- `members` - Member information
- `events` - Event information
- `registrations` - Event registrations
- `donations` - Event donations


## 🔒 Security Notes

This is a basic system intended for internal church use. For production deployment:

1. Add authentication and authorization
2. Use a proper database (PostgreSQL, MongoDB)
3. Add input validation and sanitization
4. Implement HTTPS
5. Add rate limiting
6. Implement backup strategies

## 🛠️ Customization

### Change Port
Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use port 3001 instead
```

### Add Environment Variables
1. Copy `.env.example` to `.env`
2. Edit values as needed
3. Update `docker-compose.yml` to use the env file

## 📝 Development

### Run in development mode:
```bash
npm run dev
```

This uses nodemon for auto-restart on file changes.

## 🐛 Troubleshooting

### Port already in use
```bash
# Change port in docker-compose.yml or kill the process:
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### Container won't start
```bash
# Check logs:
docker-compose logs -f

# Rebuild:
docker-compose up -d --build
```

### Data not persisting
Make sure the `data` directory has proper permissions and is mounted in docker-compose.yml

## 📦 Backup

### Backup your data:
```bash
# Copy the data directory
cp -r data data-backup-$(date +%Y%m%d)
```

### Restore from backup:
```bash
cp -r data-backup-YYYYMMDD data
```

## 🤝 Contributing

Feel free to customize this system for your church's specific needs!

## 📄 License

MIT License - Feel free to use and modify as needed.

## 🙏 Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ for church communities**
