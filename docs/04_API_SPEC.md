# AgentMesh API 与 Schema 设计

AgentMesh MVP 以 CLI 和 Python Engine API 为主，后续可平滑封装为 FastAPI REST 服务。

## 1. CLI API

### 创建 Agent

```bash
agentmesh agent create \
  --name planner \
  --role planner \
  --skills planning,memory_search,review
```

输出：

```json
{
  "agent_id": "agent_001",
  "name": "planner",
  "role": "planner",
  "status": "created"
}
```

### 运行任务

```bash
agentmesh task run \
  --agent planner \
  --input "生成 AgentMesh 的 MVP 技术方案" \
  --output json
```

输出：

```json
{
  "task_id": "task_001",
  "status": "completed",
  "agents": ["planner", "executor", "reviewer"],
  "skill_invocations": 5,
  "result": {
    "summary": "已生成 MVP 技术方案",
    "artifacts": ["docs/02_ARCHITECTURE.md"]
  }
}
```

### 查询任务

```bash
agentmesh task status --task-id task_001
```

### 查看记忆

```bash
agentmesh memory show --agent planner
```

### 查看 Skill

```bash
agentmesh skill list
```

## 2. Engine API

### AgentRuntime.run

```python
result = await agent_runtime.run(
    agent_id="agent_001",
    task_input={
        "goal": "生成技术架构文档",
        "constraints": ["中文", "可落地", "包含流程图"]
    }
)
```

### SkillScheduler.select

```python
skills = scheduler.select(
    task_goal="生成技术架构文档",
    agent_role="planner",
    allowed_skills=["planning", "memory_search"]
)
```

### SkillExecutor.invoke

```python
output = await executor.invoke(
    skill_name="planning",
    payload={
        "task_goal": "生成技术架构文档",
        "context": "AgentMesh 是多智能体协作引擎"
    }
)
```

## 3. 核心 Schema

### Agent

```json
{
  "agent_id": "string",
  "name": "string",
  "role": "planner | executor | reviewer | custom",
  "system_prompt": "string",
  "allowed_skills": ["string"],
  "memory_policy": {
    "short_term_limit": 20,
    "long_term_enabled": true
  },
  "created_at": "datetime"
}
```

### Task

```json
{
  "task_id": "string",
  "input": "string",
  "status": "created | planning | running | reviewing | completed | failed",
  "assigned_agents": ["string"],
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### SkillInvocation

```json
{
  "invocation_id": "string",
  "task_id": "string",
  "agent_id": "string",
  "skill_name": "string",
  "input": {},
  "output": {},
  "status": "success | failed | timeout",
  "duration_ms": 0,
  "error": null
}
```

### TaskResult

```json
{
  "task_id": "string",
  "status": "completed",
  "summary": "string",
  "artifacts": [
    {
      "type": "file",
      "path": "docs/02_ARCHITECTURE.md"
    }
  ],
  "metrics": {
    "agent_count": 3,
    "skill_invocation_count": 5,
    "duration_ms": 10000
  }
}
```

## 4. 后续 REST API 映射

| CLI / Engine 能力 | REST API |
| --- | --- |
| agent create | POST /agents |
| agent list | GET /agents |
| task run | POST /tasks |
| task status | GET /tasks/{task_id} |
| memory show | GET /agents/{agent_id}/memories |
| skill list | GET /skills |
| skill invoke | POST /skills/{skill_name}/invoke |

