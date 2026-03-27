from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from uuid import uuid4

# Ensure local Prefect API traffic is not routed through corporate proxy.
os.environ.setdefault("NO_PROXY", "127.0.0.1,localhost")
os.environ.setdefault("no_proxy", "127.0.0.1,localhost")
os.environ.setdefault("DO_NOT_TRACK", "1")
os.environ.setdefault("PREFECT_SERVER_ANALYTICS_ENABLED", "false")

from prefect import flow, task

from .config import load_qwen_config
from .executor import CaseExecutor, MockAndroidDriver
from .generator import OfflineCaseGenerator, QwenCaseGenerator
from .models import CaseGenerationRequest, CaseGenerationResult, CaseExecutionResult
from .observer import LogObserver


@task
def generate_cases(requirement_text: str, config_file: str, offline_demo: bool) -> CaseGenerationResult:
    if offline_demo:
        generator = OfflineCaseGenerator()
        request = CaseGenerationRequest(requirement_text=requirement_text, max_cases=2)
        return generator.generate(request)

    config = load_qwen_config(config_file)
    generator = QwenCaseGenerator(config)
    request = CaseGenerationRequest(requirement_text=requirement_text, max_cases=5)
    return generator.generate(request)


@task
def execute_cases(cases: CaseGenerationResult, run_dir: str) -> list[CaseExecutionResult]:
    executor = CaseExecutor(run_dir)
    driver = MockAndroidDriver()
    results = [executor.execute_case(case, driver) for case in cases.cases]
    return results


@task
def observe_logs(run_dir: str) -> dict:
    observer = LogObserver()
    run_path = Path(run_dir)
    all_candidates: dict[str, list[dict]] = {}

    for artifact in run_path.glob("*_execution.json"):
        # For MVP we inspect execution artifacts as synthetic logs.
        candidates = observer.analyze_log_file(artifact)
        all_candidates[artifact.name] = [item.model_dump() for item in candidates]

    return all_candidates


@flow(name="hmi-test-agent-e2e", log_prints=True)
def run_test_flow(
    requirement_file: str,
    config_file: str,
    output_root: str = "runs",
    offline_demo: bool = False,
) -> str:
    requirement_path = Path(requirement_file)
    if not requirement_path.exists():
        raise FileNotFoundError(f"Requirement file not found: {requirement_path}")

    run_id = f"run-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}-{uuid4().hex[:6]}"
    run_dir = Path(output_root) / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    requirement_text = requirement_path.read_text(encoding="utf-8")
    generated = generate_cases(requirement_text, config_file, offline_demo)
    execution_results = execute_cases(generated, str(run_dir))
    root_cause = observe_logs(str(run_dir))

    report = {
        "run_id": run_id,
        "offline_demo": offline_demo,
        "generated_case_count": len(generated.cases),
        "execution_results": [item.model_dump(mode="json") for item in execution_results],
        "root_cause_candidates": root_cause,
        "model": generated.model,
    }
    (run_dir / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    manifest = {
        "run_id": run_id,
        "created_at": datetime.utcnow().isoformat(),
        "config_file": config_file,
        "requirement_file": requirement_file,
        "offline_demo": offline_demo,
        "artifacts": [
            "report.json",
            *[path.name for path in run_dir.glob("*_execution.json")],
        ],
    }
    (run_dir / "run_manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )

    return str(run_dir)
