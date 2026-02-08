"""
Chat API Routes
Handles Care Bear chat interactions and history
"""

from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId

from models import (
    ChatRequest, ChatResponse, ChatMessage, 
    ChatMessageResponse, ChatHistoryResponse,
    SuccessResponse
)
from database import Collections
from dedalus_labs import AsyncDedalus
from dedalus_labs.lib.runner import DedalusRunner
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# In-memory session storage for conversation context (use Redis in production)
sessions: dict[str, list[dict]] = {}

# Initialize Dedalus client and runner
dedalus_client = AsyncDedalus()
dedalus_runner = DedalusRunner(dedalus_client)

def serialize_message(msg_doc) -> dict:
    """Convert MongoDB document to serializable dict"""
    if msg_doc:
        msg_doc["_id"] = str(msg_doc["_id"])
        msg_doc["message_id"] = msg_doc.pop("_id")
        return msg_doc
    return None

async def build_user_context_string(user_id: str, user_data: dict) -> str:
    """
    Build health-essential context string from user model and related collections.
    Only includes information relevant to health care and medical guidance.
    """
    context_parts = []
    
    # Basic user identification (name only for personalization)
    personal_info = user_data.get("personal_info", {})
    first_name = personal_info.get("first_name", "")
    age_context = ""
    if personal_info.get("date_of_birth"):
        age_context = f" (DOB: {personal_info.get('date_of_birth')})"
    
    if first_name:
        context_parts.append(f"Patient: {first_name}{age_context}")
        context_parts.append("")
    
    # Medical History - Critical for health context
    medical_history = user_data.get("medical_history", {})
    if medical_history and any(medical_history.values()):
        context_parts.append("=== MEDICAL HISTORY ===")
        
        if medical_history.get("allergies"):
            context_parts.append(f"⚠️ ALLERGIES: {medical_history.get('allergies')}")
        
        if medical_history.get("chronic_conditions"):
            context_parts.append(f"Chronic Conditions: {medical_history.get('chronic_conditions')}")
        
        if medical_history.get("past_surgeries"):
            context_parts.append(f"Past Surgeries: {medical_history.get('past_surgeries')}")
        
        if medical_history.get("current_medications"):
            context_parts.append(f"Current Medications (from history): {medical_history.get('current_medications')}")
        
        context_parts.append("")
    
    # Current Health Status - Very important for context
    health_status = user_data.get("health_status", {})
    if health_status and any(health_status.values()):
        context_parts.append("=== CURRENT HEALTH STATUS ===")
        
        if health_status.get("current_conditions"):
            context_parts.append(f"Current Conditions: {health_status.get('current_conditions')}")
        
        if health_status.get("symptoms"):
            context_parts.append(f"Current Symptoms: {health_status.get('symptoms')}")
        
        if health_status.get("is_pregnant") and health_status.get("is_pregnant").lower() in ["yes", "true"]:
            pregnancy_info = "⚠️ PREGNANT"
            if health_status.get("due_date"):
                pregnancy_info += f" (Due: {health_status.get('due_date')})"
            context_parts.append(pregnancy_info)
        
        context_parts.append("")
    
    # Family History - Important for risk assessment
    family_history = user_data.get("family_history", {})
    if family_history:
        family_conditions = []
        if family_history.get("heart_disease"):
            family_conditions.append("Heart Disease")
        if family_history.get("diabetes"):
            family_conditions.append("Diabetes")
        if family_history.get("cancer"):
            family_conditions.append("Cancer")
        if family_history.get("mental_health"):
            family_conditions.append("Mental Health Issues")
        if family_history.get("other"):
            family_conditions.append(f"Other: {family_history.get('other')}")
        
        if family_conditions:
            context_parts.append("=== FAMILY HEALTH HISTORY ===")
            context_parts.append("Family history of: " + ", ".join(family_conditions))
            context_parts.append("")
    
    # Active Medications from medication collection
    try:
        medications_cursor = Collections.medications().find(
            {"user_id": user_id, "is_active": True}
        )
        medications = await medications_cursor.to_list(length=100)
        
        if medications:
            context_parts.append("=== CURRENT MEDICATIONS ===")
            for med in medications:
                med_name = med.get("name", "Unknown medication")
                dosage = med.get("dosage", "")
                frequency = med.get("frequency", "")
                time = med.get("time", "")
                notes = med.get("notes", "")
                
                med_line = f"• {med_name}"
                if dosage:
                    med_line += f" - {dosage}"
                if frequency:
                    med_line += f", {frequency}"
                if time:
                    med_line += f" at {time}"
                context_parts.append(med_line)
                
                if notes:
                    context_parts.append(f"  Notes: {notes}")
            context_parts.append("")
    except Exception as e:
        print(f"Error fetching medications: {e}")
    
    # Recent Medication Adherence (last 7 days) - Critical for tracking
    try:
        seven_days_ago = datetime.now() - timedelta(days=7)
        
        tracking_cursor = Collections.medication_schedule().find(
            {
                "user_id": user_id,
                "date": {"$gte": seven_days_ago.date()}
            }
        ).sort("date", -1).limit(50)
        tracking_entries = await tracking_cursor.to_list(length=50)
        
        if tracking_entries:
            taken_count = sum(1 for entry in tracking_entries if entry.get("taken", False))
            total_count = len(tracking_entries)
            adherence_rate = (taken_count / total_count * 100) if total_count > 0 else 0
            
            context_parts.append("=== MEDICATION ADHERENCE (LAST 7 DAYS) ===")
            context_parts.append(f"Adherence Rate: {adherence_rate:.1f}% ({taken_count}/{total_count} doses taken)")
            
            # Show recently missed medications
            missed = [entry for entry in tracking_entries if not entry.get("taken", False)]
            if missed:
                context_parts.append(f"\nRecently Missed ({len(missed)} doses):")
                for entry in missed[:5]:  # Show up to 5 most recent
                    med_name = entry.get("medication_id", "Unknown")
                    date = entry.get("date", "Unknown date")
                    context_parts.append(f"  • {med_name} on {date}")
            context_parts.append("")
    except Exception as e:
        print(f"Error fetching medication tracking: {e}")
    
    # Active Health Conditions from health_conditions collection
    try:
        conditions_cursor = Collections.health_conditions().find(
            {"user_id": user_id, "is_active": True}
        )
        conditions = await conditions_cursor.to_list(length=100)
        
        if conditions:
            context_parts.append("=== TRACKED HEALTH CONDITIONS ===")
            for condition in conditions:
                condition_name = condition.get("condition_name", "Unknown condition")
                severity = condition.get("severity", "")
                symptoms = condition.get("symptoms", [])
                recorded_date = condition.get("recorded_date", "")
                notes = condition.get("notes", "")
                
                severity_icon = ""
                if severity == "severe":
                    severity_icon = "🔴"
                elif severity == "moderate":
                    severity_icon = "🟡"
                elif severity == "mild":
                    severity_icon = "🟢"
                
                context_parts.append(f"{severity_icon} {condition_name}")
                if severity:
                    context_parts.append(f"  Severity: {severity.title()}")
                if recorded_date:
                    context_parts.append(f"  Recorded: {recorded_date}")
                if symptoms:
                    context_parts.append(f"  Symptoms: {', '.join(symptoms)}")
                if notes:
                    context_parts.append(f"  Notes: {notes}")
                context_parts.append("")
    except Exception as e:
        print(f"Error fetching health conditions: {e}")
    
    # Recent Mood & Symptom Tracking (last 7 entries)
    try:
        mood_cursor = Collections.mood_tracking().find(
            {"user_id": user_id}
        ).sort("date", -1).limit(7)
        mood_entries = await mood_cursor.to_list(length=7)
        
        if mood_entries:
            context_parts.append("=== RECENT MOOD & SYMPTOMS ===")
            for entry in mood_entries:
                date = entry.get("date", "Unknown date")
                mood = entry.get("mood", "")
                energy_level = entry.get("energy_level", "")
                sleep_hours = entry.get("sleep_hours", "")
                symptoms = entry.get("symptoms", [])
                notes = entry.get("notes", "")
                
                # Mood emoji
                mood_emoji = {
                    "excellent": "😊",
                    "good": "🙂",
                    "okay": "😐",
                    "bad": "☹️",
                    "terrible": "😢"
                }.get(mood.lower(), "")
                
                entry_line = f"{date}: {mood_emoji} {mood.title()}"
                if energy_level:
                    entry_line += f" | Energy: {energy_level}/10"
                if sleep_hours:
                    entry_line += f" | Sleep: {sleep_hours}h"
                
                context_parts.append(entry_line)
                
                if symptoms:
                    context_parts.append(f"  Symptoms: {', '.join(symptoms)}")
                if notes:
                    context_parts.append(f"  Notes: {notes}")
            context_parts.append("")
    except Exception as e:
        print(f"Error fetching mood tracking: {e}")

    
    return "\n".join(context_parts)

