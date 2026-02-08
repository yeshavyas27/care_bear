"""
Users API Routes
Handles user profile creation, retrieval, and updates
"""

from fastapi import APIRouter, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId

from models import (
    UserCreate, UserUpdate, UserResponse, 
    SuccessResponse, ErrorResponse
)
from database import Collections

router = APIRouter()

def serialize_user(user_doc) -> dict:
    """Convert MongoDB document to serializable dict"""
    if user_doc:
        user_doc["_id"] = str(user_doc["_id"])
        return user_doc
    return None

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """
    Create a new user profile
    """
    try:
        # Check if user already exists
        existing_user = await Collections.users().find_one({"user_id": user.user_id})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this ID already exists"
            )
        
        # Prepare user document
        user_dict = user.model_dump()
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        
        # Insert into database
        result = await Collections.users().insert_one(user_dict)
        
        # Fetch created user
        created_user = await Collections.users().find_one({"_id": result.inserted_id})
        
        return serialize_user(created_user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """
    Get user profile by user ID
    """
    try:
        user = await Collections.users().find_one({"user_id": user_id})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return serialize_user(user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching user: {str(e)}"
        )

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate):
    """
    Update user profile
    """
    try:
        # Check if user exists
        existing_user = await Collections.users().find_one({"user_id": user_id})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prepare update data (only include provided fields)
        update_data = user_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        # Update user
        await Collections.users().update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
        
        # Fetch updated user
        updated_user = await Collections.users().find_one({"user_id": user_id})
        
        return serialize_user(updated_user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user: {str(e)}"
        )

@router.delete("/{user_id}", response_model=SuccessResponse)
async def delete_user(user_id: str):
    """
    Delete user and all associated data
    """
    try:
        # Check if user exists
        existing_user = await Collections.users().find_one({"user_id": user_id})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete user and all related data
        await Collections.users().delete_one({"user_id": user_id})
        await Collections.chat_history().delete_many({"user_id": user_id})
        await Collections.medications().delete_many({"user_id": user_id})
        await Collections.medication_schedule().delete_many({"user_id": user_id})
        await Collections.mood_tracking().delete_many({"user_id": user_id})
        await Collections.health_conditions().delete_many({"user_id": user_id})
        
        return SuccessResponse(
            message="User and all associated data deleted successfully",
            data={"user_id": user_id}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}"
        )

@router.get("/", response_model=List[UserResponse])
async def list_users(skip: int = 0, limit: int = 100):
    """
    List all users (for demo purposes)
    """
    try:
        cursor = Collections.users().find().skip(skip).limit(limit)
        users = await cursor.to_list(length=limit)
        
        return [serialize_user(user) for user in users]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching users: {str(e)}"
        )
