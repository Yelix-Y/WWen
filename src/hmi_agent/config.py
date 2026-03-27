from __future__ import annotations

import json
import os
import re
from pathlib import Path

from pydantic import BaseModel, Field, ValidationError


class QwenConfig(BaseModel):
    api_key: str = Field(min_length=1)
    base_url: str = Field(min_length=1)
    model: str = Field(min_length=1)
    system_prompt: str = Field(min_length=1)
    temperature: float = Field(default=0.1, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2000, ge=128, le=8192)


class ConfigError(RuntimeError):
    """Raised when runtime configuration is invalid."""


def _extract_json_block(markdown_text: str) -> dict:
    match = re.search(r"\{[\s\S]*\}", markdown_text)
    if not match:
        raise ConfigError("No JSON block found in AI config markdown file.")
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError as exc:
        raise ConfigError(f"Invalid JSON block in AI config markdown: {exc}") from exc


def load_qwen_config(config_path: str | Path) -> QwenConfig:
    config_file = Path(config_path)
    if not config_file.exists():
        raise ConfigError(f"Config file not found: {config_file}")

    payload = _extract_json_block(config_file.read_text(encoding="utf-8"))

    env_overrides = {
        "api_key": os.getenv("QWEN_API_KEY"),
        "base_url": os.getenv("QWEN_BASE_URL"),
        "model": os.getenv("QWEN_MODEL"),
        "system_prompt": os.getenv("QWEN_SYSTEM_PROMPT"),
        "temperature": os.getenv("QWEN_TEMPERATURE"),
        "max_tokens": os.getenv("QWEN_MAX_TOKENS"),
    }

    for key, value in env_overrides.items():
        if value in (None, ""):
            continue
        if key == "temperature":
            payload[key] = float(value)
            continue
        if key == "max_tokens":
            payload[key] = int(value)
            continue
        payload[key] = value

    if payload.get("api_key", "") in {"", "EMPTY", None}:
        raise ConfigError(
            "QWEN API key is empty. Set QWEN_API_KEY in environment variables."
        )

    try:
        return QwenConfig.model_validate(payload)
    except ValidationError as exc:
        raise ConfigError(f"Invalid QWen config payload: {exc}") from exc
