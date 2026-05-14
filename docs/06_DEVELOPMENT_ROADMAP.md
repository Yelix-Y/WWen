# AgentMesh 开发路线图

## Phase 1：文档与骨架

目标：完成项目边界、架构设计和最小目录结构。

任务：

- 建立 PRD、架构、API、数据模型、Skill Catalog 文档。
- 确定 Python 包结构。
- 定义核心 Schema。
- 设计 CLI 命令。

交付：

- 完整 docs 目录。
- README 项目入口。
- 后续可直接进入代码实现。

## Phase 2：MVP Runtime

目标：跑通单机多 Agent 协作闭环。

任务：

- 实现 Agent Profile 加载。
- 实现 Task Orchestrator 状态机。
- 实现 Memory Manager 文件存储。
- 实现 Skill Registry。
- 实现规则版 Skill Scheduler。
- 实现 Typer CLI。

验收：

- 支持创建 3 个 Agent。
- 支持执行 1 个完整任务。
- 支持输出 JSON 结果。
- 支持查看任务事件日志。

## Phase 3：Skill 能力增强

目标：让系统具备实际任务处理能力。

任务：

- planning Skill。
- file_io Skill。
- code_runner Skill。
- review Skill。
- summarize Skill。
- LLM Provider 抽象层。

验收：

- 至少 5 个 Skill 可被调度。
- 同一任务至少调用 2 个 Skill。
- Skill 调用失败可记录并继续返回错误结构。

## Phase 4：并发与隔离

目标：提升任务执行效率和安全性。

任务：

- 使用 asyncio 并发调用 LLM / IO 型 Skill。
- 使用 multiprocessing 隔离 code_runner。
- 增加超时控制。
- 增加任务取消能力。

验收：

- 支持并发执行多个轻量 Skill。
- code_runner 超时不会阻塞主进程。
- 事件日志记录每个 Skill 耗时。

## Phase 5：测试与工程化

目标：达到可维护项目水准。

任务：

- 单元测试覆盖 Scheduler、Memory、Skill Registry。
- 集成测试覆盖 task run。
- Dockerfile。
- GitHub Actions。
- 示例任务与示例输出。

验收：

- 核心模块 10+ 个测试。
- Docker 镜像可构建。
- CI 能运行 lint 与 test。

## Phase 6：扩展方向

可选增强：

- FastAPI 服务化。
- Redis / PostgreSQL 持久化。
- FAISS 长期语义记忆。
- Web 执行可视化。
- Kubernetes 部署清单。
- 基于历史成功率的 Skill Ranking。

