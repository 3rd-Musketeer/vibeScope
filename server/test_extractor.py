from extractor import extract_note_content, extract_user_profile
from rich import print
import asyncio

async def main():
    url = "https://www.xiaohongshu.com/explore/687a59490000000012017a1c?xsec_token=ABkS_INyyDGbEsb3G1S0LHpumG1KhYU6j0M1n24j5eyHM=&xsec_source=pc_feed"

    with open("example_html.html", "r") as f:
        html = f.read()

    note_content = await extract_note_content(note_html=html)
    print(note_content)

    author_profile_url = note_content["author_profile_url"]
    print(author_profile_url)

    user_profile = await extract_user_profile(user_url=author_profile_url)
    print(user_profile)

if __name__ == "__main__":
    asyncio.run(main())