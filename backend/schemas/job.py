from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class StoryJobBase(BaseModel):
    theme: str
    target_ending: Optional[str] = None


class StoryJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    job_id: str
    status: str
    theme: Optional[str] = None
    target_ending: Optional[str] = None
    created_at: Optional[datetime] = None
    story_id: Optional[int] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None



class StoryJobCreate(StoryJobBase):
    pass