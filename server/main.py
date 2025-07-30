import os
from dotenv import load_dotenv

def validate_environment() -> None:
    load_dotenv()
    
    required_env_vars = ["OPENAI_API_KEY", "OPENAI_BASE_URL", "OPENAI_MODEL"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        raise ValueError(f"missing required environment variables: {missing_vars}")
    
    print("✓ Environment validation passed")

def main() -> None:
    validate_environment()
    
    from db import init_db
    init_db()
    print("✓ Database initialized")
    
    import uvicorn
    print("🚀 Starting FastAPI server...")
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

if __name__ == "__main__":
    main()