# Use Ubuntu latest as base image
FROM ubuntu:latest

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=20
ENV N8N_VERSION=latest

# Update system and install basic dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    software-properties-common \
    build-essential \
    python3 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Install Playwright globally first
RUN npm install -g playwright@latest

# Install essential system dependencies only
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2t64 \
    libatspi2.0-0 \
    libgtk-3-0 \
    libxfixes3 \
    libxinerama1 \
    libxi6 \
    libxcursor1 \
    libxtst6 \
    fonts-liberation \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright browsers with dependencies
RUN npx playwright install --with-deps

# Set Playwright browsers path environment variable
ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright

# Set N8N data directory
ENV N8N_USER_FOLDER=/root/.n8n

# Install n8n globally
RUN npm install -g n8n@${N8N_VERSION}

# Create app directory
WORKDIR /app

# Create n8n data directory for persistence
RUN mkdir -p /root/.n8n

# Copy the aroha-n8n.js script
COPY aroha-n8n.js /app/aroha-n8n.js

# Install playwright in the app directory (for the script)
RUN cd /app && npm init -y && npm install playwright

# Set proper permissions
RUN chmod +x /app/aroha-n8n.js

# Create a startup script
RUN echo '#!/bin/bash\n\
    echo "Starting N8N..."\n\
    exec n8n start' > /app/start.sh && chmod +x /app/start.sh

# Expose N8N port
EXPOSE 5678

# Set the default command
CMD ["/app/start.sh"]
