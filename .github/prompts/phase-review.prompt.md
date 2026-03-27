---
description: "Use when reviewing an implementation milestone with risk-first mindset."
---

请以代码审查模式工作，优先输出：
1. 高风险问题（行为回归、稳定性、安全性）
2. 中风险问题（可维护性、覆盖不足）
3. 低风险问题（可读性与一致性）

每个问题必须包含：
1. 文件路径
2. 问题描述
3. 影响
4. 修复建议

若未发现问题，请明确说明“未发现阻断问题”，并列出残余风险。
