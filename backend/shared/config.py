from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/emotions_db"
    
    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True
    secret_key: str = "your-secret-key-change-in-production"
    
    # Microservices URLs
    facial_service_url: str = "http://localhost:8001"
    voice_service_url: str = "http://localhost:8002"
    text_service_url: str = "http://localhost:8003"
    fusion_service_url: str = "http://localhost:8004"
    
    # Models
    model_cache_dir: str = "./models_cache"
    max_file_size_mb: int = 10
    
    # CORS
    cors_origins: list = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
