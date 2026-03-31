import os
from pathlib import Path

from hmi_agent.config import ConfigError, load_qwen_config


def test_load_qwen_config_from_json(tmp_path: Path):
    config_file = tmp_path / "qwen_config.json"
    config_file.write_text(
        """
{
  "api_key": "k1",
  "base_url": "https://example.com/v1",
  "model": "qwen-x",
  "system_prompt": "test",
  "temperature": 0.1,
    "max_tokens": 4096,
    "verify_ssl": false
}
        """,
        encoding="utf-8",
    )

    cfg = load_qwen_config(config_file)
    assert cfg.api_key == "k1"
    assert cfg.max_tokens == 4096
    assert cfg.verify_ssl is False


def test_load_qwen_config_from_markdown(tmp_path: Path):
    config_file = tmp_path / "AI_Config.md"
    config_file.write_text(
        """
## QWen 配置
* {
  "api_key": "k1",
  "base_url": "https://example.com/v1",
  "model": "qwen-x",
  "system_prompt": "test",
  "temperature": 0.1,
  "max_tokens": 1024
}
        """,
        encoding="utf-8",
    )

    cfg = load_qwen_config(config_file)
    assert cfg.api_key == "k1"
    assert cfg.model == "qwen-x"


def test_env_override_api_key(tmp_path: Path):
    config_file = tmp_path / "AI_Config.md"
    config_file.write_text(
        """
* {
  "api_key": "EMPTY",
  "base_url": "https://example.com/v1",
  "model": "qwen-x",
  "system_prompt": "test",
  "temperature": 0.1,
  "max_tokens": 1024
}
        """,
        encoding="utf-8",
    )

    os.environ["QWEN_API_KEY"] = "env-key"
    try:
        cfg = load_qwen_config(config_file)
        assert cfg.api_key == "env-key"
    finally:
        del os.environ["QWEN_API_KEY"]


def test_empty_key_without_env_raises(tmp_path: Path):
    config_file = tmp_path / "AI_Config.md"
    config_file.write_text(
        """
* {
  "api_key": "EMPTY",
  "base_url": "https://example.com/v1",
  "model": "qwen-x",
  "system_prompt": "test",
  "temperature": 0.1,
  "max_tokens": 1024
}
        """,
        encoding="utf-8",
    )

    try:
        load_qwen_config(config_file)
        assert False, "Expected ConfigError"
    except ConfigError:
        assert True
