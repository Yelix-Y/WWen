from __future__ import annotations

from pathlib import Path

from .models import RootCauseCandidate


class LogObserver:
    def analyze_log_text(self, content: str) -> list[RootCauseCandidate]:
        candidates: list[RootCauseCandidate] = []
        lowered = content.lower()

        rules = [
            ("crash", "Crash suspected from log keywords"),
            ("anr", "ANR suspected from log keywords"),
            ("timeout", "Timeout suspected from log keywords"),
            ("element not found", "UI locator issue suspected"),
            ("500", "Backend API failure suspected"),
            ("exception", "Unhandled exception suspected"),
        ]

        for keyword, summary in rules:
            if keyword in lowered:
                candidates.append(
                    RootCauseCandidate(
                        category=keyword,
                        confidence=0.65,
                        evidence=[f"keyword={keyword}"],
                        summary=summary,
                    )
                )

        if not candidates:
            candidates.append(
                RootCauseCandidate(
                    category="unknown",
                    confidence=0.2,
                    evidence=["No known error signature matched"],
                    summary="No deterministic root cause found",
                )
            )

        return candidates

    def analyze_log_file(self, log_file: str | Path) -> list[RootCauseCandidate]:
        file_path = Path(log_file)
        if not file_path.exists():
            return [
                RootCauseCandidate(
                    category="missing-log",
                    confidence=0.9,
                    evidence=[f"missing_file={file_path}"],
                    summary="Log file is missing, cannot perform root cause analysis",
                )
            ]
        return self.analyze_log_text(file_path.read_text(encoding="utf-8", errors="ignore"))
