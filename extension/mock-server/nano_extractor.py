#!/usr/bin/env python3
"""
Nano Extractor Server - Minimal MVP for testing extension workflow
Uses crawl4ai + instructor for basic content extraction
"""
import asyncio
import json
import logging
import os
import sys
from typing import Optional

import instructor
from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig
from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# Configure logging to stderr to avoid JSON pollution
logging.basicConfig(
    level=logging.WARNING,  # Suppress crawl4ai logs
    format='%(levelname)s: %(message)s',
    stream=sys.stderr
)


class BaseContentModel(BaseModel):
    """Minimal content model for MVP testing"""
    title: str = Field(default="", description="Title of the post")
    content: str = Field(
        default="",
        description="Main content of the post, in markdown format, excluding urls.",
    )
    author_name: str = Field(default="", description="Author name")
    publish_date: str = Field(default="", description="Publish date of the post")


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
    
    async def extract(self, html: Optional[str] = None, url: Optional[str] = None) -> dict:
        """Main extraction method - MVP version"""
        if not html:
            raise ValueError("HTML is required for nano extractor")
        
        # Step 1: Convert HTML to markdown (logs go to stderr)
        sys.stderr.write("🔄 Processing HTML with crawl4ai...\n")
        sys.stderr.flush()
        markdown = await self.html_to_markdown(html)
        sys.stderr.write(f"✅ Generated {len(markdown)} chars of markdown\n")
        sys.stderr.flush()
        
        # Step 2: Extract content with instructor (logs go to stderr)
        sys.stderr.write("🤖 Extracting content with instructor...\n")
        sys.stderr.flush()
        content = await self.extract_content(markdown)
        sys.stderr.write(f"✅ Extracted: {content.title[:50]}...\n")
        sys.stderr.flush()
        
        # Return simple dict for compatibility
        return {
            "title": content.title,
            "content": content.content,
            "author_name": content.author_name,
            "publish_date": content.publish_date,
            "extraction_method": "nano_extractor_mvp",
            "html_length": len(html),
            "markdown_length": len(markdown)
        }


async def extract_content(html: str, url: Optional[str] = None) -> dict:
    """Simple function interface for testing"""
    extractor = NanoExtractor()
    return await extractor.extract(html=html, url=url)


async def cli_extract(html: str, url: Optional[str] = None):
    """CLI mode - clean JSON output to stdout, logs to stderr"""
    try:
        result = await extract_content(html, url)
        # Output clean JSON to stdout only
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        # Error details go to stderr
        error_details = {
            "error": str(e),
            "type": type(e).__name__
        }
        sys.stderr.write(f"ERROR: {json.dumps(error_details)}\n")
        sys.exit(1)


if __name__ == "__main__":
    # Check if running in CLI mode (with arguments)
    if len(sys.argv) > 1 and sys.argv[1] == "cli":
        # CLI mode: expect HTML from stdin or as argument
        if len(sys.argv) > 2:
            html_content = sys.argv[2]
            url_arg = sys.argv[3] if len(sys.argv) > 3 else None
            asyncio.run(cli_extract(html_content, url_arg))
        else:
            # Read from stdin
            html_content = sys.stdin.read()
            asyncio.run(cli_extract(html_content))
    else:
        # Test mode
        async def test():
            sys.stderr.write("🧪 Testing Nano Extractor...\n")
            
            # Test HTML
            test_html = """
            <html>
            <head><title>Test Article</title></head>
            <body>
                <h1>AI Research Breakthrough</h1>
                <div class="author">By Dr. Smith</div>
                <div class="date">2024-01-15</div>
                <p>This is a groundbreaking study about artificial intelligence...</p>
                <p>The research shows significant improvements in model performance.</p>
            </body>
            </html>
            """
            
            try:
                result = await extract_content(test_html)
                sys.stderr.write("✅ Test successful!\n")
                sys.stderr.write(f"Title: {result['title']}\n")
                sys.stderr.write(f"Author: {result['author_name']}\n")
                sys.stderr.write(f"Content: {result['content'][:100]}...\n")
                # Also output clean JSON for testing
                print(json.dumps(result, ensure_ascii=False, indent=2))
            except Exception as e:
                sys.stderr.write(f"❌ Test failed: {e}\n")
                sys.exit(1)
        
        asyncio.run(test())