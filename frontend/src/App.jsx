import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const defaultRequirement = `# 蓝牙连接场景

用户在车机蓝牙页面搜索手机设备，完成配对连接后，车机状态应显示已连接，APP 侧同步显示车机在线。

验收点:
1. 车机端可发现手机设备。
2. 输入配对码后连接成功。
3. APP 状态在 30 秒内刷新为在线。
4. 连接失败时有可读错误提示并可重试。`;

const suggestionPrompts = [
  {
    title: "Bluetooth Pairing",
    subtitle: "Success path + retry branch",
    prompt: "验证车机蓝牙配对成功、配对码错误重试、以及 APP 在线状态同步刷新。",
  },
  {
    title: "Popup Interference",
    subtitle: "Unexpected modal handling",
    prompt: "设计一个 HMI 自动化场景，覆盖系统弹窗打断、弹窗关闭后流程恢复、以及状态不丢失。",
  },
  {
    title: "Markdown Report",
    subtitle: "Readable root-cause output",
    prompt: "生成一个包含步骤、断言、风险点和日志根因候选的车机导航搜索测试需求。",
  },
  {
    title: "APP + HMI Sync",
    subtitle: "Cross-surface validation",
    prompt: "验证车机端执行蓝牙连接后，移动 APP 侧在 30 秒内同步显示在线，失败时给出可追踪提示。",
  },
];

