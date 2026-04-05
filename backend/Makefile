.PHONY: format check mypy run

format:
	ruff format app
	ruff check --fix app

check:
	ruff check app

mypy:
	mypy app

run:
	uvicorn app.main:app --reload
