# Nginx SSL Configuration

## SSL Certificate Setup

This directory requires SSL certificates for HTTPS deployment. The certificates are **NOT** included in the repository for security reasons.

### Required Files:

- `ssl.pem` - SSL certificate file
- `ssl.key` - SSL private key file

### Setup Instructions:

1. **For Production Deployment:**
   - Obtain SSL certificates from your certificate authority (e.g., Cloudflare, Let's Encrypt)
   - Place the certificate file as `nginx/ssl.pem`
   - Place the private key file as `nginx/ssl.key`

2. **For Development/Testing:**
   - Generate self-signed certificates:
   ```bash
   openssl req -x509 -newkey rsa:4096 -keyout ssl.key -out ssl.pem -days 365 -nodes
   ```

### Security Notes:

- SSL private keys (`*.key`) are automatically ignored by Git
- Never commit SSL certificates to version control
- Ensure proper file permissions (600 for private keys)

### Docker Compose Integration:

The `docker-compose.yml` file expects these certificates to be present:
```yaml
volumes:
  - ./nginx/ssl.pem:/etc/nginx/ssl/ssl.pem:ro
  - ./nginx/ssl.key:/etc/nginx/ssl/ssl.key:ro
```