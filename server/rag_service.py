import asyncio
import base64
import os
from pathlib import Path
from typing import Any

import instructor
from dotenv import load_dotenv
from fastapi import HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

from api_schema import QueryResponse
from data_schema import DBSchema
from db import get_projects, get_successful_tasks_by_project

load_dotenv()

RAG_SEMAPHORE = asyncio.Semaphore(3)

async_client = instructor.from_openai(
    AsyncOpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL"),
    ),
    mode=instructor.Mode.TOOLS,
)

fast_model = "google/gemini-2.5-flash"
normal_model = "google/gemini-2.5-flash"


class SingleAnswer(BaseModel):
    note_id: str = Field(description="ID of the source note")
    should_include: bool = Field(
        description="Whether this note include highly relevant information with respect to the answer."
    )
    answer: str = Field(description="Answer with respect to this specific note")


class AggAnswer(BaseModel):
    reasoning: str = Field(description="Reasoning for the aggregated answer")
    answer: str = Field(
        description="The answer to the question by aggregating the separate single answers"
    )


def load_and_validate_notes(project_id: str) -> list[DBSchema]:
    import logging
    logger = logging.getLogger(__name__)

    logger.info(f"Loading and validating notes for project {project_id}")

    projects = get_projects()
    project_exists = any(p["id"] == project_id for p in projects)

    if not project_exists:
        logger.error(f"Project {project_id} not found in available projects")
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    logger.info(f"Project {project_id} found, fetching successful tasks")
    successful_tasks = get_successful_tasks_by_project(project_id)

    if not successful_tasks:
        logger.warning(f"No successful tasks found for project {project_id}")
        raise HTTPException(
            status_code=404,
            detail=f"No successful tasks found for project {project_id}",
        )

    logger.info(f"Found {len(successful_tasks)} successful tasks to process")
    notes = []
    for i, task in enumerate(successful_tasks):
        try:
            logger.debug(f"Processing task {i+1}/{len(successful_tasks)}: {task.get('id', 'unknown')}")

            if "base_content" in task:
                from datetime import datetime

                if isinstance(task.get("created_at"), str):
                    task["created_at"] = datetime.fromisoformat(task["created_at"])
                note = DBSchema(**task)
                logger.debug(f"Successfully parsed task {task.get('id')} using direct DBSchema")
            else:
                from datetime import datetime

                from data_schema import (
                    AuthorProfileModel,
                    BaseContentModel,
                    CommentsModel,
                    LinksModel,
                    MetadataModel,
                )

                note_content = task.get("note_content", {})
                user_profile = task.get("user_profile", {})

                logger.debug(f"Constructing DBSchema for task {task.get('id')} from components")

                note = DBSchema(
                    id=task["id"],
                    project_id=task["project_id"],
                    url=task.get("url"),
                    html=task.get("html"),
                    base_content=BaseContentModel(
                        title=note_content.get("title", ""),
                        content=note_content.get("content", ""),
                        author_name=note_content.get("author_name", ""),
                        publish_date=note_content.get("date", ""),
                    ),
                    links=LinksModel(
                        author_avatar_url=note_content.get("author_avatar_url", ""),
                        author_profile_url=note_content.get("author_profile_url", ""),
                        image_urls=note_content.get("image_urls", []),
                    ),
                    metadata=MetadataModel(
                        tags=note_content.get("tags", []),
                        like_count=note_content.get("like_count", 0),
                        comment_count=note_content.get("comment_count", 0),
                        favorite_count=note_content.get("favorite_count", 0),
                        location=note_content.get("location", "未知"),
                    ),
                    comments=[
                        CommentsModel(
                            comment_content=c.get("comment", ""),
                            comment_author_name=c.get("comment_author_name", ""),
                            comment_publish_date=c.get("comment_publish_date", ""),
                            first_reply_to_comment=c.get("reply_to_comment", ""),
                        )
                        for c in note_content.get("comments", [])
                    ],
                    author_profile=AuthorProfileModel(
                        author_name=user_profile.get("author_name", ""),
                        location=user_profile.get("location", "未知"),
                        author_avatar_url=user_profile.get("author_avatar_url", ""),
                        introduction=user_profile.get("introduction", ""),
                        related_topics=user_profile.get("related_topics", []),
                        interests=user_profile.get("interests", []),
                        careers=[user_profile.get("career", "")]
                        if user_profile.get("career")
                        else [],
                    ),
                    image_assets=task.get("image_assets", []),
                    avatar_asset=task.get("avatar_asset", ""),
                    token_usage=task.get("token_usage", 0),
                    created_at=datetime.fromisoformat(task["created_at"])
                    if isinstance(task["created_at"], str)
                    else task["created_at"],
                    processing_time_seconds=task.get("processing_time_seconds", 0),
                )

                logger.debug(f"Successfully constructed DBSchema for task {task.get('id')}")

            notes.append(note)

        except Exception as e:
            logger.error(f"Failed to parse note {task.get('id', 'unknown')}: {type(e).__name__}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse note {task.get('id', 'unknown')}: {str(e)}",
            )

    logger.info(f"Successfully loaded and validated {len(notes)} notes for project {project_id}")
    return notes


def convert_image_to_data_uri(image_asset_id: str) -> str:
    image_path = Path("./static/assets/images") / f"{image_asset_id}.webp"

    if not image_path.exists():
        raise HTTPException(
            status_code=500, detail=f"Image asset {image_asset_id} not found"
        )

    try:
        with open(image_path, "rb") as image_file:
            base64_str = base64.b64encode(image_file.read()).decode("utf-8")
            return f"data:image/webp;base64,{base64_str}"
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to read image {image_asset_id}: {str(e)}"
        )


