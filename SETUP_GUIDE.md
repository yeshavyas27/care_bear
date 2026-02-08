# Care Bear - Complete Setup Guide

This guide will help you set up both the frontend and backend of the Care Bear application.

## 📦 What You Have

- `care-bear-backend.zip` - FastAPI backend with MongoDB
- `care-bear-app.zip` - React frontend application

## 🚀 Quick Start (Recommended)

### Step 1: Extract Both Folders

```bash
# Extract in the same parent directory
unzip care-bear-backend.zip
unzip care-bear-app.zip
```

You should have:
```
your-project-folder/
├── care-bear-backend/
└── care-bear-app/
```

### Step 2: Start the Backend

```bash
cd care-bear-backend
python start.py
```

**This will:**
- ✅ Check Python version
- ✅ Install dependencies automatically
- ✅ Create .env file
- ✅ Check MongoDB connection
- ✅ Start server on http://localhost:8000

**Verify it's running:**
- Open http://localhost:8000/docs in your browser
- You should see the API documentation

### Step 3: Start the Frontend (In a New Terminal)

```bash
cd care-bear-app
npm install
npm run dev
```

**This will:**
- ✅ Install React dependencies
- ✅ Start development server
- ✅ Open http://localhost:5173 (or :3000)

### Step 4: Test the Integration

1. **Open Frontend**: http://localhost:5173
2. **Complete Onboarding**: Fill in the health form
3. **Check Backend**: Go to http://localhost:8000/docs
4. **Verify User Created**: Click on `GET /api/users/` and "Try it out"
5. **Chat with Care Bear**: Send a message and see the response
6. **Add Medication**: Create a medication in the calendar

## 🗄️ MongoDB Setup

The backend requires MongoDB. Choose one option:

### Option A: Local MongoDB (Recommended for Development)

1. **Download**: https://www.mongodb.com/try/download/community
2. **Install** and start MongoDB service
3. **Default connection works** - no configuration needed!

### Option B: MongoDB Atlas (Cloud - Free)

1. Create account at https://cloud.mongodb.com
2. Create a free cluster (M0)
3. Get connection string
4. Update `care-bear-backend/.env`:
   ```
   MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
   ```

### Option C: Docker (If you have Docker)

```bash
cd care-bear-backend
docker-compose up
```

This starts both MongoDB and the backend!

## 📋 Detailed Setup Instructions

### Backend Setup

```bash
# Navigate to backend
cd care-bear-backend

# Option 1: Easy startup (recommended)
python start.py

# Option 2: Manual setup
pip install -r requirements.txt
python main.py

# Option 3: Docker
docker-compose up
```

**Backend will run on:** http://localhost:8000

**API Documentation:** http://localhost:8000/docs

### Frontend Setup

```bash
# Navigate to frontend
cd care-bear-app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production (optional)
npm run build
```

**Frontend will run on:** http://localhost:5173 or http://localhost:3000

## ✅ Verification Checklist

- [ ] Backend running at http://localhost:8000
- [ ] API docs accessible at http://localhost:8000/docs
- [ ] MongoDB connected (check backend console)
- [ ] Frontend running at http://localhost:5173
- [ ] Can complete onboarding form
- [ ] User created in backend (check API docs)
- [ ] Chat works and saves to database
- [ ] Can add medications
- [ ] Can generate health report

## 🔧 Configuration

### Backend Configuration

File: `care-bear-backend/.env`

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=care_bear_db
```

### Frontend Configuration

File: `care-bear-app/.env`

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🌐 Port Configuration

Default ports:
- **Backend**: 8000
- **Frontend**: 5173 (Vite) or 3000 (alternative)
- **MongoDB**: 27017

To change backend port:
```bash
uvicorn main:app --port 8001
```

To change frontend port:
```bash
npm run dev -- --port 3001
```

## 🐛 Troubleshooting

### Backend Issues

**"Permission denied" on run.sh**
```bash
python start.py  # Use this instead
```

**"MongoDB connection failed"**
- Check if MongoDB is running: `mongod --version`
- Or use MongoDB Atlas (cloud)
- Or use Docker: `docker-compose up`

**"Port 8000 already in use"**
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn main:app --port 8001
```

