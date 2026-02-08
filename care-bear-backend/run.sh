#!/bin/bash

# Care Bear Backend Startup Script

echo "🐻 Starting Care Bear Backend..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env with your MongoDB connection string"
fi

# Start the server
echo ""
echo "🚀 Starting FastAPI server..."
echo "📖 API Documentation: http://localhost:8000/docs"
echo "📊 Alternative Docs: http://localhost:8000/redoc"
echo ""

python main.py