const welcomeMessage = {
  id: createId(),
  role: "assistant",
  meta: "Design System Ready",
  content: [
    "## Welcome to the React workspace",
    "- 左侧 Sidebar 用于配置、线程切换和 run history 回放。",
    "- 中间 Conversation Stream 用 Markdown-first 方式展示需求、报告摘要、JSON 与 root cause signals。",
    "- 底部 Composer 保持 GPT 风格：固定、自动增高、Enter 发送、Shift+Enter 换行。",
    "",
    "发一个 HMI requirement 过来，然后点 **Send**。",
  ].join("\n"),
};

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function deriveThreadTitle(messages) {
  const latestUserMessage = [...messages].reverse().find((item) => item.role === "user");
  if (!latestUserMessage) {
    return "New conversation";
  }
  const firstLine = latestUserMessage.content.split("\n").find((line) => line.trim()) || latestUserMessage.content;
  return firstLine.replace(/^#\s*/, "").slice(0, 36) || "New conversation";
}

function buildRunMarkdown(report, manifest) {
  const results = report.execution_results || [];
  const passed = results.filter((item) => item.passed).length;
  const passRate = results.length ? `${Math.round((passed / results.length) * 100)}%` : "0%";

  const executionLines = results.length
    ? results
        .map((item) => {
          const stepCount = item.step_results ? item.step_results.length : 0;
          const status = item.passed ? "Passed" : "Failed";
          return `- **${item.case_id}** · ${status} · ${stepCount} steps`;
        })
        .join("\n")
    : "- No execution results returned.";

  const rootCause = report.root_cause_candidates || {};
  const rootCauseLines = Object.entries(rootCause).length
    ? Object.entries(rootCause)
        .map(([artifact, items]) => `- **${artifact}** · ${(items || []).length} candidate(s)`)
        .join("\n")
    : "- No root cause candidates emitted.";

  const manifestBlock = manifest
    ? ["", "## Run Manifest", "", "```json", JSON.stringify(manifest, null, 2), "```"].join("\n")
    : "";

  return [
    "## Run Summary",
    "",
    `- **Run ID**: ${report.run_id || "-"}`,
    `- **Mode**: ${report.offline_demo ? "Offline Demo" : "Online QWen"}`,
    `- **Model**: ${report.model || "-"}`,
    `- **Generated Cases**: ${report.generated_case_count ?? 0}`,
    `- **Pass Rate**: ${passRate}`,
    manifest?.config_file ? `- **Config File**: ${manifest.config_file}` : null,
    "",
    "## Execution Overview",
    "",
    executionLines,
    "",
    "## Root Cause Signals",
    "",
    rootCauseLines,
    "",
    "## Raw Report",
    "",
    "```json",
    JSON.stringify(report, null, 2),
    "```",
    manifestBlock,
  ]
    .filter(Boolean)
    .join("\n");
}

function MessageActions({ onCopy, onReuse }) {
  return (
    <div className="message-actions">
      <button className="message-action" type="button" onClick={onCopy}>
        Copy
      </button>
      <button className="message-action" type="button" onClick={onReuse}>
        Reuse prompt
      </button>
    </div>
  );
}

function CodeBlock({ inline, className, children, ...props }) {
  const text = String(children).replace(/\n$/, "");

  if (inline) {
    return (
      <code className="inline-code" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="code-shell">
      <button className="code-copy-btn" type="button" onClick={() => navigator.clipboard.writeText(text)}>
        Copy code
      </button>
      <pre>
        <code className={className} {...props}>
          {text}
        </code>
      </pre>
    </div>
  );
}

function AssistantMessage({ message, onCopy, onReuse }) {
  return (
    <article className="message message-assistant">
      <div className="message-avatar" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3l2.4 2.1 3.2-.2 1.5 2.8 2.9 1.3-.4 3.1 1.9 2.5-1.9 2.5.4 3.1-2.9 1.3-1.5 2.8-3.2-.2L12 21l-2.4 2.1-3.2-.2-1.5-2.8-2.9-1.3.4-3.1L.5 12l1.9-2.5-.4-3.1 2.9-1.3 1.5-2.8 3.2.2L12 3z" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="message-main">
        <div className="message-meta">
          <span>Agent Output</span>
          <span>{message.meta || "Live response"}</span>
        </div>
        <div className="markdown-body">
          {message.pending ? (
            <div className="typing-dots" aria-label="loading">
              <span />
              <span />
              <span />
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{ code: CodeBlock }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        {!message.pending ? <MessageActions onCopy={onCopy} onReuse={onReuse} /> : null}
      </div>
    </article>
  );
}

function UserMessage({ message }) {
  return (
    <article className="message message-user">
      <div className="user-bubble">
        <div className="message-meta">
          <span>User Prompt</span>
          <span>{message.meta || "Just now"}</span>
        </div>
        <div className="user-content">{message.content}</div>
      </div>
    </article>
  );
}

function SuggestionCard({ item, onClick }) {
  return (
    <button className="suggestion-card" type="button" onClick={() => onClick(item.prompt)}>
      <div className="suggestion-top">
        <div>
          <p className="suggestion-title">{item.title}</p>
          <p className="suggestion-subtitle">{item.subtitle}</p>
        </div>
        <span className="suggestion-tag">Prompt</span>
      </div>
      <p className="suggestion-body">{item.prompt}</p>
    </button>
  );
}

function Sidebar({
  runs,
  activeRunId,
  configFile,
  outputRoot,
  offlineDemo,
  onConfigChange,
  onOutputChange,
  onOfflineToggle,
  onRefresh,
  onSelectRun,
  onNewChat,
  sidebarOpen,
  onCloseSidebar,
}) {
  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header-row">
          <div className="sidebar-brand">
            <div className="brand-badge">
              <svg viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3l2.4 2.1 3.2-.2 1.5 2.8 2.9 1.3-.4 3.1 1.9 2.5-1.9 2.5.4 3.1-2.9 1.3-1.5 2.8-3.2-.2L12 21l-2.4 2.1-3.2-.2-1.5-2.8-2.9-1.3.4-3.1L.5 12l1.9-2.5-.4-3.1 2.9-1.3 1.5-2.8 3.2.2L12 3z" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="eyebrow">Automotive Agent</p>
              <h1>HMI Test Agent</h1>
            </div>
          </div>

          <button className="icon-btn mobile-only" type="button" onClick={onCloseSidebar} aria-label="关闭侧边栏">
            <svg viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="sidebar-copy">ChatGPT-like workspace for requirement-driven HMI validation and run report playback.</p>

        <button className="new-chat-btn" type="button" onClick={onNewChat}>
          <svg viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          New chat
        </button>

        <div className="settings-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Run Settings</p>
              <p className="section-copy">Runtime configuration synced with the existing backend API.</p>
            </div>
            <span className={`mode-badge ${offlineDemo ? "mode-badge-offline" : ""}`}>{offlineDemo ? "Offline" : "Online"}</span>
          </div>

          <label className="field-label" htmlFor="configFile">Config File</label>
          <input id="configFile" value={configFile} onChange={(event) => onConfigChange(event.target.value)} />

          <label className="field-label" htmlFor="outputRoot">Output Root</label>
          <input id="outputRoot" value={outputRoot} onChange={(event) => onOutputChange(event.target.value)} />

          <label className="toggle-row">
            <span>Offline Demo</span>
            <input checked={offlineDemo} onChange={(event) => onOfflineToggle(event.target.checked)} type="checkbox" />
          </label>

          <button className="secondary-btn block-btn" type="button" onClick={onRefresh}>Refresh History</button>
        </div>

        <div className="history-panel">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Recent Threads</p>
              <p className="section-copy">Replay previous reports like conversation threads.</p>
            </div>
            <span className="count-badge">{runs.length}</span>
          </div>

          <div className="thread-list">
            {!runs.length ? (
              <div className="empty-history">No run history yet. Start a new conversation to create your first report thread.</div>
            ) : (
              runs.map((run) => {
                const title = run.run_id.replace(/^run-/, "").replace(/-/g, " ");
                return (
                  <button
                    key={run.run_id}
                    className={`thread-item ${run.run_id === activeRunId ? "is-active" : ""}`}
                    type="button"
                    onClick={() => onSelectRun(run.run_id)}
                  >
                    <div>
                      <p className="thread-title">{title}</p>
                      <p className="thread-time">{formatDate(run.created_at)}</p>
                    </div>
                    <span className={`thread-tag ${run.has_report ? "thread-tag-report" : ""}`}>{run.has_report ? "Report" : "Pending"}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </aside>

      {sidebarOpen ? <button className="sidebar-backdrop" type="button" onClick={onCloseSidebar} aria-label="关闭侧边栏遮罩" /> : null}
    </>
  );
}

function Header({ threadTitle, model, status, statusTone, onOpenSidebar }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-title-row">
          <button className="icon-btn mobile-only" type="button" onClick={onOpenSidebar} aria-label="打开侧边栏">
            <svg viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <div>
            <p className="eyebrow">Principal Frontend Surface</p>
            <h2>{threadTitle}</h2>
          </div>
        </div>

        <div className="topbar-pills">
          <span className="pill desktop-only">Model: {model}</span>
          <span className={`pill pill-status pill-${statusTone}`}>{status}</span>
        </div>
      </div>
    </header>
  );
}

function HomePanel({ hidden, onSuggestionClick }) {
  return (
    <section className={`home-panel ${hidden ? "home-hidden" : ""}`}>
      <div className="home-inner">
        <div className="hero-badge-icon">
          <svg viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3l2.4 2.1 3.2-.2 1.5 2.8 2.9 1.3-.4 3.1 1.9 2.5-1.9 2.5.4 3.1-2.9 1.3-1.5 2.8-3.2-.2L12 21l-2.4 2.1-3.2-.2-1.5-2.8-2.9-1.3.4-3.1L.5 12l1.9-2.5-.4-3.1 2.9-1.3 1.5-2.8 3.2.2L12 3z" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="hero-pill-row">
          <span className="hero-pill hero-pill-primary">ChatGPT-like UI</span>
          <span className="hero-pill">Markdown Ready</span>
          <span className="hero-pill">Code Highlight</span>
        </div>

        <h3>How can I help with your HMI validation today?</h3>
        <p className="hero-copy">
          把需求像聊天一样发给 Agent，后端继续走你现有的 Prefect + QWen pipeline，前端只负责把运行结果用更克制、可读、可复制的形式呈现出来。
        </p>

        <div className="suggestion-grid">
          {suggestionPrompts.map((item) => (
            <SuggestionCard key={item.title} item={item} onClick={onSuggestionClick} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Composer({ value, onChange, onSend, onClear, offlineDemo, disabled }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 224)}px`;
  }, [value]);

  return (
    <div className="composer-shell">
      <div className="composer-card">
        <div className="composer-header">
          <div>
            <p className="eyebrow">Prompt Composer</p>
            <p className="section-copy">Shift + Enter newline, Enter submit. Auto-resize textarea enabled.</p>
          </div>
          <div className="composer-tags desktop-only">
            <span>Agent</span>
            <span>HMI</span>
            <span>QWen</span>
          </div>
        </div>

        <textarea
          ref={textareaRef}
          className="composer-textarea"
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Describe the HMI scenario, acceptance criteria, edge cases, or the exact automotive workflow you want the Agent to validate..."
        />

        <div className="composer-footer">
          <div className="composer-footer-copy">
            <p>Backend placeholder lives in the React fetch helper <strong>callAgentBackend</strong>.</p>
            <p>{offlineDemo ? "Offline demo mode active." : "Online QWen mode active."}</p>
          </div>

          <div className="composer-actions">
            <span className="composer-mode-pill desktop-only">{offlineDemo ? "Offline Demo" : "Online QWen"}</span>
            <button className="secondary-btn" type="button" onClick={onClear}>Clear</button>
            <button className="primary-btn" type="button" onClick={onSend} disabled={disabled}>
              <svg viewBox="0 0 24 24" className="icon" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {disabled ? "Running" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function callAgentBackend(payload) {
  const response = await fetch("/api/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = "Request failed.";
    try {
      const errorPayload = await response.json();
      detail = errorPayload.detail || detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new Error(detail);
  }

  return response.json();
}

export default function App() {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [composerValue, setComposerValue] = useState(defaultRequirement);
  const [configFile, setConfigFile] = useState("configs/qwen3_vl.json");
  const [outputRoot, setOutputRoot] = useState("runs");
  const [offlineDemo, setOfflineDemo] = useState(false);
  const [runs, setRuns] = useState([]);
  const [activeRunId, setActiveRunId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState({ text: "Idle", tone: "neutral" });
  const [model, setModel] = useState("qwen3-vl:235b");
  const scrollRef = useRef(null);

  useEffect(() => {
    refreshRuns();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function refreshRuns() {
    setStatus({ text: "Refreshing history...", tone: "neutral" });
    try {
      const response = await fetch(`/api/runs?output_root=${encodeURIComponent(outputRoot || "runs")}`);
      if (!response.ok) {
        throw new Error("Failed to load history.");
      }
      const data = await response.json();
      setRuns(data.runs || []);
      setStatus({ text: "History synced.", tone: "neutral" });
    } catch (error) {
      setRuns([]);
      setStatus({ text: error.message || "Failed to load history.", tone: "error" });
    }
  }

  function resetConversation() {
    setMessages([welcomeMessage]);
    setComposerValue(defaultRequirement);
    setActiveRunId(null);
    setStatus({ text: "Conversation cleared.", tone: "neutral" });
    setSidebarOpen(false);
  }

  async function loadRunReport(runId) {
    try {
      setStatus({ text: `Loading ${runId}...`, tone: "loading" });
      const encodedOutputRoot = encodeURIComponent(outputRoot || "runs");
      const [reportResponse, manifestResponse] = await Promise.all([
        fetch(`/api/runs/${runId}/report?output_root=${encodedOutputRoot}`),
        fetch(`/api/runs/${runId}/manifest?output_root=${encodedOutputRoot}`),
      ]);

      if (!reportResponse.ok) {
        throw new Error(`Failed to load report for ${runId}.`);
      }

      const report = await reportResponse.json();
      const manifest = manifestResponse.ok ? await manifestResponse.json() : null;

      setActiveRunId(runId);
      setModel(report.model || "unknown");
      setMessages([
        welcomeMessage,
        {
          id: createId(),
          role: "assistant",
          meta: `History replay · ${runId}`,
          content: buildRunMarkdown(report, manifest),
        },
      ]);
      setStatus({ text: `Loaded ${runId}.`, tone: "success" });
      setSidebarOpen(false);
    } catch (error) {
      setStatus({ text: error.message || "Failed to load run report.", tone: "error" });
    }
  }

  async function startRun() {
    if (isLoading) {
      return;
    }

    const requirement = composerValue.trim();
    if (!requirement) {
      setStatus({ text: "Requirement is empty.", tone: "error" });
      return;
    }

    setIsLoading(true);
    setStatus({ text: "Agent is running...", tone: "loading" });

    const payload = {
      requirement_text: requirement,
      config_file: configFile.trim() || "configs/qwen3_vl.json",
      output_root: outputRoot.trim() || "runs",
      offline_demo: offlineDemo,
    };

    const userMessage = {
      id: createId(),
      role: "user",
      meta: formatDate(new Date().toISOString()),
      content: requirement,
    };
    const pendingMessage = {
      id: createId(),
      role: "assistant",
      meta: offlineDemo ? "Offline demo run" : "Online QWen run",
      pending: true,
      content: "",
    };

    setMessages((current) => [...current, userMessage, pendingMessage]);

    try {
      const result = await callAgentBackend(payload);
      setActiveRunId(result.run_id);
      setModel(result.report?.model || "unknown");
      setMessages((current) =>
        current.map((item) =>
          item.id === pendingMessage.id
            ? {
                ...item,
                pending: false,
                meta: `Run ${result.run_id}`,
                content: buildRunMarkdown(result.report, result.manifest),
              }
            : item
        )
      );
      setStatus({ text: `Completed: ${result.run_id}`, tone: "success" });
      await refreshRuns();
    } catch (error) {
      setMessages((current) =>
        current.map((item) =>
          item.id === pendingMessage.id
            ? {
                ...item,
                pending: false,
                meta: "Execution failed",
                content: [
                  "## Runtime Error",
                  "",
                  `> ${error.message}`,
                  "",
                  "请检查 config file、network path、API availability，或者切回 Offline Demo 先验证端到端流程。",
                ].join("\n"),
              }
            : item
        )
      );
      setStatus({ text: "Execution failed.", tone: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  const threadTitle = deriveThreadTitle(messages);
  const showHome = !messages.some((item) => item.role === "user") && !activeRunId;

  return (
    <div className="app-shell">
      <Sidebar
        runs={runs}
        activeRunId={activeRunId}
        configFile={configFile}
        outputRoot={outputRoot}
        offlineDemo={offlineDemo}
        onConfigChange={setConfigFile}
        onOutputChange={setOutputRoot}
        onOfflineToggle={setOfflineDemo}
        onRefresh={refreshRuns}
        onSelectRun={loadRunReport}
        onNewChat={resetConversation}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
      />

      <div className="app-main">
        <Header
          threadTitle={threadTitle}
          model={model}
          status={status.text}
          statusTone={status.tone}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main ref={scrollRef} className="chat-layout">
          <HomePanel hidden={!showHome} onSuggestionClick={setComposerValue} />

          <section className="message-list">
            {messages.map((message) =>
              message.role === "user" ? (
                <UserMessage key={message.id} message={message} />
              ) : (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  onCopy={() => navigator.clipboard.writeText(message.content || "")}
                  onReuse={() => setComposerValue(message.content || "")}
                />
              )
            )}
          </section>
        </main>

        <Composer
          value={composerValue}
          onChange={setComposerValue}
          onSend={startRun}
          onClear={resetConversation}
          offlineDemo={offlineDemo}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}