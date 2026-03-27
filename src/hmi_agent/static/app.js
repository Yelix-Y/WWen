const requirementEl = document.getElementById("requirement");
const configFileEl = document.getElementById("configFile");
const outputRootEl = document.getElementById("outputRoot");
const offlineDemoEl = document.getElementById("offlineDemo");
const statusEl = document.getElementById("status");
const runListEl = document.getElementById("runList");
const reportViewerEl = document.getElementById("reportViewer");

const summaryRunIdEl = document.getElementById("summaryRunId");
const summaryCaseCountEl = document.getElementById("summaryCaseCount");
const summaryPassRateEl = document.getElementById("summaryPassRate");
const summaryModelEl = document.getElementById("summaryModel");

document.getElementById("runBtn").addEventListener("click", startRun);
document.getElementById("refreshBtn").addEventListener("click", refreshRuns);

requirementEl.value = `# 蓝牙连接场景\n\n用户在车机蓝牙页面搜索手机设备，完成配对连接后，车机状态应显示已连接，APP侧同步显示车机在线。\n\n验收点：\n1. 车机端可发现手机设备。\n2. 输入配对码后连接成功。\n3. APP状态在30秒内刷新为在线。\n4. 连接失败时有可读错误提示并可重试。`;

refreshRuns();

function setStatus(message, kind = "") {
  statusEl.className = `status ${kind}`.trim();
  statusEl.textContent = message;
}

function updateSummary(report) {
  const runs = report.execution_results || [];
  const passCount = runs.filter((item) => item.passed).length;
  const passRate = runs.length ? `${Math.round((passCount / runs.length) * 100)}%` : "0%";

  summaryRunIdEl.textContent = report.run_id || "-";
  summaryCaseCountEl.textContent = `${report.generated_case_count ?? 0}`;
  summaryPassRateEl.textContent = passRate;
  summaryModelEl.textContent = report.model || "-";
}

async function startRun() {
  setStatus("正在执行测试流程，请稍候...", "");

  const payload = {
    requirement_text: requirementEl.value,
    config_file: configFileEl.value,
    output_root: outputRootEl.value,
    offline_demo: offlineDemoEl.checked,
  };

  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "运行失败");
    }

    const result = await response.json();
    setStatus(`运行成功: ${result.run_id}`, "ok");

    renderReport(result.report);
    await refreshRuns();
  } catch (error) {
    setStatus(`运行失败: ${error.message}`, "error");
  }
}

async function refreshRuns() {
  runListEl.innerHTML = "<p>加载中...</p>";

  try {
    const outputRoot = encodeURIComponent(outputRootEl.value || "runs");
    const response = await fetch(`/api/runs?output_root=${outputRoot}`);
    if (!response.ok) {
      throw new Error("获取历史运行失败");
    }

    const result = await response.json();
    renderRunList(result.runs || []);
  } catch (error) {
    runListEl.innerHTML = `<p>加载失败: ${error.message}</p>`;
  }
}

function renderRunList(runs) {
  if (!runs.length) {
    runListEl.innerHTML = "<p>暂无历史运行。</p>";
    return;
  }

  runListEl.innerHTML = "";
  runs.forEach((run) => {
    const item = document.createElement("article");
    item.className = "run-item";
    item.innerHTML = `
      <h4>${run.run_id}</h4>
      <p>${run.created_at || "-"}</p>
      <p>${run.has_report ? "有报告" : "无报告"}</p>
    `;
    item.addEventListener("click", () => loadRunReport(run.run_id));
    runListEl.appendChild(item);
  });
}

async function loadRunReport(runId) {
  try {
    const outputRoot = encodeURIComponent(outputRootEl.value || "runs");
    const response = await fetch(`/api/runs/${runId}/report?output_root=${outputRoot}`);
    if (!response.ok) {
      throw new Error(`获取报告失败: ${runId}`);
    }

    const report = await response.json();
    setStatus(`已加载报告: ${runId}`, "ok");
    renderReport(report);
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function renderReport(report) {
  updateSummary(report);
  reportViewerEl.textContent = JSON.stringify(report, null, 2);
}
