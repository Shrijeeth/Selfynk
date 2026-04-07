.PHONY: dev prod prod-build migrate test lint typecheck

dev:
	docker compose up -d

dev-build:
	docker compose up --build -d

prod:
	docker compose -f docker-compose.prod.yml up -d

prod-build:
	docker compose -f docker-compose.prod.yml up --build -d

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

migrate:
	cd backend && alembic upgrade head

migration:
	cd backend && alembic revision --autogenerate -m "$(name)"

test:
	cd backend && uv run pytest -v
	cd frontend && npm test

lint:
	cd backend && uv run ruff check . && uv run mypy app/
	cd frontend && npm run lint

typecheck:
	cd backend && uv run mypy app/
	cd frontend && npx tsc --noEmit

install-backend:
	cd backend && uv sync

install-frontend:
	cd frontend && npm install

setup: install-backend install-frontend migrate
	@echo "✓ Selfynk ready. Run: make dev"
