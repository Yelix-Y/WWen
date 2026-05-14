# AgentMesh

AgentMesh 是一个面向复杂任务自动化的 **多智能体协作与技能调度引擎**。项目目标是构建一个轻量、可扩展、可工程化落地的 Agent Runtime，使多个智能体能够在独立记忆上下文中协作执行任务，并通过可插拔 Skill 完成规划、检索、代码执行、文件处理、结果审查等能力调用。

当前仓库处于文档规划阶段，优先沉淀产品范围、架构边界、数据模型、API Schema、Skill Catalog 与开发路线图，后续可直接进入 MVP 代码实现。

## 核心目标

- 多 Agent 协作：支持 Planner、Executor、Reviewer 等角色组合。
- 独立记忆：每个 Agent 拥有隔离的短期状态与长期记忆。
- Skill 调度：通过统一注册表、Schema 校验与调度策略动态调用能力模块。
- 结构化输出：所有任务、Skill 调用与执行结果都使用可解析的结构化格式。
- 工程可运行：优先基于 Python、asyncio、multiprocessing、Click/Typer、LLM 与 Docker 构建 MVP。

## 文档目录

| 文档 | 说明 |
| --- | --- |
| [项目总览](docs/00_OVERVIEW.md) | 项目定位、核心能力、边界与里程碑 |
| [PRD](docs/01_PRD.md) | 产品需求、用户故事、MVP 范围与验收标准 |
| [技术架构](docs/02_ARCHITECTURE.md) | 核心模块、协作流程、Skill 调度流程、部署形态 |
| [Skill Catalog](docs/03_SKILL_CATALOG.md) | Skill 模块清单、输入输出、可组合方式 |
| [API 与 Schema](docs/04_API_SPEC.md) | CLI / Engine / JSON Schema 设计 |
| [数据模型](docs/05_DATA_MODEL.md) | Agent、Task、Memory、Skill、Event 等核心数据结构 |
| [开发路线图](docs/06_DEVELOPMENT_ROADMAP.md) | MVP、扩展阶段、测试与 CI/CD 计划 |
| [风险与可行性](docs/07_RISK_FEASIBILITY.md) | 功能可行性、风险评估、创新性分析 |
| [简历描述](docs/08_RESUME.md) | 项目名称、技术栈、核心功能与量化表达 |

## MVP 推荐优先级

1. 实现 Agent Runtime 与任务执行状态机。
2. 实现 Skill Registry、Skill Scheduler 与 5 个基础 Skill。
3. 实现独立 Memory Store，先用本地 JSON / SQLite，后续替换 Redis / 向量库。
4. 实现 Typer CLI，支持创建 Agent、提交任务、查看事件日志。
5. 接入 LLM Provider 抽象层，支持 OpenAI / Qwen 等模型。
6. 使用 Docker 固化运行环境。

