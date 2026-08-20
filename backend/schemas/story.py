from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict

# Pydantic schemas for story nodes, requests, responses, and translations



class StoryOptionsSchema(BaseModel):
    text: str
    node_id: Optional[int] = None


class StoryNodeBase(BaseModel):
    content: str
    is_ending: bool = False
    is_winning_ending: bool = False


class CompleteStoryNodeResponse(StoryNodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    options: List[StoryOptionsSchema] = []


class StoryBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    session_id: Optional[str] = None
    target_ending: Optional[str] = None


class CreateStoryRequest(BaseModel):
    theme: str
    target_ending: Optional[str] = None


class CompleteStoryResponse(StoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    root_node: CompleteStoryNodeResponse
    all_nodes: Dict[str, CompleteStoryNodeResponse]


class TranslateStoryRequest(BaseModel):
    language: str  # "hindi" or "marathi"
    ending_node_id: int


class TranslateStoryResponse(BaseModel):
    title: str
    translated_title: str
    language: str
    summary: str
    original_summary: Optional[str] = None

