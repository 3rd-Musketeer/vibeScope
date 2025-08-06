#!/bin/bash
# Setup script for Nano Extractor FastAPI Server

echo "🚀 Setting up Nano Extractor FastAPI Server..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ python3 not found. Please install Python 3.8+"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📥 Installing requirements (FastAPI + uvicorn + crawl4ai + instructor)..."
pip install -r requirements.txt

echo "✅ Nano Extractor FastAPI Server setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your .env file to this directory: cp ../../server/.env ."
echo "2. Test extraction server: python3 nano_server.py"
echo "3. In another terminal, start mock server: npm start"
echo "4. Test workflow at: http://localhost:3001/debug"
echo ""
echo "🔧 Environment needed in .env:"
echo "   OPENAI_API_KEY=your_key_here"
echo "   OPENAI_BASE_URL=https://your_base_url"
echo ""
echo "🌐 Servers:"
echo "   📊 Mock Server (Extension + Debug): http://localhost:3001"
echo "   🔬 Nano Extractor API: http://localhost:3002"
echo "   📖 API docs: http://localhost:3002/docs"