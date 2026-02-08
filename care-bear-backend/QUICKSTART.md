# Care Bear Backend - Quick Start Guide

## 🚀 Super Simple Setup (Works on All Platforms)

### Method 1: Python Script (Recommended - Easiest!)

```bash
# Navigate to backend folder
cd care-bear-backend

# Run the startup script
python start.py
```

That's it! The script will:
- Check Python version
- Install all dependencies automatically
- Create .env file if needed
- Check MongoDB connection
- Start the server

### Method 2: Manual Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Create environment file
cp .env.example .env
# (Edit .env if you need to change MongoDB settings)

# 3. Start server
python main.py
```

### Method 3: Docker (If you have Docker installed)

```bash
docker-compose up
```

## 📋 Requirements

- **Python 3.8+** (check with `python --version` or `python3 --version`)
- **MongoDB** running locally OR MongoDB Atlas cloud account

## 🗄️ MongoDB Setup

### Option A: Local MongoDB
1. Download from https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Default connection works automatically

### Option B: MongoDB Atlas (Cloud - Free)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update `.env` file:
```
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
```

### Option C: Docker MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

## 🌐 Access the API

Once started, visit:
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## ✅ Verify It's Working

Open http://localhost:8000/docs in your browser and you should see the interactive API documentation!

## 🐛 Troubleshooting

### "Permission Denied" Error
```bash
# On Linux/Mac, try:
python3 start.py

# Or use:
python main.py
```

### "MongoDB Connection Error"
- Make sure MongoDB is running: `mongod --version`
- Or use MongoDB Atlas cloud option
- Or use Docker: `docker-compose up`

### "Module Not Found" Error
```bash
pip install -r requirements.txt
```

### "Port 8000 Already in Use"
```bash
# Stop other processes on port 8000, or change port:
uvicorn main:app --port 8001
```

## 📚 Next Steps

1. **Test the API**: Visit http://localhost:8000/docs
2. **Create a test user**: Use the Swagger UI to try POST /api/users/
3. **Check integration guide**: Read `INTEGRATION_GUIDE.md`
4. **Connect frontend**: Update frontend API URLs to http://localhost:8000/api

## 🎯 Key Features

- ✅ User management with health profiles
- ✅ AI chatbot integration (Care Bear)
- ✅ Medication tracking and calendar
- ✅ Mood and health condition tracking
- ✅ Health report generation
- ✅ Full CRUD operations for all entities
- ✅ Interactive API documentation
- ✅ MongoDB database with automatic indexing

## 📞 Support

If you run into issues:
1. Check the error message in terminal
2. Visit http://localhost:8000/docs to test endpoints
3. Check MongoDB is running: `mongod --version`
4. Make sure port 8000 is available

---

**Happy Coding! 🐻**
