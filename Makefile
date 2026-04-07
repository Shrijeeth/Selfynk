.PHONY: dev prod prod-build migrate test lint

dev:
	docker compose up

dev-build:
	docker compose up --build

prod:
	docker compose -f docker-compose.prod.yml up

prod-build:
	docker compose -f docker-compose.prod.yml up --build

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

migrate:
	cd backend && alembic upgrade head

migration:
	cd backend && alembic revision --autogenerate -m "$(name)"

test:
	cd backend && pytest -v

lint:
	cd backend && uv run ruff check . && uv run mypy app/
	cd frontend && npm run lint

install-backend:
	cd backend && uv sync

install-frontend:
	cd frontend && npm install

setup: install-backend install-frontend migrate
	@echo "✓ Selfynk ready. Run: make dev"
