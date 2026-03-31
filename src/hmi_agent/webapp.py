from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .orchestrator import run_test_flow

ROOT_DIR = Path(__file__).resolve().parents[2]
STATIC_DIR = Path(__file__).resolve().parent / "static"
DEFAULT_CONFIG = ROOT_DIR / "configs" / "qwen3_vl.json"
DEFAULT_OUTPUT = ROOT_DIR / "runs"

app = FastAPI(title="HMI Test Agent Web", version="0.1.0")
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


class RunRequest(BaseModel):
    requirement_text: str = Field(min_length=5)
    offline_demo: bool = True
    config_file: str = "configs/qwen3_vl.json"
    output_root: str = "runs"


def _resolve_path(path_text: str) -> Path:
    raw = Path(path_text)
    if raw.is_absolute():
        return raw
    return (ROOT_DIR / raw).resolve()


def _load_json_file(file_path: Path) -> dict:
    if not file_path.exists():
        raise FileNotFoundError(file_path)
    return json.loads(file_path.read_text(encoding="utf-8"))


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "hmi-agent-web"}


@app.post("/api/run")
def start_run(request: RunRequest) -> dict:
    output_root = _resolve_path(request.output_root)
    output_root.mkdir(parents=True, exist_ok=True)

    tmp_dir = output_root / "_inputs"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    tmp_requirement_file = tmp_dir / (
        f"requirement-{datetime.utcnow().strftime('%Y%m%d-%H%M%S-%f')}.md"
    )
    tmp_requirement_file.write_text(request.requirement_text, encoding="utf-8")

    config_file = _resolve_path(request.config_file)

    try:
        run_dir = Path(
            run_test_flow(
                requirement_file=str(tmp_requirement_file),
                config_file=str(config_file),
                output_root=str(output_root),
                offline_demo=request.offline_demo,
            )
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    report = _load_json_file(run_dir / "report.json")
    manifest = _load_json_file(run_dir / "run_manifest.json")

    return {
        "run_id": run_dir.name,
        "run_dir": str(run_dir),
        "manifest": manifest,
        "report": report,
    }


@app.get("/api/runs")
def list_runs(output_root: str = Query("runs")) -> dict:
    root = _resolve_path(output_root)
    if not root.exists():
        return {"runs": []}

    run_entries: list[dict] = []
    for run_dir in sorted(
        [p for p in root.iterdir() if p.is_dir() and p.name.startswith("run-")],
        key=lambda item: item.stat().st_mtime,
        reverse=True,
    ):
        manifest_file = run_dir / "run_manifest.json"
        report_file = run_dir / "report.json"
        created_at = datetime.fromtimestamp(run_dir.stat().st_mtime).isoformat()
        if manifest_file.exists():
            manifest = _load_json_file(manifest_file)
            created_at = manifest.get("created_at", created_at)

        run_entries.append(
            {
                "run_id": run_dir.name,
                "created_at": created_at,
                "has_report": report_file.exists(),
                "path": str(run_dir),
            }
        )

    return {"runs": run_entries}


@app.get("/api/runs/{run_id}/report")
def get_report(run_id: str, output_root: str = Query("runs")) -> dict:
    run_dir = _resolve_path(output_root) / run_id
    report_file = run_dir / "report.json"
    if not report_file.exists():
        raise HTTPException(status_code=404, detail=f"Report not found for {run_id}")
    return _load_json_file(report_file)


@app.get("/api/runs/{run_id}/manifest")
def get_manifest(run_id: str, output_root: str = Query("runs")) -> dict:
    run_dir = _resolve_path(output_root) / run_id
    manifest_file = run_dir / "run_manifest.json"
    if not manifest_file.exists():
        raise HTTPException(status_code=404, detail=f"Manifest not found for {run_id}")
    return _load_json_file(manifest_file)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="HMI Test Agent Web UI")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind")
    parser.add_argument("--port", default=8080, type=int, help="Port to bind")
    parser.add_argument("--reload", action="store_true", help="Enable auto reload")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    uvicorn.run("hmi_agent.webapp:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
