"""
Health Records API Routes
Handles health conditions tracking and health report generation
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date, timedelta
from bson import ObjectId

from models import (
    HealthConditionCreate, HealthConditionUpdate, HealthConditionResponse,
    HealthReportRequest, HealthReportResponse,
    SuccessResponse
)
from database import Collections

router = APIRouter()

# ===== Health Conditions Endpoints =====

@router.post("/conditions", response_model=HealthConditionResponse, status_code=status.HTTP_201_CREATED)
async def create_health_condition(condition: HealthConditionCreate):
    """
    Create a new health condition record
    """
    try:
        # Verify user exists
        user = await Collections.users().find_one({"user_id": condition.user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prepare condition document
        condition_dict = condition.model_dump()
        condition_dict["created_at"] = datetime.utcnow()
        condition_dict["updated_at"] = datetime.utcnow()
        
        # Insert condition
        result = await Collections.health_conditions().insert_one(condition_dict)
        
        # Fetch created condition
        created_condition = await Collections.health_conditions().find_one({"_id": result.inserted_id})
        created_condition["condition_id"] = str(created_condition.pop("_id"))
        
        return HealthConditionResponse(**created_condition)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating health condition: {str(e)}"
        )

@router.get("/conditions/{user_id}", response_model=List[HealthConditionResponse])
async def get_health_conditions(user_id: str, active_only: bool = True):
    """
    Get all health conditions for a user
    """
    try:
        query = {"user_id": user_id}
        if active_only:
            query["is_active"] = True
        
        cursor = Collections.health_conditions().find(query).sort("recorded_date", -1)
        conditions = await cursor.to_list(length=None)
        
        result = []
        for condition in conditions:
            condition["condition_id"] = str(condition.pop("_id"))
            result.append(HealthConditionResponse(**condition))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching health conditions: {str(e)}"
        )

@router.put("/conditions/{condition_id}", response_model=HealthConditionResponse)
async def update_health_condition(condition_id: str, condition_update: HealthConditionUpdate):
    """
    Update a health condition
    """
    try:
        # Prepare update data
        update_data = condition_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        # Update condition
        result = await Collections.health_conditions().update_one(
            {"_id": ObjectId(condition_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Health condition not found"
            )
        
        # Fetch updated condition
        updated_condition = await Collections.health_conditions().find_one({"_id": ObjectId(condition_id)})
        updated_condition["condition_id"] = str(updated_condition.pop("_id"))
        
        return HealthConditionResponse(**updated_condition)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating health condition: {str(e)}"
        )

@router.delete("/conditions/{condition_id}", response_model=SuccessResponse)
async def delete_health_condition(condition_id: str):
    """
    Delete a health condition (soft delete)
    """
    try:
        result = await Collections.health_conditions().update_one(
            {"_id": ObjectId(condition_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Health condition not found"
            )
        
        return SuccessResponse(
            message="Health condition deactivated successfully",
            data={"condition_id": condition_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting health condition: {str(e)}"
        )

# ===== Health Report Generation =====

@router.post("/report", response_model=HealthReportResponse)
async def generate_health_report(report_request: HealthReportRequest):
    """
    Generate a comprehensive health report for a user
    """
    try:
        # Verify user exists
        user = await Collections.users().find_one({"user_id": report_request.user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prepare user info response
        user["_id"] = str(user["_id"])
        from models import UserResponse
        user_info = UserResponse(**user)
        
        # Set date range
        end_date = report_request.end_date or date.today()
        start_date = report_request.start_date or (end_date - timedelta(days=30))
        
        # Get medications
        medications = await Collections.medications().find({
            "user_id": report_request.user_id,
            "is_active": True
        }).to_list(length=None)
        
        med_responses = []
        for med in medications:
            from models import MedicationResponse
            med["medication_id"] = str(med.pop("_id"))
            med_responses.append(MedicationResponse(**med))
        
        # Get recent mood entries
        mood_entries = await Collections.mood_tracking().find({
            "user_id": report_request.user_id,
            "date": {"$gte": start_date, "$lte": end_date}
        }).sort("date", -1).to_list(length=30)
        
        from models import MoodEntryResponse
        mood_responses = []
        for mood in mood_entries:
            mood["entry_id"] = str(mood.pop("_id"))
            mood_responses.append(MoodEntryResponse(**mood))
        
        # Get active health conditions
        conditions = await Collections.health_conditions().find({
            "user_id": report_request.user_id,
            "is_active": True
        }).to_list(length=None)
        
        condition_responses = []
        for condition in conditions:
            condition["condition_id"] = str(condition.pop("_id"))
            condition_responses.append(HealthConditionResponse(**condition))
        
        # Get chat summary
        chat_messages = await Collections.chat_history().find({
            "user_id": report_request.user_id,
            "timestamp": {
                "$gte": datetime.combine(start_date, datetime.min.time()),
                "$lte": datetime.combine(end_date, datetime.max.time())
            }
        }).sort("timestamp", -1).limit(20).to_list(length=20)
        
        chat_summary = {
            "total_conversations": len(chat_messages),
            "date_range": f"{start_date} to {end_date}",
            "recent_topics": []
        }
        
        # Extract topics from recent messages (simple keyword extraction)
        keywords = set()
        for msg in chat_messages:
            if msg.get("sender") == "user":
                message_text = msg.get("message", "").lower()
                # Simple keyword extraction
                for word in ["pain", "medication", "tired", "sleep", "doctor", "symptoms"]:
                    if word in message_text:
                        keywords.add(word)
        
        chat_summary["recent_topics"] = list(keywords)
        
        return HealthReportResponse(
            user_id=report_request.user_id,
            generated_at=datetime.utcnow(),
            user_info=user_info,
            medications=med_responses,
            recent_moods=mood_responses,
            active_conditions=condition_responses,
            chat_summary=chat_summary
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating health report: {str(e)}"
        )

@router.get("/summary/{user_id}")
async def get_health_summary(user_id: str):
    """
    Get a quick health summary for dashboard
    """
    try:
        # Verify user exists
        user = await Collections.users().find_one({"user_id": user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Count active medications
        active_medications = await Collections.medications().count_documents({
            "user_id": user_id,
            "is_active": True
        })
        
        # Count active health conditions
        active_conditions = await Collections.health_conditions().count_documents({
            "user_id": user_id,
            "is_active": True
        })
        
        # Get today's medication compliance
        today = date.today()
        total_meds_today = active_medications
        taken_today = await Collections.medication_schedule().count_documents({
            "user_id": user_id,
            "date": today,
            "taken": True
        })
        
        # Get latest mood
        latest_mood = await Collections.mood_tracking().find_one(
            {"user_id": user_id},
            sort=[("date", -1)]
        )
        
        mood_status = latest_mood.get("mood") if latest_mood else "Not recorded"
        
        # Recent chat activity
        recent_chats = await Collections.chat_history().count_documents({
            "user_id": user_id,
            "timestamp": {"$gte": datetime.utcnow() - timedelta(days=7)}
        })
        
        return {
            "user_id": user_id,
            "active_medications": active_medications,
            "active_conditions": active_conditions,
            "medication_compliance_today": {
                "total": total_meds_today,
                "taken": taken_today,
                "percentage": (taken_today / total_meds_today * 100) if total_meds_today > 0 else 0
            },
            "latest_mood": mood_status,
            "recent_chat_messages": recent_chats,
            "generated_at": datetime.utcnow()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating health summary: {str(e)}"
        )
