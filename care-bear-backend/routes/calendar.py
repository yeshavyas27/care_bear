"""
Calendar API Routes
Handles medication schedules, mood tracking, and calendar views
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, date, timedelta
from bson import ObjectId

from models import (
    MedicationCreate, MedicationUpdate, MedicationResponse,
    MedicationTaken, MedicationTakenResponse,
    MoodEntry, MoodEntryResponse,
    CalendarDay, CalendarResponse,
    SuccessResponse
)
from database import Collections

router = APIRouter()

def serialize_doc(doc) -> dict:
    """Convert MongoDB document to serializable dict"""
    if doc:
        doc["_id"] = str(doc["_id"])
        return doc
    return None

# ===== Medication Endpoints =====

@router.post("/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def create_medication(medication: MedicationCreate):
    """
    Create a new medication schedule
    """
    try:
        # Verify user exists
        user = await Collections.users().find_one({"user_id": medication.user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prepare medication document
        med_dict = medication.model_dump()
        med_dict["is_active"] = True
        med_dict["created_at"] = datetime.utcnow()
        med_dict["updated_at"] = datetime.utcnow()
        
        # Insert medication
        result = await Collections.medications().insert_one(med_dict)
        
        # Fetch created medication
        created_med = await Collections.medications().find_one({"_id": result.inserted_id})
        
        created_med["medication_id"] = str(created_med.pop("_id"))
        return MedicationResponse(**created_med)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating medication: {str(e)}"
        )

@router.get("/medications/{user_id}", response_model=List[MedicationResponse])
async def get_user_medications(user_id: str, active_only: bool = True):
    """
    Get all medications for a user
    """
    try:
        query = {"user_id": user_id}
        if active_only:
            query["is_active"] = True
        
        cursor = Collections.medications().find(query).sort("time", 1)
        medications = await cursor.to_list(length=None)
        
        result = []
        for med in medications:
            med["medication_id"] = str(med.pop("_id"))
            result.append(MedicationResponse(**med))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching medications: {str(e)}"
        )

@router.put("/medications/{medication_id}", response_model=MedicationResponse)
async def update_medication(medication_id: str, medication_update: MedicationUpdate):
    """
    Update a medication
    """
    try:
        # Prepare update data
        update_data = medication_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        # Update medication
        result = await Collections.medications().update_one(
            {"_id": ObjectId(medication_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medication not found"
            )
        
        # Fetch updated medication
        updated_med = await Collections.medications().find_one({"_id": ObjectId(medication_id)})
        updated_med["medication_id"] = str(updated_med.pop("_id"))
        
        return MedicationResponse(**updated_med)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating medication: {str(e)}"
        )

@router.delete("/medications/{medication_id}", response_model=SuccessResponse)
async def delete_medication(medication_id: str):
    """
    Delete a medication (soft delete - sets is_active to False)
    """
    try:
        result = await Collections.medications().update_one(
            {"_id": ObjectId(medication_id)},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medication not found"
            )
        
        return SuccessResponse(
            message="Medication deactivated successfully",
            data={"medication_id": medication_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting medication: {str(e)}"
        )

# ===== Medication Tracking Endpoints =====

@router.post("/medications/track", response_model=MedicationTakenResponse)
async def track_medication(med_taken: MedicationTaken):
    """
    Track whether a medication was taken on a specific date
    """
    try:
        # Check if record already exists
        existing = await Collections.medication_schedule().find_one({
            "user_id": med_taken.user_id,
            "medication_id": med_taken.medication_id,
            "date": med_taken.date
        })
        
        if existing:
            # Update existing record
            update_data = med_taken.model_dump()
            update_data["updated_at"] = datetime.utcnow()
            
            await Collections.medication_schedule().update_one(
                {"_id": existing["_id"]},
                {"$set": update_data}
            )
            
            updated = await Collections.medication_schedule().find_one({"_id": existing["_id"]})
            updated["record_id"] = str(updated.pop("_id"))
            return MedicationTakenResponse(**updated)
        else:
            # Create new record
            record_dict = med_taken.model_dump()
            record_dict["created_at"] = datetime.utcnow()
            record_dict["updated_at"] = datetime.utcnow()
            
            result = await Collections.medication_schedule().insert_one(record_dict)
            
            created = await Collections.medication_schedule().find_one({"_id": result.inserted_id})
            created["record_id"] = str(created.pop("_id"))
            return MedicationTakenResponse(**created)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error tracking medication: {str(e)}"
        )

@router.get("/medications/track/{user_id}", response_model=List[MedicationTakenResponse])
async def get_medication_tracking(
    user_id: str, 
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """
    Get medication tracking records for a user
    """
    try:
        query = {"user_id": user_id}
        
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            query["date"] = date_query
        
        cursor = Collections.medication_schedule().find(query).sort("date", -1)
        records = await cursor.to_list(length=None)
        
        result = []
        for record in records:
            record["record_id"] = str(record.pop("_id"))
            result.append(MedicationTakenResponse(**record))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching medication tracking: {str(e)}"
        )

# ===== Mood Tracking Endpoints =====

@router.post("/mood", response_model=MoodEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_mood_entry(mood_entry: MoodEntry):
    """
    Create a mood entry
    """
    try:
        # Check if mood entry already exists for this date
        existing = await Collections.mood_tracking().find_one({
            "user_id": mood_entry.user_id,
            "date": mood_entry.date
        })
        
        if existing:
            # Update existing entry
            update_data = mood_entry.model_dump()
            update_data["updated_at"] = datetime.utcnow()
            
            await Collections.mood_tracking().update_one(
                {"_id": existing["_id"]},
                {"$set": update_data}
            )
            
            updated = await Collections.mood_tracking().find_one({"_id": existing["_id"]})
            updated["entry_id"] = str(updated.pop("_id"))
            return MoodEntryResponse(**updated)
        else:
            # Create new entry
            entry_dict = mood_entry.model_dump()
            entry_dict["created_at"] = datetime.utcnow()
            
            result = await Collections.mood_tracking().insert_one(entry_dict)
            
            created = await Collections.mood_tracking().find_one({"_id": result.inserted_id})
            created["entry_id"] = str(created.pop("_id"))
            return MoodEntryResponse(**created)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating mood entry: {str(e)}"
        )

@router.get("/mood/{user_id}", response_model=List[MoodEntryResponse])
async def get_mood_entries(
    user_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 30
):
    """
    Get mood entries for a user
    """
    try:
        query = {"user_id": user_id}
        
        if start_date or end_date:
            date_query = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            query["date"] = date_query
        
        cursor = Collections.mood_tracking().find(query).sort("date", -1).limit(limit)
        entries = await cursor.to_list(length=limit)
        
        result = []
        for entry in entries:
            entry["entry_id"] = str(entry.pop("_id"))
            result.append(MoodEntryResponse(**entry))
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching mood entries: {str(e)}"
        )

# ===== Calendar View Endpoint =====

@router.get("/view/{user_id}", response_model=CalendarResponse)
async def get_calendar_view(
    user_id: str,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000, le=2100)
):
    """
    Get calendar view with medications, moods, and health conditions for a month
    """
    try:
        # Verify user exists
        user = await Collections.users().find_one({"user_id": user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Calculate date range
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        # Get medications for user
        medications = await Collections.medications().find({
            "user_id": user_id,
            "is_active": True
        }).to_list(length=None)
        
        med_responses = []
        for med in medications:
            med["medication_id"] = str(med.pop("_id"))
            med_responses.append(MedicationResponse(**med))
        
        # Get medication tracking
        med_tracking = await Collections.medication_schedule().find({
            "user_id": user_id,
            "date": {"$gte": start_date, "$lte": end_date}
        }).to_list(length=None)
        
        # Get mood entries
        mood_entries = await Collections.mood_tracking().find({
            "user_id": user_id,
            "date": {"$gte": start_date, "$lte": end_date}
        }).to_list(length=None)
        
        # Get active health conditions
        health_conditions = await Collections.health_conditions().find({
            "user_id": user_id,
            "is_active": True
        }).to_list(length=None)
        
        # Build calendar days
        calendar_days = []
        current_date = start_date
        
        while current_date <= end_date:
            # Get medications taken on this date
            meds_taken = [
                record["medication_id"] 
                for record in med_tracking 
                if record["date"] == current_date and record.get("taken", False)
            ]
            
            # Get mood entry for this date
            mood_entry = None
            for mood in mood_entries:
                if mood["date"] == current_date:
                    mood["entry_id"] = str(mood.pop("_id"))
                    mood_entry = MoodEntryResponse(**mood)
                    break
            
            # Get active conditions
            condition_names = [cond["condition_name"] for cond in health_conditions]
            
            calendar_days.append(CalendarDay(
                date=current_date,
                medications=med_responses,
                medications_taken=meds_taken,
                mood_entry=mood_entry,
                health_conditions=condition_names
            ))
            
            current_date += timedelta(days=1)
        
        return CalendarResponse(
            user_id=user_id,
            month=month,
            year=year,
            days=calendar_days
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching calendar view: {str(e)}"
        )
