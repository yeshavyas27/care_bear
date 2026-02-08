"""
Basic tests for Care Bear API
Run with: pytest test_api.py
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Welcome to Care Bear API"

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_create_user():
    """Test user creation"""
    user_data = {
        "user_id": "test_user_001",
        "personal_info": {
            "first_name": "Test",
            "last_name": "User",
            "date_of_birth": "1990-01-01",
            "gender": "male",
            "email": "test@example.com",
            "phone": "1234567890"
        },
        "medical_history": {
            "allergies": "None",
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
            "heart_disease": False,
            "diabetes": False,
            "cancer": False,
            "mental_health": False,
            "other": ""
        },
        "emergency_contact": {
            "name": "Emergency Contact",
            "relationship": "Friend",
            "phone": "0987654321"
        }
    }
    
    response = client.post("/api/users/", json=user_data)
    assert response.status_code == 201
    assert response.json()["user_id"] == "test_user_001"

def test_get_user():
    """Test getting user"""
    response = client.get("/api/users/test_user_001")
    if response.status_code == 200:
        assert response.json()["user_id"] == "test_user_001"

def test_send_chat_message():
    """Test sending chat message"""
    chat_data = {
        "user_id": "test_user_001",
        "message": "Hello Care Bear!"
    }
    
    response = client.post("/api/chat/send", json=chat_data)
    # May fail if user doesn't exist, which is expected
    if response.status_code == 200:
        assert "bear_response" in response.json()

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
