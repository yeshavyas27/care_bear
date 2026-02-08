# Care Bear Backend API

FastAPI backend for the Care Bear AI-powered health caretaker application with MongoDB database integration.

## Features

### 🎯 Core APIs

1. **User Management**
   - Create, read, update, delete user profiles
   - Store comprehensive health information
   - Personal info, medical history, family history, emergency contacts

2. **Chat System**
   - AI-powered Care Bear chatbot interactions
   - Chat history tracking
   - Context-aware responses (dummy implementation ready for AI integration)
   - Access to user-specific personal details

3. **Calendar & Medication Management**
   - Create and manage medication schedules
   - Track medication compliance
   - Mood tracking with energy levels and sleep hours
   - Monthly calendar view with all health data

4. **Health Records**
   - Track health conditions with severity levels
   - Generate comprehensive health reports
   - Health summaries for dashboard
   - Export data for doctor visits

## Tech Stack

- **FastAPI**: Modern, fast web framework
- **MongoDB**: NoSQL database via Motor (async driver)
- **Pydantic**: Data validation
- **Uvicorn**: ASGI server
- **Python 3.8+**: Programming language

## Project Structure

```
care-bear-backend/
├── main.py                 # FastAPI application entry point
├── database.py            # MongoDB connection and configuration
├── models.py              # Pydantic models for validation
├── routes/
│   ├── users.py          # User management endpoints
│   ├── chat.py           # Chat and messaging endpoints
│   ├── calendar.py       # Medication and mood tracking
│   └── health.py         # Health conditions and reports
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
└── README.md             # This file
```

## Installation

### Prerequisites

- Python 3.8 or higher
- MongoDB (local or Atlas cloud)
- pip package manager

### Setup

1. **Clone or navigate to the backend directory:**
```bash
cd care-bear-backend
```

2. **Create virtual environment:**
```bash
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your MongoDB connection string
```

5. **Run the server:**
```bash
python main.py
# Or use uvicorn directly:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## MongoDB Setup

### Local MongoDB
```bash
# Install MongoDB Community Edition
# Start MongoDB service
mongod --dbpath /path/to/data
```

### MongoDB Atlas (Cloud)
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `.env` file with connection string

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Users API (`/api/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/` | Create new user |
| GET | `/api/users/{user_id}` | Get user by ID |
| PUT | `/api/users/{user_id}` | Update user |
| DELETE | `/api/users/{user_id}` | Delete user and all data |
| GET | `/api/users/` | List all users |

### Chat API (`/api/chat`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/send` | Send message to Care Bear |
| GET | `/api/chat/history/{user_id}` | Get chat history |
| DELETE | `/api/chat/history/{user_id}` | Clear chat history |
| POST | `/api/chat/initialize/{user_id}` | Initialize chat with welcome message |

### Calendar API (`/api/calendar`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calendar/medications` | Create medication |
| GET | `/api/calendar/medications/{user_id}` | Get user medications |
| PUT | `/api/calendar/medications/{medication_id}` | Update medication |
| DELETE | `/api/calendar/medications/{medication_id}` | Delete medication |
| POST | `/api/calendar/medications/track` | Track medication taken |
| GET | `/api/calendar/medications/track/{user_id}` | Get medication tracking |
| POST | `/api/calendar/mood` | Create mood entry |
| GET | `/api/calendar/mood/{user_id}` | Get mood entries |
| GET | `/api/calendar/view/{user_id}` | Get calendar view (month) |

### Health API (`/api/health`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/health/conditions` | Create health condition |
| GET | `/api/health/conditions/{user_id}` | Get health conditions |
| PUT | `/api/health/conditions/{condition_id}` | Update condition |
| DELETE | `/api/health/conditions/{condition_id}` | Delete condition |
| POST | `/api/health/report` | Generate health report |
| GET | `/api/health/summary/{user_id}` | Get health summary |

## Example Usage

### Create User
```bash
curl -X POST "http://localhost:8000/api/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "personal_info": {
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1990-01-01",
      "gender": "male",
      "email": "john@example.com",
      "phone": "1234567890"
    },
    "medical_history": {
      "allergies": "Penicillin",
      "chronic_conditions": "",
      "past_surgeries": "",
      "current_medications": ""
    },
    "health_status": {
      "current_conditions": "",
      "symptoms": "",
      "is_pregnant": "n/a",
      "due_date": ""
    },
    "family_history": {
      "heart_disease": false,
      "diabetes": false,
      "cancer": false,
      "mental_health": false,
      "other": ""
    },
    "emergency_contact": {
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone": "0987654321"
    }
  }'
```

### Send Chat Message
```bash
curl -X POST "http://localhost:8000/api/chat/send" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "message": "I have a headache"
  }'
```

### Create Medication
```bash
curl -X POST "http://localhost:8000/api/calendar/medications" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "name": "Aspirin",
    "dosage": "100mg",
    "time": "08:00",
    "frequency": "Daily",
    "notes": "Take with food"
  }'
```

## Database Schema

### Collections

1. **users** - User profiles and personal information
2. **chat_history** - Chat messages between user and Care Bear
3. **medications** - Medication schedules
4. **medication_schedule** - Tracking of medications taken
5. **mood_tracking** - Daily mood and wellness entries
6. **health_conditions** - Health conditions and symptoms

### Indexes

Automatic indexes are created for:
- User lookups
- Chat history by user and timestamp
- Calendar queries by user and date
- Health conditions by user

## Integration with Frontend

### CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` (React default)
- `http://localhost:5173` (Vite default)

Update CORS settings in `main.py` if using different ports.

### API Base URL

Configure frontend to use:
```javascript
const API_BASE_URL = "http://localhost:8000/api";
```

## Care Bear Chatbot

The chatbot implementation in `routes/chat.py` includes:
- Dummy response generation (ready for AI integration)
- Access to user personal details from database
- Context-aware responses based on keywords
- Chat history storage

### Integrating with AI

Replace the `generate_bear_response()` function with:
- OpenAI API
- Anthropic Claude API
- Custom fine-tuned model
- Any other LLM service

The function receives:
- `user_message`: Current user message
- `user_data`: Complete user profile from database

## Development

### Running Tests
```bash
pytest
```

### Code Quality
```bash
# Format code
black .

# Lint
flake8 .

# Type checking
mypy .
```

## Production Deployment

### Using Docker
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production
- Set `ENVIRONMENT=production`
- Use secure MongoDB connection string
- Configure proper CORS origins
- Enable HTTPS

## Features Ready for AI Integration

1. **Chat System**: `generate_bear_response()` function ready for LLM
2. **User Context**: Full access to user health data for personalized responses
3. **History**: Complete chat history stored for context
4. **Symptoms Tracking**: Structured data for health analysis

## Security Notes

⚠️ **For Demo Purposes**: No authentication implemented
- Add JWT authentication for production
- Implement rate limiting
- Validate all inputs
- Use HTTPS in production
- Secure MongoDB connection

## Troubleshooting

### MongoDB Connection Issues
```python
# Check MongoDB is running
mongod --version

# Test connection
python -c "from pymongo import MongoClient; client = MongoClient('mongodb://localhost:27017'); print(client.server_info())"
```

### Import Errors
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## License

Created for demonstration purposes.

## Support

For issues or questions:
1. Check API documentation at `/docs`
2. Review logs in console
3. Verify MongoDB connection
4. Check environment variables

---

Built with ❤️ using FastAPI and MongoDB
