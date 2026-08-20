# API endpoints for story creation, node traversal, and translation

import uuid
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Cookie, Response, BackgroundTasks

from sqlalchemy.orm import Session
from db.database import get_db, SessionLocal

from models.story import Story, StoryNode
from models.job import StoryJob
from schemas.story import (
    CompleteStoryNodeResponse, CreateStoryRequest, CompleteStoryResponse,
    TranslateStoryRequest, TranslateStoryResponse
)

from schemas.job import StoryJobResponse

from services.story_generator import generate_groq_story, continue_story_node, translate_story

router = APIRouter(
    prefix="/stories",
    tags=["Stories"]
)


def get_session_id(session_id: Optional[str] = Cookie(None)):
    if not session_id:
        session_id = str(uuid.uuid4())
    return session_id


@router.post("/create", response_model=StoryJobResponse)
def create_story(
        request: CreateStoryRequest,
        background_tasks: BackgroundTasks,
        response: Response,
        session_id: str = Depends(get_session_id),
        db: Session = Depends(get_db)
):
    response.set_cookie(key="session_id", value=session_id, httponly=True)

    job_id = str(uuid.uuid4())

    job = StoryJob(
        job_id=job_id,
        session_id=session_id,
        theme=request.theme,
        target_ending=request.target_ending,
        status="pending"
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    background_tasks.add_task(
        generate_story_task,
        job_id=job_id,
        theme=request.theme,
        target_ending=request.target_ending,
        session_id=session_id
    )

    return job


def generate_story_task(job_id: str, theme: str, target_ending: Optional[str], session_id: str):
    db = SessionLocal()

    try:
        job = db.query(StoryJob).filter(StoryJob.job_id == job_id).first()

        if not job:
            return

        try:
            job.status = "processing"
            db.commit()

            # Generate the story opening and initial branches via Groq
            story = generate_groq_story(
                db=db,
                theme=theme,
                session_id=session_id,
                target_ending=target_ending
            )

            job.story_id = story.id
            job.status = "completed"
            job.completed_at = datetime.now()
            db.commit()
        except Exception as e:
            job.status = "failed"
            job.completed_at = datetime.now()
            job.error = str(e)
            db.commit()

    finally:
        db.close()


def build_complete_story(db: Session, story: Story) -> CompleteStoryResponse:
    nodes = db.query(StoryNode).filter(StoryNode.story_id == story.id).all()

    root_node_obj = None
    all_nodes_dict = {}

    for n in nodes:
        node_resp = CompleteStoryNodeResponse(
            id=n.id,
            content=n.content,
            is_ending=n.is_ending or False,
            is_winning_ending=n.is_winning or False,
            options=n.options or []
        )
        all_nodes_dict[str(n.id)] = node_resp
        if n.is_root:
            root_node_obj = node_resp

    if not root_node_obj:
        if nodes:
            root_node_obj = all_nodes_dict[str(nodes[0].id)]
        else:
            root_node_obj = CompleteStoryNodeResponse(
                id=0,
                content="Empty story",
                is_ending=True,
                is_winning_ending=False,
                options=[]
            )

    return CompleteStoryResponse(
        id=story.id,
        title=story.title,
        session_id=story.session_id,
        created_at=story.created_at or datetime.now(),
        root_node=root_node_obj,
        all_nodes=all_nodes_dict
    )


@router.get("/{story_id}/complete", response_model=CompleteStoryResponse)
def complete_story(story_id: int, db: Session = Depends(get_db)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    return build_complete_story(db, story)


@router.get("/{story_id}/nodes/{node_id}", response_model=CompleteStoryNodeResponse)
def get_or_continue_node(story_id: int, node_id: int, db: Session = Depends(get_db)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    node = db.query(StoryNode).filter(StoryNode.id == node_id, StoryNode.story_id == story_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Story node not found")

    # Generate next choices dynamically on the fly if not already created
    if not node.options and not node.is_ending:
        node = continue_story_node(db, story, node)

    return CompleteStoryNodeResponse(
        id=node.id,
        content=node.content,
        is_ending=node.is_ending or False,
        is_winning_ending=node.is_winning or False,
        options=node.options or []
    )


@router.post("/{story_id}/translate", response_model=TranslateStoryResponse)
def translate_story_endpoint(
    story_id: int,
    request: TranslateStoryRequest,
    db: Session = Depends(get_db)
):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    result = translate_story(
        db=db,
        story=story,
        ending_node_id=request.ending_node_id,
        language=request.language
    )
    return result
