"""
Pydantic models for request/response validation
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

# ===== User Models =====

class PersonalInfo(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: str
    gender: str
    email: EmailStr
    phone: str

class MedicalHistory(BaseModel):
    allergies: Optional[str] = ""
    chronic_conditions: Optional[str] = ""
    past_surgeries: Optional[str] = ""
    current_medications: Optional[str] = ""

class HealthStatus(BaseModel):
    current_conditions: Optional[str] = ""
    symptoms: Optional[str] = ""
    is_pregnant: Optional[str] = "n/a"
    due_date: Optional[str] = ""

class FamilyHistory(BaseModel):
    heart_disease: bool = False
    diabetes: bool = False
    cancer: bool = False
    mental_health: bool = False
    other: Optional[str] = ""

class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str

class UserCreate(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    personal_info: PersonalInfo
    medical_history: MedicalHistory
    health_status: HealthStatus
    family_history: FamilyHistory
    emergency_contact: EmergencyContact

class UserUpdate(BaseModel):
    personal_info: Optional[PersonalInfo] = None
    medical_history: Optional[MedicalHistory] = None
    health_status: Optional[HealthStatus] = None
    family_history: Optional[FamilyHistory] = None
    emergency_contact: Optional[EmergencyContact] = None

class UserResponse(BaseModel):
    user_id: str
    personal_info: PersonalInfo
    medical_history: MedicalHistory
    health_status: HealthStatus
    family_history: FamilyHistory
    emergency_contact: EmergencyContact
    created_at: datetime
    updated_at: datetime

# ===== Chat Models =====

class MessageSender(str, Enum):
    USER = "user"
    BEAR = "bear"

class ChatMessage(BaseModel):
    user_id: str
    sender: MessageSender
    message: str
    timestamp: Optional[datetime] = None

class ChatMessageResponse(BaseModel):
    message_id: str
    user_id: str
    sender: str
    message: str
    timestamp: datetime

class ChatHistoryResponse(BaseModel):
    user_id: str
    messages: List[ChatMessageResponse]
    total_messages: int

class ChatRequest(BaseModel):
    user_id: str
    message: str

class ChatResponse(BaseModel):
    message_id: str
    user_id: str
    user_message: str
    bear_response: str
    timestamp: datetime

# ===== Medication Models =====

class MedicationFrequency(str, Enum):
    DAILY = "Daily"
    TWICE_DAILY = "Twice daily"
    THREE_TIMES_DAILY = "Three times daily"
    AS_NEEDED = "As needed"
    WEEKLY = "Weekly"
    CUSTOM = "Custom"

class MedicationCreate(BaseModel):
    user_id: str
    name: str = Field(..., min_length=1, max_length=200)
    dosage: str
    time: str  # HH:MM format
    frequency: MedicationFrequency = MedicationFrequency.DAILY
    notes: Optional[str] = ""
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class MedicationUpdate(BaseModel):
    name: Optional[str] = None
    dosage: Optional[str] = None
    time: Optional[str] = None
    frequency: Optional[MedicationFrequency] = None
    notes: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class MedicationResponse(BaseModel):
    medication_id: str
    user_id: str
    name: str
    dosage: str
    time: str
    frequency: str
    notes: str
    start_date: Optional[date]
    end_date: Optional[date]
    is_active: bool
    created_at: datetime
    updated_at: datetime

class MedicationTaken(BaseModel):
    user_id: str
    medication_id: str
    date: date
    taken: bool
    time_taken: Optional[datetime] = None
    notes: Optional[str] = ""

class MedicationTakenResponse(BaseModel):
    record_id: str
    user_id: str
    medication_id: str
    date: date
    taken: bool
    time_taken: Optional[datetime]
    notes: str

# ===== Mood Tracking Models =====

class MoodLevel(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    OKAY = "okay"
    BAD = "bad"
    TERRIBLE = "terrible"

class MoodEntry(BaseModel):
    user_id: str
    date: date
    mood: MoodLevel
    energy_level: int = Field(..., ge=1, le=10, description="Energy level 1-10")
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    notes: Optional[str] = ""
    symptoms: Optional[List[str]] = []

class MoodEntryResponse(BaseModel):
    entry_id: str
    user_id: str
    date: date
    mood: str
    energy_level: int
    sleep_hours: Optional[float]
    notes: str
    symptoms: List[str]
    created_at: datetime

# ===== Health Condition Models =====

class HealthConditionSeverity(str, Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"

class HealthConditionCreate(BaseModel):
    user_id: str
    condition_name: str
    severity: HealthConditionSeverity
    symptoms: List[str] = []
    recorded_date: date
    notes: Optional[str] = ""
    is_active: bool = True

class HealthConditionUpdate(BaseModel):
    condition_name: Optional[str] = None
    severity: Optional[HealthConditionSeverity] = None
    symptoms: Optional[List[str]] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class HealthConditionResponse(BaseModel):
    condition_id: str
    user_id: str
    condition_name: str
    severity: str
    symptoms: List[str]
    recorded_date: date
    notes: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

# ===== Calendar/Dashboard Models =====

class CalendarDay(BaseModel):
    date: date
    medications: List[MedicationResponse]
    medications_taken: List[str]  # List of medication IDs that were taken
    mood_entry: Optional[MoodEntryResponse] = None
    health_conditions: List[str] = []  # Active condition names

class CalendarResponse(BaseModel):
    user_id: str
    month: int
    year: int
    days: List[CalendarDay]

# ===== Health Report Models =====

class HealthReportRequest(BaseModel):
    user_id: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class HealthReportResponse(BaseModel):
    user_id: str
    generated_at: datetime
    user_info: UserResponse
    medications: List[MedicationResponse]
    recent_moods: List[MoodEntryResponse]
    active_conditions: List[HealthConditionResponse]
    chat_summary: Dict[str, Any]

# ===== Generic Response Models =====

class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[str] = None