def build_multimodal_prompt(note: DBSchema, question: str) -> dict[str, Any]:
    import logging
    logger = logging.getLogger(__name__)

    try:
        logger.debug(f"Building multimodal prompt for note {note.id}")

        base_content_str = note.base_content.model_dump_json()
        comments_str = "\n".join([comment.model_dump_json() for comment in note.comments])

        content_parts = [
            {
                "type": "text",
                "text": f"""<note-id>
{note.id}
</note-id>
<note_content>
{base_content_str}
</note_content>

<comments>
{comments_str}
</comments>

---

Please answer the following question based on this note and the comments, output the answer in specified schema:
{question}""",
            }
        ]

        logger.debug(f"Added text content for note {note.id}")

        if note.image_assets:
            logger.debug(f"Processing {len(note.image_assets)} image assets for note {note.id}")
            for i, image_asset_id in enumerate(note.image_assets):
                try:
                    image_uri = convert_image_to_data_uri(image_asset_id)
                    content_parts.append({"type": "image_url", "image_url": {"url": image_uri}})
                    logger.debug(f"Added image asset {i+1} for note {note.id}")
                except Exception as e:
                    logger.warning(f"Failed to process image asset {image_asset_id} for note {note.id}: {str(e)}")
                    continue
        else:
            logger.debug(f"No image assets found for note {note.id}")

        logger.debug(f"Successfully built multimodal prompt for note {note.id} with {len(content_parts)} content parts")
        return {"role": "user", "content": content_parts}

    except Exception as e:
        logger.error(f"Error building multimodal prompt for note {note.id}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise


async def analyze_single_note(note: DBSchema, question: str) -> SingleAnswer:
    import logging
    logger = logging.getLogger(__name__)

    logger.debug(f"Starting analysis of note {note.id}")

    async with RAG_SEMAPHORE:
        try:
            logger.debug(f"Constructing multimodal prompt for note {note.id}")
            prompt = build_multimodal_prompt(note, question)

            logger.debug(f"Sending API request for note {note.id}")
            response = await async_client.chat.completions.create(
                model=fast_model,
                messages=[prompt],
                response_model=SingleAnswer,
            )

            result = SingleAnswer(
                note_id=note.id,
                should_include=response.should_include,
                answer=response.answer,
            )

            logger.debug(f"Successfully analyzed note {note.id}, should_include: {result.should_include}")
            return result

        except Exception as e:
            logger.error(f"Error analyzing note {note.id}: {type(e).__name__}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=500, detail=f"Failed to analyze note {note.id}: {str(e)}"
            )


async def aggregate_answers(question: str, answers: list[SingleAnswer]) -> str:
    import logging
    logger = logging.getLogger(__name__)

    logger.debug(f"Starting answer aggregation for {len(answers)} answers")

    relevant_answers = [a for a in answers if a.should_include]
    logger.info(f"Found {len(relevant_answers)} relevant answers out of {len(answers)} total")

    if not relevant_answers:
        logger.warning("No relevant answers found for aggregation")
        return "I couldn't find any relevant information in the analyzed notes to answer your question."

    try:
        logger.debug("Constructing aggregation prompt")
        answers_str = "\n".join(
            [f"Note {i + 1}: {answer.answer}" for i, answer in enumerate(relevant_answers)]
        )

        aggregation_prompt = f"""Given the following individual answers with repect to different info sources, please provide a comprehensive aggregated answer to the question.

<individual-answers>
{answers_str}
</individual-answers>

Please synthesize these individual answers and answer the user's question
- in the language of the question.
- output the answer in specified schema.

<user-question>
{question}
</user-question>

Your answer:
"""

        logger.debug("Sending aggregation request to API")
        response = await async_client.chat.completions.create(
            model=normal_model,
            messages=[{"role": "user", "content": aggregation_prompt}],
            response_model=AggAnswer,
        )

        logger.info("Answer aggregation completed successfully")
        return response.answer

    except Exception as e:
        logger.error(f"Error aggregating answers: {type(e).__name__}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to aggregate answers: {str(e)}"
        )


async def query_project_notes(project_id: str, question: str) -> QueryResponse:
    import logging
    logger = logging.getLogger(__name__)

    logger.info(f"Starting query_project_notes for project {project_id}")

    if not question.strip():
        logger.error("Question is empty")
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        logger.info("Loading and validating notes")
        notes = load_and_validate_notes(project_id)
        logger.info(f"Loaded {len(notes)} notes for analysis")

        logger.info("Starting individual note analysis")
        tasks = [analyze_single_note(note, question) for note in notes]
        analyses = await asyncio.gather(*tasks)
        logger.info(f"Completed analysis of {len(analyses)} notes")

        logger.info("Aggregating answers")
        aggregated_answer = await aggregate_answers(question, analyses)
        logger.info("Answer aggregation completed")

        relevant_note_ids = [a.note_id for a in analyses if a.should_include]
        logger.info(f"Found {len(relevant_note_ids)} relevant notes")

        return QueryResponse(answer=aggregated_answer, relevant_note_ids=relevant_note_ids)
    except Exception as e:
        logger.error(f"Error in query_project_notes: {type(e).__name__}: {str(e)}", exc_info=True)
        raise
