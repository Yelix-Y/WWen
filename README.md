# Automotive HMI Test Agent (QWen)

基于本地/内网 QWen 模型的测试Agent骨架，目标能力：
1. 自动写Case
2. 自动跑Case
3. 自动观察Case日志并给出根因候选

当前为MVP骨架版本，已包含：
1. 配置读取与校验（从 configs/qwen3_vl.json 解析并支持环境变量覆盖）
2. 需求到Case生成链路（QWen调用 + Schema校验）
3. 执行与日志观察骨架（Mock Driver + 规则归因）
4. Prefect端到端编排入口
5. Web前端控制台（可视化发起运行与查看报告）

## 目录结构

```text
.
├─configs/
│  ├─qwen_config.json
│  └─qwen3_vl.json
├─requirements/
│  └─sample_requirement.md
├─frontend/
│  ├─package.json
│  ├─vite.config.js
│  └─src/
│     ├─App.jsx
│     ├─main.jsx
│     └─styles.css
├─src/hmi_agent/
│  ├─config.py
│  ├─models.py
│  ├─generator.py
│  ├─executor.py
│  ├─observer.py
│  ├─orchestrator.py
│  ├─main.py
│  ├─webapp.py
│  └─static/
│     ├─index.html
│     └─assets/
├─tests/
│  └─test_config.py
└─.github/
	├─copilot-instructions.md
	├─prompts/
	└─agents/
```

## 环境准备

1. Python 3.11+
2. 安装依赖

```powershell
pip install -e .
npm --prefix frontend install
```

3. 设置QWen密钥（示例）

```powershell
$env:QWEN_API_KEY="your-real-key"
```

如果你暂时没有可用密钥，可先使用离线演示模式跑通闭环。

## 运行方式

### 1) 命令行方式

```powershell
c:/My/WWen/.venv/Scripts/python.exe -m hmi_agent.main --requirement-file requirements/sample_requirement.md --config-file configs/qwen3_vl.json --output-root runs
```

离线演示模式：

```powershell
c:/My/WWen/.venv/Scripts/python.exe -m hmi_agent.main --offline-demo --requirement-file requirements/sample_requirement.md --config-file configs/qwen3_vl.json --output-root runs
```

### 2) Web前端方式（推荐新手）

启动服务：

```powershell
npm --prefix frontend run build
c:/My/WWen/.venv/Scripts/python.exe -m hmi_agent.webapp --host 127.0.0.1 --port 8080
```

前端开发模式（React + Vite，推荐做 UI 调整时使用）：

```powershell
c:/My/WWen/.venv/Scripts/python.exe -m hmi_agent.webapp --host 127.0.0.1 --port 8080
npm --prefix frontend run dev
```

然后打开：

```text
http://127.0.0.1:5173
```

说明：Vite 开发服务器会把 `/api/*` 自动代理到 `http://127.0.0.1:8080`。

注意：React + Vite 依赖 `npm install` 从 npm registry 拉取前端包。如果当前机器无法访问 `https://registry.npmjs.org/`，则无法完成前端构建；此时启动脚本会自动回退到仓库中已有的静态资源继续启动后端页面。

或一键脚本：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-web.ps1
```

或双击启动（Windows）：

1. 在资源管理器中双击 scripts/start-web.bat
2. 自动安装依赖并启动前端
3. 自动打开浏览器 http://127.0.0.1:8080

浏览器打开：

```text
http://127.0.0.1:8080
```

在页面中：
1. 粘贴需求文本。
2. 勾选“离线演示模式”（新手推荐）。
3. 点击“开始运行”。
4. 在“历史运行”和“报告预览”中查看结果。

### 常见问题排查（很重要）

问题1：python.exe 命令有反应，但服务起不来。
原因：你可能调用的是系统Python，不是项目虚拟环境。
解决：始终使用项目解释器路径运行。

```powershell
c:/My/WWen/.venv/Scripts/python.exe -m pip install -e .
c:/My/WWen/.venv/Scripts/python.exe -m hmi_agent.webapp --host 127.0.0.1 --port 8080
```

问题2：报端口被占用。
解决：换端口。

```powershell
c:/My/WWen/.venv/Scripts/python.exe -m hmi_agent.webapp --host 127.0.0.1 --port 8090
```

问题3：.venv 不存在。
解决：先创建虚拟环境，再执行安装。

```powershell
py -3.12 -m venv .venv
c:/My/WWen/.venv/Scripts/python.exe -m pip install -e .
```

运行后会在 runs/<run_id>/ 生成：
1. report.json
2. run_manifest.json
3. *_execution.json

## 下一步建议

1. 将 MockAndroidDriver 替换为 Appium/uiautomator2 真设备驱动。
2. 增加接口执行器与真实日志采集器（logcat + APP日志）。
3. 在归因阶段接入QWen二次分析并输出证据引用。

