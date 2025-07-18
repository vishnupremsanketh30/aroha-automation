# OAuth Configuration for Render Deployment

## Issue Resolved
The OAuth callback URLs were pointing to `http://localhost:5678` instead of the deployed Render URL `https://aroha-automation.onrender.com`.

## Changes Made

### 1. Docker Compose Configuration (`docker-compose.yml`)
```yaml
environment:
  - N8N_PROTOCOL=https  # Changed from http to https
  - WEBHOOK_URL=https://aroha-automation.onrender.com
  - N8N_EDITOR_BASE_URL=https://aroha-automation.onrender.com
  # OAuth and callback configuration for deployed environment
  - N8N_CONFIG_ENDPOINTS_REST=https://aroha-automation.onrender.com/rest
  - N8N_CONFIG_ENDPOINTS_WEBHOOK=https://aroha-automation.onrender.com/webhook
  - N8N_CONFIG_ENDPOINTS_WEBHOOKTEST=https://aroha-automation.onrender.com/webhook-test
```

### 2. N8N Configuration File (`n8n-config.json`)
Created a dedicated configuration file that sets:
- Protocol: `https`
- Base URL: `https://aroha-automation.onrender.com`
- All endpoint URLs pointing to the correct domain

### 3. Dockerfile Updates
- Added configuration file copy: `COPY n8n-config.json /root/.n8n/config.json`
- Updated startup script to use the configuration file
- Proper file permissions handling

## OAuth Callback URLs

After deployment, OAuth applications (like Outlook/Microsoft) should now use:
```
https://aroha-automation.onrender.com/rest/oauth2-credential/callback
```

Instead of:
```
http://localhost:5678/rest/oauth2-credential/callback
```

## Verification Steps

1. Deploy the updated Docker image to Render
2. Access N8N at `https://aroha-automation.onrender.com`
3. Check that the OAuth credential setup now shows the correct callback URL
4. Test OAuth authentication with external services

## Environment Variables for Render

Make sure these environment variables are set in Render:
```bash
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=password
N8N_PROTOCOL=https
WEBHOOK_URL=https://aroha-automation.onrender.com
N8N_EDITOR_BASE_URL=https://aroha-automation.onrender.com
```

## Notes
- The configuration ensures all N8N endpoints use the deployed domain
- OAuth callbacks will now work properly with external services
- Basic auth is still enabled for security
- HTTPS is properly configured for the deployed environment