def build_system_prompt(user_data: dict, user_context: str = "") -> str:
    """
    Build a context-aware system prompt for Care Bear based on user data
    """
    first_name = user_data.get("personal_info", {}).get("first_name", "there")
    
    system_prompt = f"""You are a warm, empathetic and personalised health assistant. 
Your primary goal is to provide health advice and support to users based on their symptoms and very specific personal history.
You should ask clarifying questions to gather more information about the user's symptoms, such as how long they have had the symptom, how severe it is, and any other relevant information.
You should also take into account the user's personal history, such as recent life changes (e.g., starting school, moving to a new city) or seasonal patterns (e.g., falling sick at the same time last year).
You should refer to reputable medical information and health blogs provided by the brave-search-mcp to ensure that your advice is accurate and up-to-date.
Be more conversational and ask questions one by one to get more information from the user.
This is the user's personal context that you should use to provide personalized advice and support:
{user_context}
"""
    
    return system_prompt

async def generate_bear_response(user_message: str, user_data: dict, user_id: str) -> str:
    """
    Generate Care Bear response using Dedalus Labs AI with full user context
    """
    try:
        # Initialize session if it doesn't exist
        if user_id not in sessions:
            sessions[user_id] = []
            
            # Build comprehensive user context
            user_context = await build_user_context_string(user_id, user_data)
            
            # Add system prompt with full context as first message
            system_prompt = build_system_prompt(user_data, user_context)
            sessions[user_id].append({"role": "system", "content": system_prompt})
        
        # Append user message to session history
        sessions[user_id].append({"role": "user", "content": user_message})
        
        # Generate response using Dedalus
        response_stream = dedalus_runner.run(
            messages=sessions[user_id],
            model="anthropic/claude-sonnet-4-5-20250929",  # Using Claude Sonnet 4.5
            stream=True,
            mcp_servers=["tsion/brave-search-mcp"]
        )
        
        # Collect full response
        full_response = ""
        async for chunk in response_stream:
            if hasattr(chunk, "choices") and chunk.choices:
                delta = chunk.choices[0].delta
                if hasattr(delta, "content") and delta.content:
                    full_response += delta.content
        
        # Save assistant response to session
        sessions[user_id].append({"role": "assistant", "content": full_response})
        
        return full_response
        
    except Exception as e:
        # Fallback response if AI fails
        return f"I'm having trouble processing that right now. Could you please try again? (Error: {str(e)})"

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
        
        # Generate Care Bear response using Dedalus Labs
        bear_response_text = await generate_bear_response(
            chat_request.message, 
            user, 
            chat_request.user_id
        )
        
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
        
        # Also clear the session from memory
        if user_id in sessions:
            del sessions[user_id]
        
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
        
        # Initialize session with system prompt and full user context
        if user_id not in sessions:
            sessions[user_id] = []
            
            # Build comprehensive user context
            user_context = await build_user_context_string(user_id, user)
            
            # Add system prompt with full context
            system_prompt = build_system_prompt(user, user_context)
            sessions[user_id].append({"role": "system", "content": system_prompt})
        
        # Create welcome message
        welcome_message = f"Hey {first_name}! How are you feeling today?"
        
        timestamp = datetime.utcnow()
        
        # Save welcome message
        bear_msg_doc = {
            "user_id": user_id,
            "sender": "bear",
            "message": welcome_message,
            "timestamp": timestamp
        }
        result = await Collections.chat_history().insert_one(bear_msg_doc)
        
        # Add to session history
        sessions[user_id].append({"role": "assistant", "content": welcome_message})
        
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