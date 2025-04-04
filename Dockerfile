# Use Node.js for frontend build
FROM node:20-slim as frontend-builder

# Firebase Configuration
ARG VITE_FIREBASE_API_KEY=AIzaSyDXWNn3Yv116yQvy1mx9d5v90e3RXaELHQ
ARG VITE_FIREBASE_AUTH_DOMAIN=four-freedoms-451318.firebaseapp.com
ARG VITE_FIREBASE_PROJECT_ID=four-freedoms-451318
ARG VITE_FIREBASE_STORAGE_BUCKET=four-freedoms-451318.firebasestorage.app
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=247945685434
ARG VITE_FIREBASE_APP_ID=1:247945685434:web:19d1e834ae473217be5583
ARG VITE_FIREBASE_MEASUREMENT_ID=G-BX1RB8DHVV
ARG VITE_FIREBASE_USE_EMULATOR=false
ARG VITE_FIRESTORE_DATABASE_ID=fourfreedoms-db1

# App secret keys
# ARG VITE_SECRET_KEY=four-legged-dog-1234567890

# Install bun
RUN npm install -g bun

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy frontend source
COPY . .

# Build frontend
RUN bun run build

# Use Python for the main application
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /app/static ./static

# Create necessary directories
RUN mkdir -p static/audio static/transcripts data/audio data/transcripts

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "app.py"]