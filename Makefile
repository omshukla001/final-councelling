.PHONY: install dev frontend-install frontend-dev frontend-build clean help

# ─── Backend ──────────────────────────────────────────────────────────────────

install:  ## Install Python dependencies
	pip install -r requirements.txt

dev:  ## Run FastAPI development server
	python run.py

# ─── Frontend ─────────────────────────────────────────────────────────────────

frontend-install:  ## Install Node dependencies for the frontend
	cd frontend && npm install

frontend-dev:  ## Run Vite development server
	cd frontend && npm run dev

frontend-build:  ## Build frontend for production
	cd frontend && npm run build

# ─── Utilities ────────────────────────────────────────────────────────────────

clean:  ## Remove Python cache files
	find . -type d -name __pycache__ -exec rm -r {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true

help:  ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
