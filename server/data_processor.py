import asyncio
from datetime import datetime

from asset_manager import AssetManager
from data_schema import (
    AuthorProfileModel,
    BaseContentModel,
    CommentsModel,
    DBSchema,
    LinksModel,
    MetadataModel,
)
from extractor import extract_note_content, extract_user_profile


async def extract_raw_content(task_url: str = None, task_html: str = None) -> dict:
    """Extract raw content with original duplicates intact"""
    if not task_url and not task_html:
        raise ValueError("either url or html is required for extraction")

    return await extract_note_content(note_url=task_url, note_html=task_html)


async def extract_user_profile_safe(profile_url: str) -> dict:
    """Extract user profile with safe fallback on errors"""
    if not profile_url:
        return get_default_user_profile()

    try:
        return await extract_user_profile(user_url=profile_url)
    except Exception:
        return get_default_user_profile()


def get_default_user_profile() -> dict:
    """Return default user profile for failed extractions"""
    return {
        "location": "未知",
        "author_name": "未知",
        "author_avatar_url": "",
        "introduction": "未知",
        "related_topics": [],
        "interests": [],
        "career": "未知",
    }


def deduplicate_image_urls(image_urls: list[str]) -> list[str]:
    """Remove duplicate URLs while preserving order"""
    if not image_urls:
        return []

    seen = set()
    unique_urls = []
    for url in image_urls:
        if url and url not in seen:
            seen.add(url)
            unique_urls.append(url)
    return unique_urls


def normalize_count_fields(data: dict) -> dict:
    """Ensure count fields are integers, defaulting to 0"""
    data["like_count"] = data.get("like_count") or 0
    data["comment_count"] = data.get("comment_count") or 0
    data["favorite_count"] = data.get("favorite_count") or 0
    return data


def validate_required_fields(data: dict) -> dict:
    """Validate that required fields are present"""
    if not data.get("title"):
        data["title"] = "未知标题"
    if not data.get("content"):
        data["content"] = "未知内容"
    if not data.get("author_name"):
        data["author_name"] = "未知作者"
    return data


def clean_extraction_data(raw_data: dict) -> dict:
    """Transform raw extraction to clean data"""
    if not raw_data:
        raise ValueError("raw_data cannot be empty")

    # Create a copy to avoid mutating input
    clean_data = raw_data.copy()

    # Deduplicate image URLs
    if clean_data.get("image_urls"):
        clean_data["image_urls"] = deduplicate_image_urls(clean_data["image_urls"])

    # Normalize count fields
    clean_data = normalize_count_fields(clean_data)

    # Validate required fields
    clean_data = validate_required_fields(clean_data)

    return clean_data


async def process_image_assets(image_urls: list[str]) -> list[str]:
    """Process image URLs and return asset UUIDs"""
    if not image_urls:
        return []

    asset_manager = AssetManager()
    return await asset_manager.download_and_process_images(image_urls)


async def process_avatar_asset(avatar_url: str) -> str:
    """Process single avatar URL and return asset UUID"""
    if not avatar_url:
        return ""

    asset_manager = AssetManager()
    avatar_uuids = await asset_manager.download_and_process_images([avatar_url])
    return avatar_uuids[0] if avatar_uuids else ""


