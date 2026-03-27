---
description: "Use when implementing or improving requirement-to-case generation with QWen."
---

目标：完善需求到测试用例的自动生成链路。

输入：
1. 需求文本
2. Case Schema
3. 当前模型配置

请执行：
1. 生成结构化测试点。
2. 生成可执行Case（严格匹配Schema）。
3. 增加质量门禁（完整性、重复率、可执行性）。
4. 给出验证方法与样例输出。

输出格式：
1. 变更文件列表
2. 关键逻辑说明
3. 验证步骤
4. 风险与后续建议
