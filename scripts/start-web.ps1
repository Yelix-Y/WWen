Param(
    [string]$BindHost = "127.0.0.1",
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

$Python = Join-Path $RepoRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $Python)) {
    Write-Host "[ERROR] Virtual environment not found: .venv" -ForegroundColor Red
    Write-Host "Run: py -3.12 -m venv .venv" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/2] Installing project dependencies..." -ForegroundColor Cyan
& $Python -m pip install -e .

Write-Host "[2/2] Starting web UI on http://$BindHost`:$Port" -ForegroundColor Cyan
& $Python -m hmi_agent.webapp --host $BindHost --port $Port
