"""
Database connection and configuration
MongoDB connection using pymongo with motor (async driver)
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import os
from typing import Optional

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "care_bear_db")

# Global database client
client: Optional[AsyncIOMotorClient] = None
database = None

async def connect_to_mongo():
    """Connect to MongoDB"""
    global client, database
    try:
        client = AsyncIOMotorClient(
            MONGODB_URL,
            server_api=ServerApi('1'),
            maxPoolSize=10,
            minPoolSize=1
        )
        database = client[DATABASE_NAME]
        
        # Test connection
        await client.admin.command('ping')
        print(f"✅ Successfully connected to MongoDB: {DATABASE_NAME}")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("🔌 MongoDB connection closed")

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # Users collection indexes
        await database.users.create_index("user_id", unique=True)
        await database.users.create_index("email")
        
        # Chat history indexes
        await database.chat_history.create_index("user_id")
        await database.chat_history.create_index([("user_id", 1), ("timestamp", -1)])
        
        # Calendar/medications indexes
        await database.medications.create_index("user_id")
        await database.medications.create_index([("user_id", 1), ("date", 1)])
        
        # Mood tracking indexes
        await database.mood_tracking.create_index("user_id")
        await database.mood_tracking.create_index([("user_id", 1), ("date", -1)])
        
        # Health conditions indexes
        await database.health_conditions.create_index("user_id")
        await database.health_conditions.create_index([("user_id", 1), ("recorded_date", -1)])
        
        print("✅ Database indexes created successfully")
    except Exception as e:
        print(f"⚠️ Warning: Could not create indexes: {e}")

def get_database():
    """Get database instance"""
    return database

# Collections helper
class Collections:
    """Database collections"""
    
    @staticmethod
    def users():
        return database.users
    
    @staticmethod
    def chat_history():
        return database.chat_history
    
    @staticmethod
    def medications():
        return database.medications
    
    @staticmethod
    def medication_schedule():
        return database.medication_schedule
    
    @staticmethod
    def mood_tracking():
        return database.mood_tracking
    
    @staticmethod
    def health_conditions():
        return database.health_conditions
    
    @staticmethod
    def health_records():
        return database.health_records
