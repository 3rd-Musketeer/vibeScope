import os
import asyncio
import json
from pydantic import BaseModel, Field
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, LLMConfig
from crawl4ai import LLMExtractionStrategy
from crawl4ai import BrowserConfig, CacheMode
from crawl4ai import LLMConfig
from crawl4ai import LLMExtractionStrategy
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
from schema import RedNoteSchema, RedNoteUserProfileSchema
import os
from rich import print

from dotenv import load_dotenv
load_dotenv()

async def extract_with_schema(schema: BaseModel, note_url: str = None, note_html: str = None):

    if note_url and note_html:
        raise ValueError("Only one of note_url or note_html must be provided")
    
    if note_html:
        source = f"raw:{note_html}"
    elif note_url:
        source = note_url
    else:
        raise ValueError("Either note_url or note_html must be provided")

    browser_config = BrowserConfig(headless=True)
    extra_args = {"temperature": 0}
    crawler_config = CrawlerRunConfig(
        cache_mode=CacheMode.BYPASS,
        word_count_threshold=1,
        page_timeout=80000,
        extraction_strategy=LLMExtractionStrategy(
            llm_config = LLMConfig(
                provider=os.getenv("OPENAI_MODEL"),
                api_token=os.getenv("OPENAI_API_KEY"),
                base_url=os.getenv("OPENAI_BASE_URL")
            ),
            schema=schema.model_json_schema(),
            extraction_type="schema",
            instruction="Extract fields specified in the schema from the provided HTML.",
            extra_args=extra_args,
            input_format="html",
        ),
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(
            url=source, config=crawler_config
        )

    return json.loads(result.extracted_content)[0]

async def extract_note_content(note_url: str = None, note_html: str = None):
    return await extract_with_schema(RedNoteSchema, note_url, note_html)

async def extract_user_profile(user_url: str = None, user_html: str = None):
    return await extract_with_schema(RedNoteUserProfileSchema, user_url, user_html)