**"Module not found"**
```bash
pip install -r requirements.txt
```

### Frontend Issues

**"Cannot connect to backend"**
- Make sure backend is running at http://localhost:8000
- Check backend health: http://localhost:8000/health
- Verify `.env` file has correct API URL

**"Network Error"**
- Backend must be running BEFORE frontend
- Check CORS is enabled (it is by default)
- Clear browser cache

**"User not found"**
- Complete onboarding first
- Or clear localStorage and start over:
  ```javascript
  localStorage.clear();
  location.reload();
  ```

**Build/Install Issues**
```bash
# Clear npm cache
rm -rf node_modules package-lock.json
npm install
```

## 📊 Data Flow

```
User Action (Frontend)
    ↓
API Call (axios)
    ↓
FastAPI Backend
    ↓
MongoDB Database
    ↓
Response to Frontend
    ↓
Update UI
```

## 🎯 Features Integrated

### ✅ Working Features

- [x] User registration and onboarding
- [x] User profile management
- [x] Chat with Care Bear (AI responses)
- [x] Chat history persistence
- [x] Medication CRUD operations
- [x] Medication tracking
- [x] Calendar view
- [x] Health report generation
- [x] MongoDB data persistence

### 🔄 Fallback Features

- All features have localStorage fallback if backend is down
- Graceful error handling
- User-friendly error messages

## 📚 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/users/` | POST | Create user |
| `/api/users/{id}` | GET | Get user |
| `/api/users/{id}` | PUT | Update user |
| `/api/chat/send` | POST | Send message |
| `/api/chat/history/{id}` | GET | Get chat history |
| `/api/calendar/medications` | POST | Create medication |
| `/api/calendar/medications/{id}` | GET | Get medications |
| `/api/calendar/medications/track` | POST | Track medication |
| `/api/health/report` | POST | Generate report |

Full API documentation: http://localhost:8000/docs

## 🧪 Testing

### Test Backend

```bash
# In backend directory
pytest test_api.py
```

### Test Integration

1. Open http://localhost:8000/docs
2. Try the `/api/users/` POST endpoint
3. Create a test user
4. Open frontend and see if user appears

### Test Frontend-Backend Connection

```javascript
// Open browser console on frontend
localStorage.getItem('careBearUserId')
// Should show your user ID after onboarding
```

## 🚢 Production Deployment

### Backend

```bash
# Build Docker image
docker build -t care-bear-backend .

# Run container
docker run -p 8000:8000 care-bear-backend
```

### Frontend

```bash
# Build for production
npm run build

# Serve the dist folder
# Upload to Vercel, Netlify, or any static host
```

## 📖 Next Steps

1. **Customize Care Bear responses** in `care-bear-backend/routes/chat.py`
2. **Add real AI** by integrating OpenAI or Anthropic API
3. **Add authentication** using JWT
4. **Deploy to cloud** (Vercel + Railway/Render)
5. **Add more features** (mood tracking, health conditions)

## 💡 Pro Tips

- Keep both terminal windows open (backend + frontend)
- Use browser DevTools → Network tab to debug API calls
- Check backend logs for detailed error messages
- MongoDB Compass is great for viewing database contents
- Use Postman/Insomnia to test API endpoints directly

## 📞 Getting Help

If you're stuck:

1. Check backend logs in terminal
2. Check frontend console in browser DevTools
3. Verify MongoDB is running
4. Try the troubleshooting section above
5. Check API documentation at /docs

## 🎉 You're All Set!

Once both servers are running:
- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

Start by completing the onboarding and chatting with Care Bear! 🐻

---

**Happy Coding!** 🚀