def format_database_record(
    clean_note: dict,
    user_profile: dict,
    image_assets: list[str],
    avatar_asset: str,
    task_data: dict,
    processing_time: int,
) -> DBSchema:
    """Format clean data into DBSchema component assembly structure"""

    # Extract base content
    base_content = BaseContentModel(
        title=clean_note.get("title", ""),
        content=clean_note.get("content", ""),
        author_name=clean_note.get("author_name", ""),
        publish_date=clean_note.get("date", ""),
    )

    # Extract links
    links = LinksModel(
        author_avatar_url=clean_note.get("author_avatar_url", ""),
        author_profile_url=clean_note.get("author_profile_url", ""),
        image_urls=clean_note.get("image_urls", []),
    )

    # Extract metadata
    metadata = MetadataModel(
        tags=clean_note.get("tags", []),
        like_count=clean_note.get("like_count", 0),
        comment_count=clean_note.get("comment_count", 0),
        favorite_count=clean_note.get("favorite_count", 0),
        location=clean_note.get("location", "未知"),
    )

    # Extract comments
    comments = []
    if clean_note.get("comments"):
        for comment_data in clean_note["comments"]:
            comment = CommentsModel(
                comment_content=comment_data.get("comment", ""),
                comment_author_name=comment_data.get("comment_author_name", ""),
                comment_publish_date=comment_data.get("comment_publish_date", ""),
                first_reply_to_comment=comment_data.get("reply_to_comment", ""),
            )
            comments.append(comment)

    # Extract author profile
    author_profile = AuthorProfileModel(
        author_name=user_profile.get("author_name", ""),
        location=user_profile.get("location", "未知"),
        author_avatar_url=user_profile.get("author_avatar_url", ""),
        introduction=user_profile.get("introduction", ""),
        related_topics=user_profile.get("related_topics", []),
        interests=user_profile.get("interests", []),
        careers=[user_profile.get("career", "")] if user_profile.get("career") else [],
    )

    # Assemble DBSchema
    return DBSchema(
        id=task_data["id"],
        project_id=task_data["project_id"],
        url=task_data.get("url"),
        html=task_data.get("html"),
        base_content=base_content,
        links=links,
        metadata=metadata,
        comments=comments,
        author_profile=author_profile,
        image_assets=image_assets,
        avatar_asset=avatar_asset,
        token_usage=0,
        created_at=datetime.now(),
        processing_time_seconds=processing_time,
    )


async def process_task_to_database(task_data: dict) -> DBSchema:
    """Complete processing pipeline: extract -> transform -> prepare for load"""
    if not task_data:
        raise ValueError("task_data is required")
    if not task_data.get("id"):
        raise ValueError("task_id is required")
    if not task_data.get("project_id"):
        raise ValueError("project_id is required")

    start_time = datetime.now()

    # Extract raw content
    raw_note_content = await extract_raw_content(
        task_url=task_data.get("url"), task_html=task_data.get("html")
    )

    # Transform: clean extraction data
    clean_note_content = clean_extraction_data(raw_note_content)

    # Extract user profile safely
    user_profile = await extract_user_profile_safe(
        clean_note_content.get("author_profile_url")
    )

    # Process image assets
    image_assets = await process_image_assets(clean_note_content.get("image_urls", []))

    # Process avatar asset
    avatar_asset = await process_avatar_asset(
        clean_note_content.get("author_avatar_url", "")
    )

    # Calculate processing time
    processing_time = int((datetime.now() - start_time).total_seconds())

    # Format for database
    return format_database_record(
        clean_note=clean_note_content,
        user_profile=user_profile,
        image_assets=image_assets,
        avatar_asset=avatar_asset,
        task_data=task_data,
        processing_time=processing_time,
    )


if __name__ == "__main__":
    import asyncio

    async def test_data_processor():
        print("Testing data processor components...")

        # Test deduplication
        test_urls = ["url1", "url2", "url1", "url3", "url2"]
        unique_urls = deduplicate_image_urls(test_urls)
        assert unique_urls == ["url1", "url2", "url3"]
        print("✓ URL deduplication working")

        # Test data cleaning
        raw_data = {
            "title": "",
            "content": "test content",
            "like_count": None,
            "comment_count": 5,
            "image_urls": ["img1", "img2", "img1"],
        }

        clean_data = clean_extraction_data(raw_data)
        assert clean_data["title"] == "未知标题"
        assert clean_data["like_count"] == 0
        assert clean_data["comment_count"] == 5
        assert clean_data["image_urls"] == ["img1", "img2"]
        print("✓ Data cleaning working")

        # Test user profile fallback
        profile = await extract_user_profile_safe("")
        assert profile["author_name"] == "未知"
        print("✓ User profile fallback working")

        # Test DBSchema assembly
        test_task_data = {
            "id": "test-123",
            "project_id": "test-project",
            "url": "https://example.com/test",
        }

        db_record = format_database_record(
            clean_note=clean_data,
            user_profile=profile,
            image_assets=["asset-123"],
            avatar_asset="avatar-456",
            task_data=test_task_data,
            processing_time=30,
        )

        assert isinstance(db_record, DBSchema)
        assert db_record.base_content.title == "未知标题"
        assert db_record.author_profile.author_name == "未知"
        assert len(db_record.image_assets) == 1
        assert db_record.avatar_asset == "avatar-456"
        print("✓ DBSchema assembly working")

        print("All data processor tests passed!")

    asyncio.run(test_data_processor())
