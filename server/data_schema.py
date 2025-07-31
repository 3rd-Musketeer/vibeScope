from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# Extractor Component Schemas (moved from extractor.py)
class BaseContentModel(BaseModel):
    title: str = Field(default="", description="Title of the post")
    content: str = Field(default="", description="Main content of the post, in markdown format, excluding urls.")
    author_name: str = Field(default="", description="Author name")
    publish_date: str = Field(default="", description="Publish date of the post")

class LinksModel(BaseModel):
    author_avatar_url: str = Field(default="", description="Author avatar url")
    author_profile_url: str = Field(default="", description="Author profile url")
    image_urls: list[str] = Field(default_factory=list, description="Image urls in the post")

class MetadataModel(BaseModel):
    tags: list[str] = Field(default_factory=list, description="Tag words of the post, without `#`")
    like_count: int = Field(default=0, description="Like count of the post")
    comment_count: int = Field(default=0, description="Comment count of the post")
    favorite_count: int = Field(default=0, description="Favorite count of the post")
    location: str = Field(default="未知", description="IP location of the main post")

class CommentsModel(BaseModel):
    comment_content: str = Field(default="", description="Comment content")
    comment_author_name: str = Field(default="", description="Comment author name")
    comment_publish_date: str = Field(default="", description="Comment publish date")
    first_reply_to_comment: str = Field(default="", description="First reply to the comment")

class AuthorProfileModel(BaseModel):
    author_name: str = Field(default="", description="Author name")
    location: str = Field(default="未知", description="IP location of the user")
    author_avatar_url: str = Field(default="", description="Author avatar url")
    introduction: str = Field(default="", description="Introduction of the user")
    related_topics: list[str] = Field(default_factory=list, description="Related topics of the user, at most 3")
    interests: list[str] = Field(default_factory=list, description="Interests of the user, at most 3")
    careers: list[str] = Field(default_factory=list, description="Inferred career of the user")

# Assembly Database Schema
class DBSchema(BaseModel):
    id: str = Field(description="Unique extraction identifier")
    project_id: str = Field(description="Project this extraction belongs to")
    url: Optional[str] = Field(default=None, description="URL of the extracted content")
    html: Optional[str] = Field(default=None, description="HTML content if provided instead of URL")
    base_content: BaseContentModel = Field(description="Core content extraction")
    links: LinksModel = Field(description="URL links and assets")
    metadata: MetadataModel = Field(description="Platform metadata and engagement")
    comments: list[CommentsModel] = Field(description="Comments and replies")
    author_profile: AuthorProfileModel = Field(description="Author profile information")
    image_assets: list[str] = Field(default_factory=list, description="Asset UUIDs for images")
    avatar_asset: str = Field(default="", description="Asset UUID for author avatar")
    token_usage: int = Field(description="LLM token consumption")
    created_at: datetime = Field(description="Extraction timestamp")
    processing_time_seconds: int = Field(description="Processing time excluding wait time")

if __name__ == "__main__":
    from datetime import datetime
    import uuid
    
    # Test BaseContentModel
    base_content = BaseContentModel(
        title="Test Post Title",
        content="This is **markdown** content for testing.",
        author_name="Test Author",
        publish_date="2024-01-15"
    )
    print(f"✓ BaseContentModel validation passed: {base_content.title}")
    
    # Test LinksModel
    links = LinksModel(
        author_avatar_url="https://example.com/avatar.jpg",
        author_profile_url="https://example.com/profile",
        image_urls=["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
    )
    print(f"✓ LinksModel validation passed: {len(links.image_urls)} images")
    
    # Test MetadataModel
    metadata = MetadataModel(
        tags=["test", "validation"],
        like_count=100,
        comment_count=10,
        favorite_count=25,
        location="北京"
    )
    print(f"✓ MetadataModel validation passed: {metadata.like_count} likes")
    
    # Test CommentsModel
    comment = CommentsModel(
        comment_content="Great post!",
        comment_author_name="Commenter",
        comment_publish_date="2024-01-16",
        first_reply_to_comment="Thanks!"
    )
    print(f"✓ CommentsModel validation passed: {comment.comment_content}")
    
    # Test AuthorProfileModel
    author_profile = AuthorProfileModel(
        author_name="Test Author",
        location="上海",
        author_avatar_url="https://example.com/avatar.jpg",
        introduction="I am a test author",
        related_topics=["AI", "Tech", "Programming"],
        interests=["Coding", "Reading"],
        careers=["Engineer", "Developer"]
    )
    print(f"✓ AuthorProfileModel validation passed: {author_profile.author_name}")
    
    # Test DBSchema assembly
    db_record = DBSchema(
        id=str(uuid.uuid4()),
        project_id="test-project",
        url="https://example.com/post/123",
        html=None,
        base_content=base_content,
        links=links,
        metadata=metadata,
        comments=[comment],
        author_profile=author_profile,
        image_assets=["uuid-123", "uuid-456"],
        avatar_asset="avatar-uuid-789",
        token_usage=1500,
        created_at=datetime.now(),
        processing_time_seconds=45
    )
    print(f"✓ DBSchema assembly validation passed: {db_record.id}")
    
    # Test nested access patterns
    print(f"✓ Nested access: title='{db_record.base_content.title}', author='{db_record.author_profile.author_name}'")
    print(f"✓ Component assembly: {len(db_record.comments)} comments, {len(db_record.image_assets)} assets")
    
    print("All data schema validations completed successfully!")