@echo off
setlocal

cd /d "%~dp0.."

set "HOST=127.0.0.1"
set "PORT=8080"
if not "%~1"=="" set "PORT=%~1"

set "PYTHON=%CD%\.venv\Scripts\python.exe"

if not exist "%PYTHON%" (
  echo [INFO] .venv not found. Creating virtual environment...
  py -3.12 -m venv .venv
  if errorlevel 1 (
    echo [ERROR] Failed to create .venv. Please install Python 3.12 first.
    pause
    exit /b 1
  )
)

echo [1/3] Upgrading pip...
"%PYTHON%" -m pip install --upgrade pip
if errorlevel 1 (
  echo [ERROR] pip upgrade failed.
  pause
  exit /b 1
)

echo [2/3] Installing project dependencies...
"%PYTHON%" -m pip install -e .
if errorlevel 1 (
  echo [ERROR] Dependency installation failed.
  pause
  exit /b 1
)

echo [3/3] Starting web UI at http://%HOST%:%PORT%
start "" "http://%HOST%:%PORT%"
"%PYTHON%" -m hmi_agent.webapp --host %HOST% --port %PORT%

if errorlevel 1 (
  echo [ERROR] Web service exited unexpectedly.
  pause
  exit /b 1
)

endlocal
