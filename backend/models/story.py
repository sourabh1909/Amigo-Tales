from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.database import Base

class Story(Base):
    __tablename__ = 'stories'

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    session_id = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    description = Column(String, index=True)
    target_ending = Column(String, nullable=True)

    nodes = relationship("StoryNode", back_populates="story")


class StoryNode(Base):
    __tablename__ = 'story_nodes'

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id"), index=True)
    content = Column(String, index=True)
    is_root = Column(Boolean, default=False, index=True)
    is_ending = Column(Boolean, default=False, index=True)
    is_winning = Column(Boolean, default=False, index=True)
    depth = Column(Integer, default=0)
    options = Column(JSON, default=list)

    story = relationship("Story", back_populates="nodes")