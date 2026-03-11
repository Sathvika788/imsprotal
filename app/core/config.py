from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # AWS Configuration
    AWS_ACCESS_KEY_ID: str
    AWS_SECRET_ACCESS_KEY: str
    AWS_REGION: str = "ap-south-1"
    DYNAMODB_ENDPOINT_URL: Optional[str] = None
    S3_BUCKET_NAME: str
    SES_SENDER_EMAIL: str
    
    # JWT Configuration
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # App Configuration
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:5173"
    DEFAULT_DAILY_RATE: int = 500
    LOG_CUTOFF_HOUR: int = 18
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
