from __future__ import annotations

import json
from re import sub

from openai import OpenAI

from .config import QwenConfig
from .models import CaseGenerationRequest, CaseGenerationResult, TestCase


class QwenCaseGenerator:
    def __init__(self, config: QwenConfig) -> None:
        self.config = config
        self.client = OpenAI(api_key=config.api_key, base_url=config.base_url)

    def generate(self, request: CaseGenerationRequest) -> CaseGenerationResult:
        prompt = self._build_user_prompt(request)

        response = self.client.chat.completions.create(
            model=self.config.model,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            messages=[
                {"role": "system", "content": self.config.system_prompt},
                {"role": "user", "content": prompt},
            ],
        )

        content = response.choices[0].message.content or ""
        payload = self._extract_json(content)
        raw_cases = payload.get("cases", [])
        cases = [TestCase.model_validate(item) for item in raw_cases]

        return CaseGenerationResult(model=self.config.model, cases=cases)

    def _build_user_prompt(self, request: CaseGenerationRequest) -> str:
        return (
            "You must output strict JSON only."
            " Create executable automotive HMI+APP test cases in schema: "
            "{\"cases\":[{\"id\":\"...\",\"title\":\"...\",\"source_requirement\":\"...\","
            "\"priority\":\"P0|P1|P2\",\"tags\":[],\"preconditions\":[],"
            "\"steps\":[{\"id\":\"...\",\"action\":\"tap|input|swipe|wait|assert_text|assert_visible|call_api|check_log\","
            "\"target\":\"...\",\"value\":\"...\",\"timeout_sec\":10}],"
            "\"expected_results\":[],\"risk_points\":[]}]}"
            f" Max cases: {request.max_cases}."
            f" Requirement: {request.requirement_text}"
        )

    @staticmethod
    def _extract_json(content: str) -> dict:
        # The model may include markdown wrappers. Keep only the JSON object.
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("Model response does not contain a valid JSON object.")
        return json.loads(content[start : end + 1])


class OfflineCaseGenerator:
    """Deterministic local generator used for dry-run and integration bring-up."""

    def generate(self, request: CaseGenerationRequest) -> CaseGenerationResult:
        normalized = sub(r"\s+", " ", request.requirement_text).strip()
        snippet = normalized[:120] if normalized else "No requirement text"
        cases = [
            TestCase.model_validate(
                {
                    "id": "CASE-001",
                    "title": "车机蓝牙配对成功路径",
                    "source_requirement": snippet,
                    "priority": "P0",
                    "tags": ["car_hmi", "android_app", "offline_demo"],
                    "preconditions": ["车机蓝牙页面已打开", "手机蓝牙已开启"],
                    "steps": [
                        {"id": "S1", "action": "tap", "target": "btn_search_device"},
                        {"id": "S2", "action": "tap", "target": "device_row_phone"},
                        {"id": "S3", "action": "input", "target": "pair_code_input", "value": "123456"},
                        {"id": "S4", "action": "assert_text", "target": "status_label", "value": "已连接"},
                    ],
                    "expected_results": ["车机状态显示已连接", "APP状态同步为在线"],
                    "risk_points": ["配对超时", "状态同步延迟"],
                }
            ),
            TestCase.model_validate(
                {
                    "id": "CASE-002",
                    "title": "配对失败提示与重试",
                    "source_requirement": snippet,
                    "priority": "P1",
                    "tags": ["car_hmi", "error_path", "offline_demo"],
                    "preconditions": ["输入错误配对码"],
                    "steps": [
                        {"id": "S1", "action": "input", "target": "pair_code_input", "value": "000000"},
                        {"id": "S2", "action": "tap", "target": "btn_confirm_pair"},
                        {"id": "S3", "action": "assert_visible", "target": "error_dialog"},
                        {"id": "S4", "action": "tap", "target": "btn_retry"},
                    ],
                    "expected_results": ["显示可读错误提示", "支持重试流程"],
                    "risk_points": ["错误码缺失", "重试按钮不可用"],
                }
            ),
        ]
        return CaseGenerationResult(model="offline-demo", cases=cases)
