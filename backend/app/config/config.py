from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Dict

class Settings(BaseSettings):
    # Confidence Thresholds
    HIGH_CONFIDENCE_THRESHOLD: float = 0.85
    MEDIUM_CONFIDENCE_THRESHOLD: float = 0.60
    
    # Feature Weights for Fuzzy Matching Engine
    WEIGHT_AMOUNT: float = 0.35
    WEIGHT_CUSTOMER: float = 0.30
    WEIGHT_REFERENCE: float = 0.20
    WEIGHT_DESCRIPTION: float = 0.10
    WEIGHT_DATE: float = 0.05
    
    # Tolerances
    AMOUNT_TOLERANCE_PERCENT: float = 0.02  # 2% tolerance for slight amount variation (e.g. wire fees)
    DATE_WINDOW_DAYS: int = 45  # Candidate generation date filter window
    
    # Static evaluation reference date for demo determinism
    REFERENCE_DATE: str = "2026-09-01"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
