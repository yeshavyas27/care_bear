"""
Chat API Routes
Handles Care Bear chat interactions and history
"""

from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId
import random

from models import (
    ChatRequest, ChatResponse, ChatMessage, 
    ChatMessageResponse, ChatHistoryResponse,
    SuccessResponse
)
from database import Collections

router = APIRouter()

def serialize_message(msg_doc) -> dict:
    """Convert MongoDB document to serializable dict"""
    if msg_doc:
        msg_doc["_id"] = str(msg_doc["_id"])
        msg_doc["message_id"] = msg_doc.pop("_id")
        return msg_doc
    return None

def generate_bear_response(user_message: str, user_data: dict = None) -> str:
    """
    Generate Care Bear response (dummy implementation)
    In production, this would integrate with an AI model and access user data
    """
    
    # Dummy responses - in production, use AI with user context
    responses = [
        "I'm here for you! How are you feeling today?",
        "That's important information. Have you taken your medications today?",
        "I understand. Would you like me to help you track this?",
        "Thank you for sharing. Let me check your health records.",
        "Based on your history, I recommend consulting with your doctor about this.",
        "I've noted that down. Is there anything else bothering you?",
        "That's great to hear! Keep up the good work with your health routine.",
        "I'm concerned about that. How long have you been experiencing this?",
    ]
    
    # Add context-aware responses based on keywords
    message_lower = user_message.lower()
    
    if any(word in message_lower for word in ["pain", "hurt", "sore", "ache"]):
        return "I'm sorry to hear you're in pain. On a scale of 1-10, how would you rate it? Have you taken any pain medication?"
    elif any(word in message_lower for word in ["better", "good", "great", "fine"]):
        return "That's wonderful to hear! I'm so glad you're feeling better. Keep taking care of yourself!"
    elif any(word in message_lower for word in ["medication", "medicine", "pill"]):
        return "Let me check your medication schedule. Have you taken all your prescribed medications today?"
    elif any(word in message_lower for word in ["tired", "fatigue", "exhausted", "sleep"]):
        return "Fatigue can be concerning. How many hours of sleep did you get last night? Would you like me to track your sleep patterns?"
    elif any(word in message_lower for word in ["doctor", "appointment", "visit"]):
        return "I can help you prepare for your doctor's appointment. Would you like me to generate a health report with your recent symptoms and medication history?"
    elif any(word in message_lower for word in ["yes", "yeah", "yep"]):
        return "Great! Is there anything specific you'd like to talk about regarding your health?"
    elif any(word in message_lower for word in ["no", "nope", "not really"]):
        return "Okay, no problem! Remember, I'm here whenever you need to talk about your health. How are you feeling overall today?"
    
    return random.choice(responses)

@router.post("/send", response_model=ChatResponse)
async def send_message(chat_request: ChatRequest):
    """
    Send a message to Care Bear and get a response
    """
    try:
        # Verify user exists
        user = await Collections.users().find_one({"user_id": chat_request.user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        timestamp = datetime.utcnow()
        
        # Save user message
        user_msg_doc = {
            "user_id": chat_request.user_id,
            "sender": "user",
            "message": chat_request.message,
            "timestamp": timestamp
        }
        user_msg_result = await Collections.chat_history().insert_one(user_msg_doc)
        user_msg_id = str(user_msg_result.inserted_id)
        
        # Generate Care Bear response (with access to user data)
        bear_response_text = generate_bear_response(chat_request.message, user)
        
        # Save Care Bear response
        bear_msg_doc = {
            "user_id": chat_request.user_id,
            "sender": "bear",
            "message": bear_response_text,
            "timestamp": timestamp
        }
        bear_msg_result = await Collections.chat_history().insert_one(bear_msg_doc)
        bear_msg_id = str(bear_msg_result.inserted_id)
        
        return ChatResponse(
            message_id=bear_msg_id,
            user_id=chat_request.user_id,
            user_message=chat_request.message,
            bear_response=bear_response_text,
            timestamp=timestamp
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )

@router.get("/history/{user_id}", response_model=ChatHistoryResponse)
async def get_chat_history(user_id: str, limit: int = 100, skip: int = 0):
    """
    Get chat history for a user
    """
    try:
        # Verify user exists
        user = await Collections.users().find_one({"user_id": user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Fetch messages
        cursor = Collections.chat_history().find(
            {"user_id": user_id}
        ).sort("timestamp", -1).skip(skip).limit(limit)
        
        messages = await cursor.to_list(length=limit)
        
        # Reverse to get chronological order
        messages.reverse()
        
        # Format messages
        formatted_messages = []
        for msg in messages:
            formatted_messages.append(ChatMessageResponse(
                message_id=str(msg["_id"]),
                user_id=msg["user_id"],
                sender=msg["sender"],
                message=msg["message"],
                timestamp=msg["timestamp"]
            ))
        
        return ChatHistoryResponse(
            user_id=user_id,
            messages=formatted_messages,
            total_messages=len(formatted_messages)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching chat history: {str(e)}"
        )

@router.delete("/history/{user_id}", response_model=SuccessResponse)
async def clear_chat_history(user_id: str):
    """
    Clear all chat history for a user
    """
    try:
        # Verify user exists
        user = await Collections.users().find_one({"user_id": user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete all messages
        result = await Collections.chat_history().delete_many({"user_id": user_id})
        
        return SuccessResponse(
            message=f"Cleared {result.deleted_count} messages",
            data={"deleted_count": result.deleted_count}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing chat history: {str(e)}"
        )

@router.post("/initialize/{user_id}", response_model=ChatResponse)
async def initialize_chat(user_id: str):
    """
    Initialize chat with Care Bear's welcome message
    """
    try:
        # Verify user exists
        user = await Collections.users().find_one({"user_id": user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get user's first name
        first_name = user.get("personal_info", {}).get("first_name", "there")
        
        # Create welcome message
        welcome_message = f"Hey {first_name}! Is your throat still sore?"
        
        timestamp = datetime.utcnow()
        
        # Save welcome message
        bear_msg_doc = {
            "user_id": user_id,
            "sender": "bear",
            "message": welcome_message,
            "timestamp": timestamp
        }
        result = await Collections.chat_history().insert_one(bear_msg_doc)
        
        return ChatResponse(
            message_id=str(result.inserted_id),
            user_id=user_id,
            user_message="",
            bear_response=welcome_message,
            timestamp=timestamp
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error initializing chat: {str(e)}"
        )
