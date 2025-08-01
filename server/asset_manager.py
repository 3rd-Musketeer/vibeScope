import asyncio
import hashlib
import io
import os
import uuid

import httpx
from PIL import Image


class URLDeduplicator:
    def __init__(self):
        self.url_to_uuid: dict[str, str] = {}
        self.content_hashes: dict[str, str] = {}

    def get_url_hash(self, url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()  # noqa: S324

    def get_content_hash(self, content: bytes) -> str:
        return hashlib.sha256(content).hexdigest()

    def get_uuid_for_url(self, url: str) -> str | None:
        url_hash = self.get_url_hash(url)
        return self.url_to_uuid.get(url_hash)

    def register_url_uuid(self, url: str, asset_uuid: str) -> None:
        url_hash = self.get_url_hash(url)
        self.url_to_uuid[url_hash] = asset_uuid

    def is_content_duplicate(self, content: bytes) -> str | None:
        content_hash = self.get_content_hash(content)
        return self.content_hashes.get(content_hash)

    def register_content(self, content: bytes, asset_uuid: str) -> str:
        content_hash = self.get_content_hash(content)
        self.content_hashes[content_hash] = asset_uuid
        return content_hash


def convert_to_webp(image_data: bytes, quality: int = 80) -> bytes:
    image = Image.open(io.BytesIO(image_data))

    if image.mode == "RGBA":
        image = image.convert("RGB")

    output = io.BytesIO()
    image.save(output, format="WebP", quality=quality, optimize=True)
    return output.getvalue()


def create_thumbnail(
    image_data: bytes, max_size: tuple[int, int] = (300, 300), quality: int = 60
) -> bytes:
    image = Image.open(io.BytesIO(image_data))

    if image.mode == "RGBA":
        image = image.convert("RGB")

    image.thumbnail(max_size, Image.Resampling.LANCZOS)

    output = io.BytesIO()
    image.save(output, format="WebP", quality=quality, optimize=True)
    return output.getvalue()


async def process_image_to_webp(image_data: bytes) -> tuple[bytes, bytes]:
    webp_data = await asyncio.to_thread(convert_to_webp, image_data)
    thumbnail_data = await asyncio.to_thread(create_thumbnail, image_data)
    return webp_data, thumbnail_data


class AssetManager:
    def __init__(self):
        self.deduplicator = URLDeduplicator()
        self.images_dir = "static/assets/images"
        self.thumbnails_dir = "static/assets/thumbnails"

        os.makedirs(self.images_dir, exist_ok=True)
        os.makedirs(self.thumbnails_dir, exist_ok=True)

    async def download_and_process_images(self, image_urls: list[str]) -> list[str]:
        # Order-preserving deduplication
        seen = set()
        unique_urls = []
        for url in image_urls:
            if url not in seen:
                seen.add(url)
                unique_urls.append(url)

        asset_uuids = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            for url in unique_urls:
                existing_uuid = self.deduplicator.get_uuid_for_url(url)
                if existing_uuid:
                    asset_uuids.append(existing_uuid)
                    continue

                try:
                    response = await client.get(url)
                    response.raise_for_status()
                    image_data = response.content

                    existing_uuid = self.deduplicator.is_content_duplicate(image_data)
                    if existing_uuid:
                        asset_uuids.append(existing_uuid)
                        self.deduplicator.register_url_uuid(url, existing_uuid)
                        continue

                    asset_uuid = str(uuid.uuid4())

                    webp_data, thumbnail_data = await process_image_to_webp(image_data)

                    image_path = os.path.join(self.images_dir, f"{asset_uuid}.webp")
                    thumbnail_path = os.path.join(
                        self.thumbnails_dir, f"{asset_uuid}.webp"
                    )

                    with open(image_path, "wb") as f:
                        f.write(webp_data)

                    with open(thumbnail_path, "wb") as f:
                        f.write(thumbnail_data)

                    self.deduplicator.register_content(image_data, asset_uuid)
                    self.deduplicator.register_url_uuid(url, asset_uuid)
                    asset_uuids.append(asset_uuid)

                except Exception as e:
                    print(f"Failed to download {url}: {e}")
                    continue

        return asset_uuids


if __name__ == "__main__":
    import tempfile

    async def test_components():
        print("Testing asset management components...")

        dedup = URLDeduplicator()
        test_url1 = "https://example.com/image1.jpg"
        test_content1 = b"test image content 1"

        assert dedup.get_uuid_for_url(test_url1) is None
        dedup.register_url_uuid(test_url1, "uuid-456")
        assert dedup.get_uuid_for_url(test_url1) == "uuid-456"

        assert dedup.is_content_duplicate(test_content1) is None
        dedup.register_content(test_content1, "uuid-123")
        assert dedup.is_content_duplicate(test_content1) == "uuid-123"

        print("✓ Deduplication validated")

        async with httpx.AsyncClient() as client:
            response = await client.get("https://httpbin.org/image/jpeg")
            image_data = response.content

        original_size = len(image_data)
        webp_data, thumbnail_data = await process_image_to_webp(image_data)

        print(
            f"✓ Compression: {len(webp_data) / original_size:.1%} original, thumbnail: {len(thumbnail_data) / original_size:.1%}"
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            os.chdir(temp_dir)

            manager = AssetManager()
            test_urls = [
                "https://httpbin.org/image/jpeg",
                "https://httpbin.org/image/png",
                "https://httpbin.org/image/jpeg",
            ]

            asset_uuids = await manager.download_and_process_images(test_urls)

            assert len(set(asset_uuids)) == 2, (
                "Should have 2 unique assets after deduplication"
            )

            for asset_uuid in asset_uuids:
                image_path = f"static/assets/images/{asset_uuid}.webp"
                thumbnail_path = f"static/assets/thumbnails/{asset_uuid}.webp"
                assert os.path.exists(image_path)
                assert os.path.exists(thumbnail_path)

        print("✓ End-to-end asset management validated successfully!")

    asyncio.run(test_components())
