"""
Simple startup script for Care Bear Backend
Works on all platforms (Windows, Mac, Linux)
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    print("🐻 Care Bear Backend Startup")
    print("=" * 50)
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8 or higher is required")
        print(f"   Current version: {sys.version}")
        sys.exit(1)
    
    print(f"✅ Python version: {sys.version.split()[0]}")
    
    # Check if .env exists
    if not os.path.exists('.env'):
        print("\n⚙️  Creating .env file from template...")
        if os.path.exists('.env.example'):
            with open('.env.example', 'r') as src, open('.env', 'w') as dst:
                dst.write(src.read())
            print("✅ .env file created")
            print("⚠️  Using default MongoDB: mongodb://localhost:27017")
            print("   Update .env if you need to change MongoDB connection")
        else:
            # Create basic .env
            with open('.env', 'w') as f:
                f.write("MONGODB_URL=mongodb://localhost:27017\n")
                f.write("DATABASE_NAME=care_bear_db\n")
            print("✅ Basic .env file created")
    
    # Install requirements
    print("\n📚 Installing/Updating dependencies...")
    print("   This may take a minute on first run...")
    
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-q", "--upgrade", "pip"
        ])
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-q", "-r", "requirements.txt"
        ])
        print("✅ Dependencies installed")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        print("   Try running manually: pip install -r requirements.txt")
        sys.exit(1)
    
    # Check MongoDB connection (optional)
    print("\n🔍 Checking MongoDB connection...")
    try:
        from pymongo import MongoClient
        from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
        
        # Try to connect (with short timeout)
        client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        print("✅ MongoDB is running and accessible")
        client.close()
    except (ConnectionFailure, ServerSelectionTimeoutError):
        print("⚠️  Warning: Cannot connect to MongoDB at localhost:27017")
        print("   The server will start but may not work without MongoDB")
        print("   Options:")
        print("   1. Install and start MongoDB locally")
        print("   2. Use MongoDB Atlas (cloud) - update .env file")
        print("   3. Use Docker: docker-compose up")
        print("\n   Continuing anyway...")
    except ImportError:
        print("⚠️  pymongo not installed yet, skipping MongoDB check")
    except Exception as e:
        print(f"⚠️  MongoDB check skipped: {e}")
    
    # Start the server
    print("\n" + "=" * 50)
    print("🚀 Starting FastAPI Server...")
    print("=" * 50)
    print("\n📖 API Documentation:")
    print("   Swagger UI: http://localhost:8000/docs")
    print("   ReDoc:      http://localhost:8000/redoc")
    print("\n💡 Press Ctrl+C to stop the server")
    print("=" * 50)
    print()
    
    try:
        # Start uvicorn
        subprocess.call([
            sys.executable, "-m", "uvicorn", 
            "main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000",
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except FileNotFoundError:
        print("\n❌ Error: uvicorn not found")
        print("   Installing uvicorn...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "uvicorn[standard]"])
        print("   Please run the script again")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
