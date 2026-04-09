"""Job store backed by APScheduler for background import tasks."""

import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler  # type: ignore[import-untyped]

scheduler = AsyncIOScheduler()


class JobStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ProgressStep:
    label: str
    total: int = 0
    completed: int = 0
    status: str = "pending"  # pending | running | completed | skipped


@dataclass
class Job:
    id: str
    status: JobStatus = JobStatus.PENDING
    result: dict[str, Any] | None = None
    error: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = None
    steps: list[ProgressStep] = field(default_factory=list)
    current_step: int = 0


class JobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}

    def create(self, steps: list[str] | None = None) -> Job:
        job = Job(id=uuid.uuid4().hex[:12])
        if steps:
            job.steps = [ProgressStep(label=s) for s in steps]
        self._jobs[job.id] = job
        return job

    def get(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    def complete(self, job_id: str, result: dict[str, Any]) -> None:
        job = self._jobs.get(job_id)
        if job:
            job.status = JobStatus.COMPLETED
            job.result = result
            job.completed_at = datetime.now(UTC)

    def fail(self, job_id: str, error: str) -> None:
        job = self._jobs.get(job_id)
        if job:
            job.status = JobStatus.FAILED
            job.error = error
            job.completed_at = datetime.now(UTC)

    def set_running(self, job_id: str) -> None:
        job = self._jobs.get(job_id)
        if job:
            job.status = JobStatus.RUNNING

    def start_step(self, job_id: str, step_index: int, total: int = 0) -> None:
        job = self._jobs.get(job_id)
        if job and step_index < len(job.steps):
            job.current_step = step_index
            job.steps[step_index].status = "running"
            job.steps[step_index].total = total

    def advance_step(self, job_id: str, step_index: int, completed: int = 1) -> None:
        job = self._jobs.get(job_id)
        if job and step_index < len(job.steps):
            job.steps[step_index].completed += completed

    def finish_step(self, job_id: str, step_index: int) -> None:
        job = self._jobs.get(job_id)
        if job and step_index < len(job.steps):
            step = job.steps[step_index]
            step.status = "completed"
            step.completed = step.total or step.completed

    def skip_step(self, job_id: str, step_index: int) -> None:
        job = self._jobs.get(job_id)
        if job and step_index < len(job.steps):
            job.steps[step_index].status = "skipped"


import_job_store = JobStore()
