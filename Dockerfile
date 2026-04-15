# ─── Stage 1: Build Frontend ───────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
# Using explicitly Vite build (can be npm run build depending on package.json)
RUN npm run build

# ─── Stage 2: Build Backend Dependencies ───────────────────────────────────────
FROM python:3.11-slim AS backend-builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Build wheels into /app/wheels
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# ─── Stage 3: Final Production Image ───────────────────────────────────────────
FROM python:3.11-slim
WORKDIR /app

# Install runtime dependencies from wheels
COPY --from=backend-builder /app/wheels /wheels
RUN pip install --no-cache-dir /wheels/*

# Copy backend source code
COPY app/ ./app/
COPY run.py ./

# Copy compiled frontend from Stage 1 into the location FastAPI expects
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create logs directory
RUN mkdir -p logs

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

# Start server (run.py uses Uvicorn under the hood)
CMD ["python", "run.py"]
