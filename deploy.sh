#!/bin/bash

# Deployment script for vibeScope project
# This script builds and deploys the application using Docker Compose

set -e  # Exit on any error

echo "🚀 Starting deployment for vibeScope..."

# Check if required files exist
echo "📋 Checking required files..."
required_files=(
    "docker-compose.yml"
    "nginx/nginx.conf"
    "nginx/ssl.pem"
    "nginx/ssl.key"
    "server/Dockerfile"
    "frontend/Dockerfile"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
done

echo "✅ All required files found"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p server/data server/logs nginx/logs

# Stop existing containers if running
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans || true

# Remove old images to ensure fresh build
echo "🧹 Cleaning up old images..."
docker-compose down --rmi all --volumes --remove-orphans || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

# Test endpoints
echo "🧪 Testing endpoints..."
echo "Testing nginx health..."
curl -f http://localhost/health || echo "⚠️  Nginx health check failed"

echo "Testing HTTPS redirect..."
curl -I http://localhost 2>/dev/null | grep -q "301" && echo "✅ HTTP to HTTPS redirect working" || echo "⚠️  HTTP redirect not working"

# Show logs for debugging
echo "📋 Recent logs:"
echo "--- Nginx logs ---"
docker-compose logs --tail=10 nginx
echo "--- Server logs ---"
docker-compose logs --tail=10 server
echo "--- Frontend logs ---"
docker-compose logs --tail=10 frontend

echo ""
echo "🎉 Deployment completed!"
echo "📍 Your application should be available at:"
echo "   🌐 Frontend: https://onehalf.tech"
echo "   🔌 API: https://api.onehalf.tech"
echo ""
echo "📊 To monitor logs: docker-compose logs -f"
echo "🛑 To stop services: docker-compose down"
echo "🔄 To restart services: docker-compose restart"
echo ""
echo "⚠️  Make sure your DNS is pointing to this server:"
echo "   A record: onehalf.tech -> $(curl -s ifconfig.me)"
echo "   A record: api.onehalf.tech -> $(curl -s ifconfig.me)"