import asyncio
import os
from typing import Any, Optional
from urllib.parse import urljoin, urlparse

import instructor
from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig
from dotenv import load_dotenv
from openai import AsyncOpenAI

from data_schema import (
    AuthorProfileModel,
    BaseContentModel,
    CommentsModel,
    LinksModel,
    MetadataModel,
)

load_dotenv()


class InstructorExtractor:
    def __init__(self):
        self.browser_config = BrowserConfig(headless=True)
        self.crawler_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)

        self.client = instructor.from_openai(
            AsyncOpenAI(
                api_key=os.getenv("OPENAI_API_KEY"),
                base_url=os.getenv("OPENAI_BASE_URL"),
            ),
            mode=instructor.Mode.JSON,
        )

        self.fast_model = "google/gemini-2.5-flash-lite"
        self.normal_model = "google/gemini-2.5-flash"

    def get_base_url(self, url: str) -> str:
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}"

    def fix_relative_urls(
        self, links_data: dict[str, Any], base_url: str
    ) -> dict[str, Any]:
        if links_data.get("author_profile_url"):
            links_data["author_profile_url"] = urljoin(
                base_url, links_data["author_profile_url"]
            )

        if links_data.get("author_avatar_url"):
            links_data["author_avatar_url"] = urljoin(
                base_url, links_data["author_avatar_url"]
            )

        if links_data.get("image_urls"):
            fixed_urls = []
            for url in links_data["image_urls"]:
                if url:
                    fixed_urls.append(urljoin(base_url, url))
            links_data["image_urls"] = fixed_urls

        return links_data

    async def process_html_to_formats(self, html: str) -> tuple[str, str]:
        source = f"raw:{html}"

        async with AsyncWebCrawler(config=self.browser_config) as crawler:
            result = await crawler.arun(url=source, config=self.crawler_config)

        if not result.success:
            raise Exception("Failed to process HTML with crawl4ai")

        return result.markdown, result.cleaned_html

    async def extract_base_content(self, markdown: str) -> BaseContentModel:
        response = await self.client.chat.completions.create(
            model=self.fast_model,
            messages=[
                {
                    "role": "system",
                    "content": "Extract basic content from the markdown of a social media post.",
                },
                {"role": "user", "content": markdown},
            ],
            response_model=BaseContentModel,
            temperature=0,
        )
        return response

    async def extract_links(self, html: str) -> LinksModel:
        response = await self.client.chat.completions.create(
            model=self.fast_model,
            messages=[
                {
                    "role": "system",
                    "content": "Extract links from the html of a social media post main body.",
                },
                {"role": "user", "content": html},
            ],
            response_model=LinksModel,
            temperature=0,
        )
        return response

    async def extract_metadata(self, html: str) -> MetadataModel:
        response = await self.client.chat.completions.create(
            model=self.fast_model,
            messages=[
                {
                    "role": "system",
                    "content": "Extract metadata from the html of a social media post.",
                },
                {"role": "user", "content": html},
            ],
            response_model=MetadataModel,
            temperature=0,
        )
        return response

    async def extract_comments(self, html: str) -> list[CommentsModel]:
        try:
            response = await self.client.chat.completions.create(
                model=self.normal_model,
                messages=[
                    {
                        "role": "system",
                        "content": "Extract at most 10 comments from the html of a social media post. For each comment, extract the comment content, author name, publish date, and first reply if any.",
                    },
                    {"role": "user", "content": html},
                ],
                response_model=list[CommentsModel],
                temperature=0,
            )
            return response or []
        except Exception as e:
            print(f"Comment extraction failed, returning empty list: {e}")
            return []

    async def extract_author_profile(self, markdown: str) -> AuthorProfileModel:
        response = await self.client.chat.completions.create(
            model=self.fast_model,
            messages=[
                {
                    "role": "system",
                    "content": "Extract author profile from the markdown of a social media profile page.",
                },
                {"role": "user", "content": markdown},
            ],
            response_model=AuthorProfileModel,
            temperature=0,
        )
        return response

    async def extract_note(
        self, url: Optional[str] = None, html: Optional[str] = None
    ) -> dict[str, Any]:
        if not url and not html:
            raise ValueError("Either url or html must be provided")

        if html:
            markdown, cleaned_html = await self.process_html_to_formats(html)
            base_url = self.get_base_url(url) if url else "https://www.xiaohongshu.com"
        else:
            async with AsyncWebCrawler(config=self.browser_config) as crawler:
                result = await crawler.arun(url=url, config=self.crawler_config)

            if not result.success:
                raise Exception(f"Failed to crawl URL: {url}")

            markdown = result.markdown
            cleaned_html = result.cleaned_html
            base_url = self.get_base_url(url)

        base_content, links, metadata, comments = await asyncio.gather(
            self.extract_base_content(markdown),
            self.extract_links(cleaned_html),
            self.extract_metadata(cleaned_html),
            self.extract_comments(cleaned_html),
        )

        links_dict = links.model_dump()
        links_dict = self.fix_relative_urls(links_dict, base_url)

        comment_list = []
        for comment in comments[:10]:
            comment_list.append(
                {
                    "comment": comment.comment_content,
                    "reply_to_comment": comment.first_reply_to_comment,
                }
            )

        return {
            "title": base_content.title,
            "content": base_content.content,
            "tags": metadata.tags,
            "date": base_content.publish_date,
            "like_count": metadata.like_count,
            "comment_count": metadata.comment_count,
            "favorite_count": metadata.favorite_count,
            "location": metadata.location,
            "image_urls": links_dict["image_urls"],
            "video_urls": [],
            "author_name": base_content.author_name,
            "author_avatar_url": links_dict["author_avatar_url"],
            "author_profile_url": links_dict["author_profile_url"],
            "comments": comment_list,
        }

    async def extract_profile(
        self, url: Optional[str] = None, html: Optional[str] = None
    ) -> dict[str, Any]:
        if not url and not html:
            raise ValueError("Either url or html must be provided")

        if html:
            markdown, _ = await self.process_html_to_formats(html)
        else:
            async with AsyncWebCrawler(config=self.browser_config) as crawler:
                result = await crawler.arun(url=url, config=self.crawler_config)

            if not result.success:
                raise Exception(f"Failed to crawl profile URL: {url}")

            markdown = result.markdown

        profile = await self.extract_author_profile(markdown)

        return {
            "location": profile.location,
            "author_name": profile.author_name,
            "author_avatar_url": profile.author_avatar_url,
            "introduction": profile.introduction,
            "related_topics": profile.related_topics,
            "interests": profile.interests,
            "career": profile.careers[0] if profile.careers else "未知",
        }


_extractor = None


def get_extractor() -> InstructorExtractor:
    global _extractor
    if _extractor is None:
        _extractor = InstructorExtractor()
    return _extractor


async def extract_note_content(note_url: str = None, note_html: str = None) -> dict:
    extractor = get_extractor()
    return await extractor.extract_note(url=note_url, html=note_html)


async def extract_user_profile(user_url: str = None, user_html: str = None) -> dict:
    extractor = get_extractor()
    return await extractor.extract_profile(url=user_url, html=user_html)


if __name__ == "__main__":

    async def test_extractor():
        extractor = InstructorExtractor()

        try:
            with open("example_html.html") as f:
                html_content = f.read()

            print("Testing note extraction with HTML...")
            note_result = await extractor.extract_note(
                url="https://www.xiaohongshu.com/explore/test", html=html_content
            )
            print("✓ Note extraction successful")
            print(f"Title: {note_result['title']}")
            print(f"Images: {len(note_result['image_urls'])}")

        except FileNotFoundError:
            print("example_html.html not found, skipping test")
        except Exception as e:
            print(f"✗ Test failed: {e}")

        print("✓ Instructor extractor implementation complete")

    asyncio.run(test_extractor())
