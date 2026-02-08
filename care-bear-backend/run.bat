@echo off
REM Care Bear Backend Startup Script for Windows

echo 🐻 Starting Care Bear Backend...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📚 Installing dependencies...
pip install -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo ⚙️  Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please update .env with your MongoDB connection string
)

REM Start the server
echo.
echo 🚀 Starting FastAPI server...
echo 📖 API Documentation: http://localhost:8000/docs
echo 📊 Alternative Docs: http://localhost:8000/redoc
echo.

python main.py
