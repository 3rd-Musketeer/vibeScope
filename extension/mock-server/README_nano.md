# 🔬 Nano Extractor FastAPI Server - MVP Testing

Minimal FastAPI server using crawl4ai + instructor for testing extension workflow with clean HTTP API.

## 🚀 Quick Setup

```bash
# 1. Setup nano extractor server
./setup_nano.sh

# 2. Copy your .env file here
cp ../../server/.env .

# 3. Start nano extractor FastAPI server
python3 nano_server.py

# 4. In another terminal, start mock server
npm start
```

## 📋 What It Does

### 🔄 **Processing Pipeline**
1. **HTTP API**: Clean REST API with `/extract` endpoint
2. **HTML Input**: Receives captured HTML from extension via HTTP POST
3. **crawl4ai**: Converts HTML → clean markdown  
4. **instructor**: Extracts structured content using LLM
5. **JSON Response**: Returns structured content model

### 🎯 **MVP Focus**
- **Clean HTTP API**: No stdout/stderr pollution issues
- **FastAPI + Uvicorn**: Production-ready async server
- **Basic extraction**: Title, content, author, publish date
- **Fast testing**: Minimal dependencies and schemas
- **Separate processes**: Isolated server for better debugging

## 🧪 **Testing Flow**

1. **Extension captures**: HTML content (229KB+)
2. **Mock server**: Receives extension submission 
3. **HTTP POST**: Mock server → Nano FastAPI server
4. **Nano extractor**: Processes HTML → structured data
5. **Debug page**: Shows extracted content in Test Result panel

## 📁 **Files**

- `nano_server.py` - FastAPI server with /extract endpoint
- `nano_extractor.py` - Legacy CLI version (kept for reference)
- `requirements.txt` - Python dependencies (FastAPI, uvicorn, crawl4ai, instructor)  
- `setup_nano.sh` - Setup script
- `.env` - API keys (copy from server directory)

## 🌐 **API Endpoints**

### Nano Extractor Server (Port 3002)
- `GET /` - Health check
- `POST /extract` - Extract content from HTML
- `GET /docs` - Interactive API documentation

### Mock Server (Port 3001)
- `GET /debug` - Debug page for testing workflow
- `POST /debug/extract` - Test extractor directly
- Extensions endpoints for submission tracking

## 🔧 **Environment Variables**

```bash
OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=https://your_provider_url
OPENAI_MODEL=google/gemini-2.5-flash
```

## ✅ **Integration Test**

Once both servers are running:
1. **Nano Server**: `http://localhost:3002` (check health)
2. **Mock Server**: `http://localhost:3001` (extension integration)
3. **Load extension** in Chrome
4. **Capture content** from any webpage  
5. **Check debug page**: `http://localhost:3001/debug`
6. **Click 🚀 Extract** on submission
7. **See clean structured output** in Test Result panel

This confirms: extension → mock server → nano FastAPI server → structured data workflow! 

## 🆚 **Advantages over CLI approach**

- ✅ **No stdout pollution** from crawl4ai logs
- ✅ **Clean JSON responses** via HTTP
- ✅ **Better error handling** with HTTP status codes
- ✅ **Independent testing** of extraction server
- ✅ **Production-ready** FastAPI + uvicorn setup