Param(
    [string]$BindHost = "127.0.0.1",
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$Python = Join-Path $RepoRoot ".venv\Scripts\python.exe"
$FrontendRoot = Join-Path $RepoRoot "frontend"
if (-not (Test-Path $Python)) {
    Write-Host "[ERROR] Virtual environment not found: .venv" -ForegroundColor Red
    Write-Host "Run: py -3.12 -m venv .venv" -ForegroundColor Yellow
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "[WARN] npm not found. Skipping React frontend build and serving existing static assets." -ForegroundColor Yellow
    Write-Host "[2/2] Starting web UI on http://$BindHost`:$Port" -ForegroundColor Cyan
    & $Python -m hmi_agent.webapp --host $BindHost --port $Port
    exit $LASTEXITCODE
}

Write-Host "[1/4] Installing project dependencies..." -ForegroundColor Cyan
& $Python -m pip install -e .

Write-Host "[2/4] Installing frontend dependencies..." -ForegroundColor Cyan
Push-Location $FrontendRoot
& npm install
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "[WARN] Frontend dependency installation failed. Falling back to existing static assets." -ForegroundColor Yellow
    Write-Host "[3/3] Starting web UI on http://$BindHost`:$Port" -ForegroundColor Cyan
    & $Python -m hmi_agent.webapp --host $BindHost --port $Port
    exit $LASTEXITCODE
}

Write-Host "[3/4] Building React frontend..." -ForegroundColor Cyan
& npm run build
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host "[WARN] Frontend build failed. Falling back to existing static assets." -ForegroundColor Yellow
    Write-Host "[4/4] Starting web UI on http://$BindHost`:$Port" -ForegroundColor Cyan
    & $Python -m hmi_agent.webapp --host $BindHost --port $Port
    exit $LASTEXITCODE
}
Pop-Location

Write-Host "[4/4] Starting web UI on http://$BindHost`:$Port" -ForegroundColor Cyan
& $Python -m hmi_agent.webapp --host $BindHost --port $Port
