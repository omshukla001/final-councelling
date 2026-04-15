import os
from pymongo import MongoClient
from pymongo.database import Database
from app.config import settings
from app.utils.logger import logger

class MongoDBConnection:
    client: MongoClient = None

db_connection = MongoDBConnection()

def connect_to_mongo():
    """Create MongoDB connection client."""
    try:
        mongo_uri = settings.MONGO_URI or os.getenv("MONGO_URI")
        if not mongo_uri or mongo_uri == "your-mongodb-connection-string-here":
            logger.warning("MongoDB URI not provided. MongoDB integration will be disabled.")
            return
        import certifi
        is_local = "localhost" in mongo_uri or "127.0.0.1" in mongo_uri
        db_connection.client = MongoClient(
            mongo_uri, 
            tls=not is_local,
            tlsCAFile=certifi.where() if not is_local else None
        )
        # Test connection
        db_connection.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")

def close_mongo_connection():
    """Close MongoDB connection client."""
    if db_connection.client:
        db_connection.client.close()
        logger.info("Closed MongoDB connection.")

def get_mongo_db() -> Database:
    """Dependency for getting the MongoDB database."""
    if not db_connection.client:
        # Try connecting once if not connected
        connect_to_mongo()
        
    if db_connection.client:
        return db_connection.client[settings.MONGO_DB_NAME]
        
    raise Exception("MongoDB is not configured or available")
