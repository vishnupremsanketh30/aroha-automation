# Aroha N8N Docker Setup

This Docker setup provides a complete environment with Ubuntu, Playwright, N8N, and your aroha-n8n.js script.

## What's Included

- **Ubuntu Latest**: Base operating system
- **Playwright**: Web automation framework with all browser dependencies
- **N8N**: Workflow automation tool
- **Node.js 20**: JavaScript runtime
- **Your Script**: aroha-n8n.js copied into the container

## Quick Start

### Using Docker Compose (Recommended)

1. **Build and run the container:**

   ```bash
   docker-compose up -d --build
   ```

2. **Access N8N:**
   - Open your browser and go to: `http://localhost:5678`
   - Default credentials:
     - Username: `admin`
     - Password: `password`

### Using Docker Commands

1. **Build the image:**

   ```bash
   docker build -t aroha-n8n .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name aroha-n8n-container \
     -p 5678:5678 \
     -v aroha_n8n_data:/home/node/.n8n \
     aroha-n8n
   ```

## Persistent Data

The setup includes a persistent volume (`n8n_data`) that stores:

- N8N workflows
- N8N settings and configurations
- User data

## Using Your Script in N8N

1. **Access the container:**

   ```bash
   docker exec -it aroha-n8n-container bash
   ```

2. **Your script is located at:**

   ```
   /app/aroha-n8n.js
   ```

3. **Run your script manually:**

   ```bash
   cd /app
   node aroha-n8n.js
   ```

4. **In N8N workflows**, use the "Execute Command" node with:
   ```bash
   cd /app && node aroha-n8n.js
   ```

## Environment Variables for Your Script

When creating N8N workflows, set these environment variables in the "Execute Command" node:

- `SERVICE_LOCATION`: The service location
- `QUALIFICATION`: Required qualification
- `SHIFT_DATE`: Date in DD/MM/YYYY format
- `START_TIME`: Start time in HH:MM format
- `END_TIME`: End time in HH:MM format

## Container Management

### Start the container:

```bash
docker-compose up -d
```

### Stop the container:

```bash
docker-compose down
```

### View logs:

```bash
docker-compose logs -f aroha-n8n
```

### Restart the container:

```bash
docker-compose restart aroha-n8n
```

## Troubleshooting

### Check if services are running:

```bash
docker-compose ps
```

### Access container shell:

```bash
docker exec -it aroha-n8n-container bash
```

### Check Playwright installation:

```bash
docker exec -it aroha-n8n-container npx playwright --version
```

### Check N8N status:

```bash
docker exec -it aroha-n8n-container ps aux | grep n8n
```

## Development

### Update your script:

If you modify `aroha-n8n.js`, the changes will be automatically reflected in the container due to the volume mount in docker-compose.yml.

### Rebuild after Dockerfile changes:

```bash
docker-compose down
docker-compose up -d --build
```

## Security Notes

- Change the default N8N credentials in `docker-compose.yml`
- Consider using environment files for sensitive data
- The container runs N8N with basic authentication enabled

## File Structure

```
aroha-docker/
├── Dockerfile              # Container definition
├── docker-compose.yml      # Service orchestration
├── aroha-n8n.js           # Your Playwright script
└── README.md              # This file
```
