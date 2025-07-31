import asyncio
from pathlib import Path
import base64
import os
from typing import Dict, Any

import instructor
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from fastapi import HTTPException
from dotenv import load_dotenv

from data_schema import DBSchema
from db import get_successful_tasks_by_project, get_projects
from api_schema import QueryResponse

load_dotenv()

RAG_SEMAPHORE = asyncio.Semaphore(5)

async_client = instructor.from_openai(
    AsyncOpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL"),
    ),
    mode=instructor.Mode.JSON,
)

model = os.getenv("OPENAI_MODEL", "google/gemini-2.5-flash")


class SingleAnswer(BaseModel):
    note_id: str = Field(description="ID of the source note")
    should_include: bool = Field(description="Whether this note is relevant to the question")
    answer: str = Field(description="Answer extracted from this specific note")


def load_and_validate_notes(project_id: str) -> list[DBSchema]:
    projects = get_projects()
    project_exists = any(p["id"] == project_id for p in projects)
    
    if not project_exists:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    
    successful_tasks = get_successful_tasks_by_project(project_id)
    
    if not successful_tasks:
        raise HTTPException(status_code=404, detail=f"No successful tasks found for project {project_id}")
    
    notes = []
    for task in successful_tasks:
        try:
            if "base_content" in task:
                from datetime import datetime
                if isinstance(task.get("created_at"), str):
                    task["created_at"] = datetime.fromisoformat(task["created_at"])
                note = DBSchema(**task)
            else:
                from data_schema import BaseContentModel, LinksModel, MetadataModel, CommentsModel, AuthorProfileModel
                from datetime import datetime
                
                note_content = task.get("note_content", {})
                user_profile = task.get("user_profile", {})
                
                note = DBSchema(
                    id=task["id"],
                    project_id=task["project_id"],
                    url=task.get("url"),
                    html=task.get("html"),
                    base_content=BaseContentModel(
                        title=note_content.get("title", ""),
                        content=note_content.get("content", ""),
                        author_name=note_content.get("author_name", ""),
                        publish_date=note_content.get("date", "")
                    ),
                    links=LinksModel(
                        author_avatar_url=note_content.get("author_avatar_url", ""),
                        author_profile_url=note_content.get("author_profile_url", ""),
                        image_urls=note_content.get("image_urls", [])
                    ),
                    metadata=MetadataModel(
                        tags=note_content.get("tags", []),
                        like_count=note_content.get("like_count", 0),
                        comment_count=note_content.get("comment_count", 0),
                        favorite_count=note_content.get("favorite_count", 0),
                        location=note_content.get("location", "未知")
                    ),
                    comments=[
                        CommentsModel(
                            comment_content=c.get("comment", ""),
                            comment_author_name=c.get("comment_author_name", ""),
                            comment_publish_date=c.get("comment_publish_date", ""),
                            first_reply_to_comment=c.get("reply_to_comment", "")
                        ) for c in note_content.get("comments", [])
                    ],
                    author_profile=AuthorProfileModel(
                        author_name=user_profile.get("author_name", ""),
                        location=user_profile.get("location", "未知"),
                        author_avatar_url=user_profile.get("author_avatar_url", ""),
                        introduction=user_profile.get("introduction", ""),
                        related_topics=user_profile.get("related_topics", []),
                        interests=user_profile.get("interests", []),
                        careers=[user_profile.get("career", "")] if user_profile.get("career") else []
                    ),
                    image_assets=task.get("image_assets", []),
                    token_usage=task.get("token_usage", 0),
                    created_at=datetime.fromisoformat(task["created_at"]) if isinstance(task["created_at"], str) else task["created_at"],
                    processing_time_seconds=task.get("processing_time_seconds", 0)
                )
            
            notes.append(note)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse note {task.get('id', 'unknown')}: {str(e)}")
    
    return notes


def convert_image_to_data_uri(image_asset_id: str) -> str:
    image_path = Path("./static/assets/images") / f"{image_asset_id}.webp"
    
    if not image_path.exists():
        raise HTTPException(status_code=500, detail=f"Image asset {image_asset_id} not found")
    
    try:
        with open(image_path, "rb") as image_file:
            base64_str = base64.b64encode(image_file.read()).decode('utf-8')
            return f"data:image/webp;base64,{base64_str}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read image {image_asset_id}: {str(e)}")


def build_multimodal_prompt(note: DBSchema, question: str) -> Dict[str, Any]:
    base_content_str = note.base_content.model_dump_json()
    comments_str = "\n".join([comment.model_dump_json() for comment in note.comments])
    
    content_parts = [
        {
            "type": "text",
            "text": f"""<note_content>
{base_content_str}
</note_content>

<comments>
{comments_str}
</comments>

---

Please answer the following question based on this note:
{question}"""
        }
    ]
    
    for image_asset_id in note.image_assets:
        try:
            image_uri = convert_image_to_data_uri(image_asset_id)
            content_parts.append({
                "type": "image_url",
                "image_url": {"url": image_uri}
            })
        except Exception:
            continue
    
    return {
        "role": "user",
        "content": content_parts
    }


async def analyze_single_note(note: DBSchema, question: str) -> SingleAnswer:
    async with RAG_SEMAPHORE:
        prompt = build_multimodal_prompt(note, question)
        
        try:
            response = await async_client.chat.completions.create(
                model=model,
                messages=[prompt],
                response_model=SingleAnswer,
                temperature=0
            )
            
            return SingleAnswer(
                note_id=note.id,
                should_include=response.should_include,
                answer=response.answer
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to analyze note {note.id}: {str(e)}")


async def aggregate_answers(question: str, answers: list[SingleAnswer]) -> str:
    relevant_answers = [a for a in answers if a.should_include]
    
    if not relevant_answers:
        return "I couldn't find any relevant information in the analyzed notes to answer your question."
    
    answers_str = "\n".join([
        f"Note {i+1}: {answer.answer}" 
        for i, answer in enumerate(relevant_answers)
    ])
    
    aggregation_prompt = f"""Given the following individual answers from different notes, please provide a comprehensive aggregated answer to the question.

<individual-answers>
{answers_str}
</individual-answers>

Question: {question}

Please synthesize these individual answers into a coherent, comprehensive response."""

    try:
        response = await async_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": aggregation_prompt}],
            temperature=0
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to aggregate answers: {str(e)}")


async def query_project_notes(project_id: str, question: str) -> QueryResponse:
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    notes = load_and_validate_notes(project_id)
    
    tasks = [analyze_single_note(note, question) for note in notes]
    analyses = await asyncio.gather(*tasks)
    
    aggregated_answer = await aggregate_answers(question, analyses)
    
    relevant_note_ids = [a.note_id for a in analyses if a.should_include]
    
    return QueryResponse(
        answer=aggregated_answer,
        relevant_note_ids=relevant_note_ids
    )