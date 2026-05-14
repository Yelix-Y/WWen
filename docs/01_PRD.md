# AgentMesh PRD

## 1. 背景

普通单 Agent 应用容易遇到三个问题：

- 上下文过长后难以保持稳定状态。
- 工具调用缺少统一调度，能力模块不可复用。
- 复杂任务缺少规划、执行、审查之间的协作边界。

AgentMesh 通过多 Agent 分工、独立记忆、Skill Registry 与调度引擎解决这些问题，使复杂任务执行过程更加可控、可扩展、可观测。

## 2. 产品目标

- 构建一个可运行的多智能体协作引擎。
- 支持 Agent 独立记忆和跨任务状态延续。
- 支持 Skill 动态注册、调度和组合执行。
- 提供 CLI 驱动的任务执行体验。
- 为后续 FastAPI 服务化、Web UI、分布式任务队列预留接口。

## 3. 用户故事

### 研发助手场景

作为开发者，我希望提交一个需求描述后，系统可以自动拆解任务、调用文件读写 / 代码分析 / 测试执行 Skill，并由 Reviewer Agent 给出最终检查结论。

### 文档生成场景

作为项目维护者，我希望 Agent 能读取项目上下文，生成 PRD、架构设计、API 文档和风险分析，并把结果保存到指定目录。

### 多轮任务场景

作为使用者，我希望某个 Agent 记住之前执行过的任务、偏好和项目上下文，在下一次任务中自动复用这些记忆。

## 4. MVP 范围

| 模块 | MVP 是否包含 | 说明 |
| --- | --- | --- |
| Agent Runtime | 是 | 创建 Agent、加载角色、执行任务 |
| Memory Manager | 是 | 短期记忆 + 文件持久化，后续扩展 Redis / 向量库 |
| Skill Registry | 是 | 注册 Skill 元数据与调用入口 |
| Skill Scheduler | 是 | MVP 先用规则调度，后续引入 LLM 路由 |
| Task Orchestrator | 是 | 管理任务状态、事件日志和结果聚合 |
| CLI | 是 | 使用 Typer 或 Click 实现 |
| Docker | 是 | 提供本地容器化运行 |
| Web API | 否 | 后续扩展 FastAPI |
| Kubernetes | 否 | 后续作为部署加分项 |

## 5. 非功能需求

- 可扩展性：新增 Skill 不应修改核心调度器代码。
- 可测试性：Skill Scheduler、Memory Manager、Task Orchestrator 必须可单元测试。
- 可观测性：任务执行过程必须记录事件。
- 稳定性：Skill 调用失败不能导致整个任务无日志退出。
- 可移植性：本地 Python 环境和 Docker 环境都能运行。

## 6. 验收标准

- 可以通过 CLI 创建至少 3 个 Agent。
- 可以提交任务并生成结构化执行结果。
- 可以在一个任务中调用至少 2 个 Skill。
- 可以查询 Agent Memory 和任务事件日志。
- 至少覆盖 10 个核心单元测试。
- Docker 镜像可构建并运行 CLI 示例任务。

