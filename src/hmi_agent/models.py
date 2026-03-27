from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


StepAction = Literal[
    "tap",
    "input",
    "swipe",
    "wait",
    "assert_text",
    "assert_visible",
    "call_api",
    "check_log",
]


class CaseStep(BaseModel):
    id: str
    action: StepAction
    target: str | None = None
    value: str | None = None
    timeout_sec: int = 10


class TestCase(BaseModel):
    id: str
    title: str
    source_requirement: str
    priority: Literal["P0", "P1", "P2"] = "P1"
    tags: list[str] = Field(default_factory=list)
    preconditions: list[str] = Field(default_factory=list)
    steps: list[CaseStep]
    expected_results: list[str]
    risk_points: list[str] = Field(default_factory=list)


class CaseGenerationRequest(BaseModel):
    requirement_text: str
    max_cases: int = Field(default=5, ge=1, le=20)


class CaseGenerationResult(BaseModel):
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    model: str
    prompt_version: str = "v1"
    cases: list[TestCase]


class StepExecutionResult(BaseModel):
    step_id: str
    action: str
    success: bool
    message: str


class CaseExecutionResult(BaseModel):
    case_id: str
    passed: bool
    started_at: datetime
    finished_at: datetime
    step_results: list[StepExecutionResult]


class RootCauseCandidate(BaseModel):
    category: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: list[str] = Field(default_factory=list)
    summary: str
