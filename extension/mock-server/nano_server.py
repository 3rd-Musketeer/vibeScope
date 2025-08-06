#!/usr/bin/env python3
"""
Nano Extractor FastAPI Server - Clean HTTP API for testing extension workflow
Uses crawl4ai + instructor for basic content extraction
"""
import asyncio
import logging
import os
from typing import Optional

import instructor
from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress crawl4ai verbose logs
logging.getLogger("crawl4ai").setLevel(logging.WARNING)


class ExtractRequest(BaseModel):
    """Request model for extraction"""
    html: str = Field(..., description="HTML content to extract")
    url: Optional[str] = Field(None, description="Optional URL for context")


class BaseContentModel(BaseModel):
    """Minimal content model for MVP testing"""
    title: str = Field(default="", description="Title of the post")
    content: str = Field(
        default="",
        description="Main content of the post, in markdown format, excluding urls.",
    )
    author_name: str = Field(default="", description="Author name")
    publish_date: str = Field(default="", description="Publish date of the post")


class ExtractResponse(BaseModel):
    """Response model for extraction"""
    title: str
    content: str
    author_name: str
    publish_date: str
    extraction_method: str = "nano_extractor_mvp"
    html_length: int
    markdown_length: int


class NanoExtractor:
    """Minimal extractor using crawl4ai + instructor"""
    
    def __init__(self):
        # Initialize crawl4ai
        self.browser_config = BrowserConfig(headless=True)
        self.crawler_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)
        
        # Initialize instructor client
        self.client = instructor.from_openai(
            AsyncOpenAI(
                api_key=os.getenv("OPENAI_API_KEY"),
                base_url=os.getenv("OPENAI_BASE_URL"),
            ),
            mode=instructor.Mode.JSON,
        )
        
        # Use fast model for MVP
        self.model = "google/gemini-2.5-flash"
    
    async def html_to_markdown(self, html: str) -> str:
        """Process HTML to markdown using crawl4ai"""
        source = f"raw:{html}"
        
        async with AsyncWebCrawler(config=self.browser_config) as crawler:
            result = await crawler.arun(url=source, config=self.crawler_config)
        
        if not result.success:
            raise Exception("Failed to process HTML with crawl4ai")
        
        return result.markdown
    
    async def extract_content(self, markdown: str) -> BaseContentModel:
        """Extract basic content using instructor"""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "Extract basic content from the markdown of a social media post or webpage. Focus on the main title, content, author, and publish date if available."
                },
                {"role": "user", "content": markdown}
            ],
            response_model=BaseContentModel,
            temperature=0,
        )
        return response
    
    async def extract(self, html: str, url: Optional[str] = None) -> ExtractResponse:
        """Main extraction method - MVP version"""
        if not html:
            raise ValueError("HTML is required for nano extractor")
        
        logger.info(f"Processing {len(html)} chars of HTML")
        
        # Step 1: Convert HTML to markdown
        markdown = await self.html_to_markdown(html)
        logger.info(f"Generated {len(markdown)} chars of markdown")
        
        # Step 2: Extract content with instructor
        content = await self.extract_content(markdown)
        logger.info(f"Extracted: {content.title[:50]}...")
        
        # Return structured response
        return ExtractResponse(
            title=content.title,
            content=content.content,
            author_name=content.author_name,
            publish_date=content.publish_date,
            html_length=len(html),
            markdown_length=len(markdown)
        )


# Initialize FastAPI app
app = FastAPI(
    title="Nano Extractor Server",
    description="Minimal MVP extractor using crawl4ai + instructor",
    version="1.0.0"
)

# Global extractor instance
extractor = NanoExtractor()


@app.get("/")
async def health_check():
    """Health check endpoint"""
    return {
        "message": "Nano Extractor Server",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "GET / - Health check",
            "POST /extract - Extract content from HTML"
        ]
    }


@app.post("/extract", response_model=ExtractResponse)
async def extract_content(request: ExtractRequest):
    """Extract content from HTML"""
    try:
        result = await extractor.extract(request.html, request.url)
        return result
    except Exception as e:
        logger.error(f"Extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    
    # Check environment
    if not os.getenv("OPENAI_API_KEY"):
        logger.error("OPENAI_API_KEY not found in environment")
        exit(1)
    
    logger.info("🚀 Starting Nano Extractor Server...")
    logger.info("📍 Server will run on http://localhost:3002")
    logger.info("📖 API docs: http://localhost:3002/docs")
    
    uvicorn.run(app, host="127.0.0.1", port=3002, log_level="info")