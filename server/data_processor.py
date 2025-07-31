import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime

from extractor import extract_note_content, extract_user_profile
from asset_manager import AssetManager


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
        "career": "未知"
    }


def deduplicate_image_urls(image_urls: List[str]) -> List[str]:
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


async def process_image_assets(image_urls: List[str]) -> List[str]:
    """Process image URLs and return asset UUIDs"""
    if not image_urls:
        return []
    
    asset_manager = AssetManager()
    return await asset_manager.download_and_process_images(image_urls)


def format_database_record(clean_note: dict, user_profile: dict, image_assets: List[str], task_data: dict, processing_time: int) -> dict:
    """Format clean data into database record structure"""
    return {
        "id": task_data["id"],
        "project_id": task_data["project_id"],
        "url": task_data.get("url"),
        "html": task_data.get("html"),
        "note_content": clean_note,
        "user_profile": user_profile,
        "image_assets": image_assets,
        "token_usage": 0,
        "created_at": datetime.now().isoformat(),
        "processing_time_seconds": processing_time
    }


async def process_task_to_database(task_data: dict) -> dict:
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
        task_url=task_data.get("url"),
        task_html=task_data.get("html")
    )
    
    # Transform: clean extraction data
    clean_note_content = clean_extraction_data(raw_note_content)
    
    # Extract user profile safely
    user_profile = await extract_user_profile_safe(
        clean_note_content.get("author_profile_url")
    )
    
    # Process image assets
    image_assets = await process_image_assets(
        clean_note_content.get("image_urls", [])
    )
    
    # Calculate processing time
    processing_time = int((datetime.now() - start_time).total_seconds())
    
    # Format for database
    return format_database_record(
        clean_note=clean_note_content,
        user_profile=user_profile, 
        image_assets=image_assets,
        task_data=task_data,
        processing_time=processing_time
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
            "image_urls": ["img1", "img2", "img1"]
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
        
        print("All data processor tests passed!")
    
    asyncio.run(test_data_processor())