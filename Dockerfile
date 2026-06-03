# syntax=docker/dockerfile:1.6
# ─── Stage 1: Build Frontend ───────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
# Use Vite's build. VITE_* env vars must be baked in at build time.
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ─── Stage 2: Build Backend Dependencies ───────────────────────────────────────
FROM python:3.11-slim AS backend-builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# ─── Stage 3: Final Production Image ───────────────────────────────────────────
FROM python:3.11-slim AS runtime
WORKDIR /app

# curl is only here to give the HEALTHCHECK something to call.
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/false --uid 10001 app

# Install Python deps from pre-built wheels
COPY --from=backend-builder /app/wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

# Backend source
COPY --chown=app:app app/ ./app/
COPY --chown=app:app run.py ./

# Compiled frontend
COPY --chown=app:app --from=frontend-builder /app/frontend/dist ./frontend/dist

RUN mkdir -p logs && chown -R app:app /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    HOST=0.0.0.0 \
    PORT=8000 \
    WEB_CONCURRENCY=2

USER app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl --fail --silent --show-error http://127.0.0.1:8000/health || exit 1

# Production: multi-worker uvicorn, no reload. WEB_CONCURRENCY overridable per-host.
CMD ["sh", "-c", "exec uvicorn app.main:app --host ${HOST} --port ${PORT} --workers ${WEB_CONCURRENCY} --proxy-headers --forwarded-allow-ips='*' --access-log"]
