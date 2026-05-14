# AgentMesh Skill Catalog

## 1. Skill 设计规范

每个 Skill 必须包含：

- name：唯一名称。
- description：能力说明。
- tags：调度标签。
- input_schema：输入结构。
- output_schema：输出结构。
- timeout_seconds：最大执行时间。
- safe_level：安全等级。

Skill 元数据示例：

```json
{
  "name": "planning",
  "description": "把复杂任务拆解为可执行步骤。",
  "tags": ["planning", "task"],
  "timeout_seconds": 30,
  "safe_level": "safe"
}
```

## 2. MVP Skill 清单

| Skill | 功能 | 输入 | 输出 | 可行性 | 优先级 |
| --- | --- | --- | --- | --- | --- |
| planning | 拆解复杂任务，生成执行计划 | task_goal, context | steps, dependencies | 容易 | P0 |
| memory_search | 查询 Agent 历史记忆 | agent_id, query | memories, scores | 中等 | P0 |
| file_io | 读取、写入项目文件 | path, operation, content | status, file_summary | 中等 | P0 |
| code_runner | 执行受控命令或脚本 | command, timeout | stdout, stderr, exit_code | 中等 | P0 |
| review | 审查任务结果和风险 | task_result, criteria | issues, suggestions | 容易 | P0 |
| summarize | 生成任务摘要和长期记忆 | events, result | summary, memory_items | 容易 | P1 |
| llm_call | 调用 LLM 完成自然语言推理 | prompt, schema | structured_response | 中等 | P1 |
| web_research | 外部信息检索 | query, limit | sources, notes | 中等 | P2 |

## 3. Skill 输入输出示例

### planning

输入：

```json
{
  "task_goal": "为 AgentMesh 生成技术架构文档",
  "context": "项目目标是多智能体协作与技能调度"
}
```

输出：

```json
{
  "steps": [
    {
      "step_id": "step_001",
      "title": "确认模块边界",
      "required_skills": ["memory_search", "planning"]
    }
  ],
  "dependencies": []
}
```

### code_runner

输入：

```json
{
  "command": "pytest tests",
  "timeout_seconds": 60,
  "working_dir": "."
}
```

输出：

```json
{
  "exit_code": 0,
  "stdout": "10 passed",
  "stderr": "",
  "duration_ms": 1200
}
```

## 4. Skill 组合方式

### 文档生成链路

```text
planning -> memory_search -> file_io -> review -> summarize
```

### 代码任务链路

```text
planning -> file_io -> code_runner -> review -> summarize
```

### 多 Agent 协作链路

```text
Planner Agent: planning + memory_search
Executor Agent: file_io + code_runner + llm_call
Reviewer Agent: review + summarize
```

## 5. 安全等级

| 等级 | 说明 | 示例 |
| --- | --- | --- |
| safe | 只读或纯推理 | planning, review |
| controlled | 可写文件或调用外部 API | file_io, llm_call |
| isolated | 需要进程隔离或超时控制 | code_runner |

