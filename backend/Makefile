.PHONY: format check mypy run

format:
	uv run ruff format app
	uv run ruff check --fix app

check:
	uv run ruff check app

mypy:
	uv run mypy app

run:
	uv run uvicorn app.main:app --reload
