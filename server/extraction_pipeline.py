import os
import asyncio
import json
from urllib.parse import urljoin, urlparse
from typing import Dict, Any, Optional
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, LLMConfig, BrowserConfig, CacheMode
from crawl4ai import LLMExtractionStrategy
from schema import (
    BaseContentModel, LinksModel, MetadataModel, CommentsModel, AuthorProfileModel,
    RedNoteSchema, RedNoteCommentSchema, RedNoteUserProfileSchema
)
from dotenv import load_dotenv

load_dotenv()

class ExtractionPipeline:
    def __init__(self):
        self.browser_config = BrowserConfig(headless=True)
        self.crawler_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)
        
        # LLM configurations
        self.normal_llm_config = LLMConfig(
            provider=os.getenv("OPENAI_MODEL", "openrouter/google/gemini-2.5-flash"),
            api_token=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL")
        )
        
        self.fast_llm_config = LLMConfig(
            provider="openrouter/google/gemini-2.5-flash-lite",
            api_token=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL")
        )
        
        # Extraction strategies
        self.base_extractor = LLMExtractionStrategy(
            llm_config=self.fast_llm_config,
            schema=BaseContentModel.model_json_schema(),
            extraction_type="schema",
            instruction="Extract basic content from the markdown of a social media post.",
            extra_args={"temperature": 0},
            input_format="markdown",
        )
        
        self.metadata_extractor = LLMExtractionStrategy(
            llm_config=self.fast_llm_config,
            schema=MetadataModel.model_json_schema(),
            extraction_type="schema",
            instruction="Extract metadata from the html of a social media post.",
            extra_args={"temperature": 0},
            input_format="html",
        )
        
        self.comments_extractor = LLMExtractionStrategy(
            llm_config=self.normal_llm_config,
            schema=CommentsModel.model_json_schema(),
            extraction_type="schema",
            instruction="Extract at most 10 comments from the html of a social media post.",
            extra_args={"temperature": 0},
            input_format="html",
        )
        
        self.links_extractor = LLMExtractionStrategy(
            llm_config=self.fast_llm_config,
            schema=LinksModel.model_json_schema(),
            extraction_type="schema",
            instruction="Extract links from the html of a social media post main body, output only one JSON result.",
            extra_args={"temperature": 0},
            input_format="markdown",
        )
        
        # Profile extractor for user profile pages
        self.profile_extractor = LLMExtractionStrategy(
            llm_config=self.fast_llm_config,
            schema=AuthorProfileModel.model_json_schema(),
            extraction_type="schema",
            instruction="Extract author profile from the html of a social media profile page.",
            extra_args={"temperature": 0},
            input_format="markdown",
        )
    
    def get_base_url(self, url: str) -> str:
        """Extract base URL from the original request URL"""
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}"
    
    def fix_relative_urls(self, links_data: Dict[str, Any], base_url: str) -> Dict[str, Any]:
        """Fix relative URLs using urllib.parse for robust handling"""
        # Ensure all URL fields exist with proper defaults
        links_data.setdefault("author_profile_url", "")
        links_data.setdefault("author_avatar_url", "")
        links_data.setdefault("image_urls", [])
        
        # Fix relative URLs if they exist and are not empty
        if links_data["author_profile_url"]:
            links_data["author_profile_url"] = urljoin(base_url, links_data["author_profile_url"])
        
        if links_data["author_avatar_url"]:
            links_data["author_avatar_url"] = urljoin(base_url, links_data["author_avatar_url"])
        
        if links_data["image_urls"]:
            fixed_urls = []
            for url in links_data["image_urls"]:
                if url:  # Only process non-empty URLs
                    fixed_urls.append(urljoin(base_url, url))
                else:
                    fixed_urls.append("")  # Keep empty strings as empty strings
            links_data["image_urls"] = fixed_urls
        
        return links_data
    
    async def process_html_to_formats(self, html: str) -> tuple[str, str]:
        """Process HTML with crawl4ai to get markdown and cleaned_html"""
        source = f"raw:{html}"
        
        async with AsyncWebCrawler(config=self.browser_config) as crawler:
            result = await crawler.arun(url=source, config=self.crawler_config)
        
        if not result.success:
            raise Exception("Failed to process HTML with crawl4ai")
        
        return result.markdown, result.cleaned_html
    
    async def extract_base_content(self, markdown: str) -> Dict[str, Any]:
        """Extract base content from markdown"""
        source = f"raw:{markdown}"
        
        async with AsyncWebCrawler(config=self.browser_config) as crawler:
            result = await crawler.arun(
                url=source, 
                config=self.crawler_config.clone(extraction_strategy=self.base_extractor)
            )
        
        if not result.success:
            raise Exception("Failed to extract base content")
        
        return json.loads(result.extracted_content)[0]
    
    async def extract_metadata(self, html: str) -> Dict[str, Any]:
        """Extract metadata from HTML"""
        source = f"raw:{html}"
        
        async with AsyncWebCrawler(config=self.browser_config) as crawler:
            result = await crawler.arun(
                url=source,
                config=self.crawler_config.clone(extraction_strategy=self.metadata_extractor)
            )
        
        if not result.success:
            raise Exception("Failed to extract metadata")
        
        return json.loads(result.extracted_content)[0]
    
    async def extract_comments(self, html: str) -> list[Dict[str, Any]]:
        """Extract comments from HTML"""
        source = f"raw:{html}"
        
        async with AsyncWebCrawler(config=self.browser_config) as crawler:
            result = await crawler.arun(
                url=source,
                config=self.crawler_config.clone(extraction_strategy=self.comments_extractor)
            )
        
        if not result.success:
            raise Exception("Failed to extract comments")
        
        return json.loads(result.extracted_content)
    
    async def extract_links(self, markdown: str) -> Dict[str, Any]:
        """Extract links from markdown"""
        source = f"raw:{markdown}"
        
        async with AsyncWebCrawler(config=self.browser_config) as crawler:
            result = await crawler.arun(
                url=source,
                config=self.crawler_config.clone(extraction_strategy=self.links_extractor)
            )
        
        if not result.success:
            raise Exception("Failed to extract links")
        
        return json.loads(result.extracted_content)[0]
    
    async def extract_parallel(self, markdown: str, html: str) -> Dict[str, Any]:
        """Run all extractions in parallel"""
        tasks = [
            self.extract_base_content(markdown),
            self.extract_metadata(html),
            self.extract_comments(html),
            self.extract_links(markdown)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Check for exceptions
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                task_names = ["base_content", "metadata", "comments", "links"]
                raise Exception(f"Failed to extract {task_names[i]}: {str(result)}")
        
        return {
            "base_content": results[0],
            "metadata": results[1], 
            "comments": results[2],
            "links": results[3]
        }
    
    def normalize_null_values(self, data: Any) -> Any:
        """Recursively normalize null-like values to None for Pydantic defaults"""
        if data is None or data == "null" or data == "NULL":
            return None
        elif isinstance(data, dict):
            return {k: self.normalize_null_values(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self.normalize_null_values(item) for item in data]
        else:
            return data
    
    def adapt_to_legacy_schema(self, pipeline_results: Dict[str, Any]) -> RedNoteSchema:
        """Convert pipeline results to legacy RedNoteSchema format"""
        # Normalize all null-like values first
        base = self.normalize_null_values(pipeline_results["base_content"])
        metadata = self.normalize_null_values(pipeline_results["metadata"])
        links = self.normalize_null_values(pipeline_results["links"])
        comments = self.normalize_null_values(pipeline_results["comments"])
        
        # Adapt comments to legacy format
        legacy_comments = []
        for comment in comments:
            # Handle comment data normalization
            comment_data = {}
            if comment.get("comment_content") is not None:
                comment_data["comment"] = comment["comment_content"]
            if comment.get("first_reply_to_comment") is not None:
                comment_data["reply_to_comment"] = comment["first_reply_to_comment"]
            
            legacy_comments.append(RedNoteCommentSchema(**comment_data))
        
        # Build data dict, letting Pydantic handle defaults for None values
        clean_data = {
            # Base content fields (map publish_date to date)
            "title": base.get("title"),
            "content": base.get("content"), 
            "author_name": base.get("author_name"),
            "date": base.get("publish_date"),
            
            # Metadata fields
            "tags": metadata.get("tags"),
            "like_count": metadata.get("like_count"),
            "comment_count": metadata.get("comment_count"),
            "favorite_count": metadata.get("favorite_count"),
            "location": metadata.get("location"),
            
            # Links fields
            "image_urls": links.get("image_urls"),
            "author_avatar_url": links.get("author_avatar_url"),
            "author_profile_url": links.get("author_profile_url"),
            
            # Always empty video_urls and processed comments
            "video_urls": [],
            "comments": legacy_comments
        }
        
        # Remove None values to let Pydantic defaults handle them
        clean_data = {k: v for k, v in clean_data.items() if v is not None}
        
        return RedNoteSchema(**clean_data)
    
    async def extract(self, url: Optional[str] = None, html: Optional[str] = None) -> RedNoteSchema:
        """
        Main extraction method - drop-in replacement for old extractor
        
        Two modes:
        1. Traditional mode: url-only -> fetch HTML -> extract (backward compatible)
        2. Extension mode: url + html -> use provided HTML -> extract (new feature)
        """
        if not url and not html:
            raise ValueError("Either url or html must be provided")
        
        # Determine base URL for relative link fixing
        if url:
            base_url = self.get_base_url(url)
        else:
            raise ValueError("URL is required for base URL extraction")
        
        # Mode 1: Traditional - URL only (backward compatibility)
        if url and not html:
            # Use traditional crawling to get HTML
            async with AsyncWebCrawler(config=self.browser_config) as crawler:
                result = await crawler.arun(url=url, config=self.crawler_config)
            
            if not result.success:
                raise Exception("Failed to crawl URL")
            
            markdown = result.markdown
            cleaned_html = result.cleaned_html
        
        # Mode 2: Extension - URL + HTML provided
        else:
            # Use provided HTML, process with crawl4ai to get markdown and clean HTML
            markdown, cleaned_html = await self.process_html_to_formats(html)
        
        # Run parallel extractions on the processed content
        pipeline_results = await self.extract_parallel(markdown, cleaned_html)
        
        # Fix relative URLs in links using base URL
        pipeline_results["links"] = self.fix_relative_urls(pipeline_results["links"], base_url)
        
        # Convert to legacy schema format for backward compatibility
        return self.adapt_to_legacy_schema(pipeline_results)
    
    async def extract_profile(self, profile_url: str) -> RedNoteUserProfileSchema:
        """
        Extract user profile from profile URL
        Traditional mode only - profiles typically don't need extension mode
        """
        async with AsyncWebCrawler(config=self.browser_config) as crawler:
            result = await crawler.arun(
                url=profile_url,
                config=self.crawler_config.clone(extraction_strategy=self.profile_extractor)
            )
        
        if not result.success:
            raise Exception("Failed to extract user profile")
        
        profile_data = self.normalize_null_values(json.loads(result.extracted_content)[0])
        
        # Convert new AuthorProfileModel to legacy RedNoteUserProfileSchema format
        clean_profile_data = {
            "location": profile_data.get("location"),
            "author_name": profile_data.get("author_name"),
            "author_avatar_url": profile_data.get("author_avatar_url"),
            "introduction": profile_data.get("introduction"),
            "related_topics": profile_data.get("related_topics"),
            "interests": profile_data.get("interests"),
        }
        
        # Handle careers list to single career conversion
        careers_list = profile_data.get("careers", [])
        if careers_list and len(careers_list) > 0:
            clean_profile_data["career"] = careers_list[0]
        
        # Remove None values to let Pydantic defaults handle them
        clean_profile_data = {k: v for k, v in clean_profile_data.items() if v is not None}
        
        return RedNoteUserProfileSchema(**clean_profile_data)

# Global pipeline instance for backward compatibility
_pipeline = None

def get_pipeline() -> ExtractionPipeline:
    """Get or create the global pipeline instance"""
    global _pipeline
    if _pipeline is None:
        _pipeline = ExtractionPipeline()
    return _pipeline

async def extract_note_content(note_url: str = None, note_html: str = None) -> dict:
    """Legacy compatibility function"""
    pipeline = get_pipeline()
    result = await pipeline.extract(url=note_url, html=note_html)
    return result.model_dump()

async def extract_user_profile(user_url: str = None, user_html: str = None) -> dict:
    """Legacy compatibility function for user profile extraction"""
    if not user_url and not user_html:
        raise ValueError("Either user_url or user_html must be provided")
    
    if user_url and user_html:
        raise ValueError("Only one of user_url or user_html must be provided")
    
    pipeline = get_pipeline()
    
    try:
        if user_url:
            # Use traditional URL-based profile extraction
            result = await pipeline.extract_profile(user_url)
            return result.model_dump()
        else:
            # HTML-based profile extraction not implemented yet, return default
            return {
                "location": "未知",
                "author_name": "未知",
                "author_avatar_url": "",
                "introduction": "未知", 
                "related_topics": [],
                "interests": [],
                "career": "未知"
            }
    except Exception:
        # Fallback to default profile on any extraction failure
        return {
            "location": "未知",
            "author_name": "未知",
            "author_avatar_url": "",
            "introduction": "未知", 
            "related_topics": [],
            "interests": [],
            "career": "未知"
        }

if __name__ == "__main__":
    async def test_pipeline():
        print("Testing ExtractionPipeline...")
        
        pipeline = ExtractionPipeline()
        
        # Test with example HTML file
        try:
            with open("example_html.html", "r") as f:
                html_content = f.read()
            
            test_url = "https://www.xiaohongshu.com/explore/683ad1d200000000230100d5"
            
            result = await pipeline.extract(url=test_url, html=html_content)
            print(f"✓ Extraction successful: {result.title}")
            print(f"✓ Author: {result.author_name}")
            print(f"✓ Tags: {result.tags}")
            print(f"✓ Images: {len(result.image_urls)} images")
            print(f"✓ Comments: {len(result.comments)} comments")
            
        except FileNotFoundError:
            print("example_html.html not found, skipping test")
        except Exception as e:
            print(f"✗ Test failed: {e}")
    
    asyncio.run(test_pipeline())