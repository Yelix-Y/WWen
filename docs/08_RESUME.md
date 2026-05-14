# 简历描述：多智能体协作与技能调度引擎 - AgentMesh

## 项目名称

多智能体协作与技能调度引擎 - AgentMesh

## 技术栈

Python / asyncio / multiprocessing / Click / Typer / LLM / Docker

## 简历版描述

设计并开发 AgentMesh 多智能体协作与技能调度引擎，基于 Python 构建 Agent Runtime、Skill Registry、任务编排器和独立记忆模块，支持 Planner / Executor / Reviewer 多角色协作、动态 Skill 调度、结构化结果输出与 Docker 化运行。项目使用 asyncio 提升 LLM 与 IO 型 Skill 的并发执行效率，使用 multiprocessing 对代码执行类 Skill 进行进程隔离，并通过 Click / Typer 提供开发者友好的 Agent-CLI。

## 核心功能与实现

1. 多智能体协作运行时  
   设计 Planner、Executor、Reviewer 三类 Agent 角色，支持任务规划、执行、审查分层处理；通过统一 Agent Profile 管理角色提示词、可用 Skill 和运行状态，使复杂任务从单 Agent 串行响应升级为多角色协作流程。

2. Skill 动态调度机制  
   实现 Skill Registry 与 Skill Scheduler，统一维护 Skill 名称、标签、输入输出 Schema、安全等级和调用入口；MVP 规划支持 5+ 个基础 Skill，包括 planning、memory_search、file_io、code_runner、review，并支持后续扩展为 LLM Router。

3. Agent 独立记忆系统  
   为每个 Agent 设计隔离 Memory Store，区分 short-term context 与 long-term memory；每条记忆绑定 agent_id、task_id、importance 和 metadata，避免多 Agent 协作中的上下文污染，并支持跨任务状态延续。

4. 异步任务执行与并发优化  
   使用 asyncio 处理 LLM 调用、文件 IO 和多个轻量 Skill 的并发执行，降低多 Skill 串行调用等待时间；任务执行过程记录 duration_ms、status、error 等指标，方便后续性能分析。

5. 高风险 Skill 进程隔离  
   对 code_runner 等可能阻塞或失败的 Skill 使用 multiprocessing 进行隔离执行，配合 timeout、exit_code、stdout、stderr 结构化返回，降低单个 Skill 异常对主调度流程的影响。

6. 结构化输出与事件日志  
   设计 TaskResult、SkillInvocation、TaskEvent 等统一 Schema，记录任务状态流转、Agent 决策、Skill 调用结果和错误信息；支持任务执行过程可追踪、可回放、可调试。

7. Agent-CLI 工具链  
   基于 Click / Typer 设计命令行入口，规划支持 agent create、task run、task status、memory show、skill list 等 8+ 个命令，方便本地开发、演示和自动化脚本集成。

8. Docker 化工程交付  
   使用 Docker 固化 Python 运行环境、依赖安装和 CLI 启动方式，目标支持一条命令完成本地运行，提升项目复现能力和交付完整度。

## 可量化亮点

- 支持 3+ 类 Agent 角色：Planner、Executor、Reviewer。
- 规划 5+ 个可复用 Skill：planning、memory_search、file_io、code_runner、review。
- 设计 8+ 个 CLI 命令，覆盖 Agent 管理、任务执行、记忆查询与 Skill 管理。
- 核心数据结构覆盖 Agent、Task、MemoryItem、Skill、SkillInvocation、TaskEvent 6 类实体。
- 任务执行链路记录 100% Skill 调用状态、耗时和错误信息。
- Docker 化部署目标为 1 条命令启动本地运行环境。

## 面试讲解重点

- 为什么采用多 Agent 分工：把规划、执行、审查拆开，降低单 Agent 输出不稳定风险。
- 为什么采用 Skill Registry：把能力模块插件化，新增 Skill 不需要改核心执行流程。
- 为什么同时使用 asyncio 和 multiprocessing：asyncio 负责 IO 并发，multiprocessing 负责高风险任务隔离。
- 为什么优先做 CLI：MVP 更轻，便于测试、复现和展示核心引擎能力。
- 如何避免记忆污染：MemoryItem 强绑定 agent_id，短期上下文与长期记忆分层管理。

