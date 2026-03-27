from __future__ import annotations

from datetime import datetime
from pathlib import Path

from .models import CaseExecutionResult, StepExecutionResult, TestCase


class BaseDriver:
    """Unified interface for vehicle HMI and APP action execution."""

    def execute_step(self, action: str, target: str | None, value: str | None) -> tuple[bool, str]:
        raise NotImplementedError


class MockAndroidDriver(BaseDriver):
    """Temporary driver for MVP bring-up before real device integration."""

    def execute_step(self, action: str, target: str | None, value: str | None) -> tuple[bool, str]:
        message = f"action={action}, target={target}, value={value}"
        return True, message


class CaseExecutor:
    def __init__(self, output_dir: str | Path) -> None:
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def execute_case(self, case: TestCase, driver: BaseDriver) -> CaseExecutionResult:
        started = datetime.utcnow()
        step_results: list[StepExecutionResult] = []

        for step in case.steps:
            success, message = driver.execute_step(step.action, step.target, step.value)
            step_results.append(
                StepExecutionResult(
                    step_id=step.id,
                    action=step.action,
                    success=success,
                    message=message,
                )
            )

        finished = datetime.utcnow()
        passed = all(item.success for item in step_results)

        result = CaseExecutionResult(
            case_id=case.id,
            passed=passed,
            started_at=started,
            finished_at=finished,
            step_results=step_results,
        )

        artifact_file = self.output_dir / f"{case.id}_execution.json"
        artifact_file.write_text(result.model_dump_json(indent=2), encoding="utf-8")
        return result
