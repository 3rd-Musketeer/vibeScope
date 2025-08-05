#!/bin/bash

echo "🚀 Starting Social Media Research Assistant Extension Testing"
echo ""

# Check if we're in the right directory
if [[ ! -f "manifest.json" ]]; then
    echo "❌ Error: Please run this script from the extension/ directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Start mock server in background
echo "🔧 Starting mock server..."
cd mock-server

# Check if dependencies are installed
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start server in background
echo "🌐 Starting server on http://localhost:3001"
npm start &
SERVER_PID=$!

echo "✅ Mock server started (PID: $SERVER_PID)"
echo ""

# Go back to extension directory
cd ..

echo "🔧 Extension setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked' and select this extension folder"
echo "4. Open test-page.html in a new tab"
echo "5. Use this test project key:"
echo ""
echo "   aHR0cDovL2xvY2FsaG9zdDozMDAxfHRlc3QtcHJvamVjdC0xfG1vY2stdG9rZW4tMTIz"
echo ""
echo "6. Click the extension icon to open the side panel"
echo "7. Paste the project key and click Connect"
echo "8. Test both Full Page Capture and Element Selection"
echo ""
echo "💡 To stop the mock server later, run: kill $SERVER_PID"
echo ""
echo "📊 Server logs will appear below:"
echo "----------------------------------------"

# Keep the script running so server logs are visible
wait $SERVER_PID