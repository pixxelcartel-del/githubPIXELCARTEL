param(
  [int]$Port = $(if ($env:PORT) { [int]$env:PORT } else { 3001 }),
  [switch]$SkipBuild,
  [switch]$Background
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Stop-PortListeners {
  param([int]$TargetPort)

  $connections = Get-NetTCPConnection -LocalPort $TargetPort -ErrorAction SilentlyContinue |
    Where-Object { $_.OwningProcess -and $_.OwningProcess -ne $PID } |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($processId in $connections) {
    try {
      $process = Get-Process -Id $processId -ErrorAction Stop
      Write-Host "Stopping stale listener on port ${TargetPort}: $($process.ProcessName) ($processId)"
      Stop-Process -Id $processId -Force
    } catch {
      Write-Warning "Could not stop process $processId on port ${TargetPort}: $($_.Exception.Message)"
    }
  }
}

function Wait-ForDashboard {
  param([int]$TargetPort)

  $url = "http://127.0.0.1:$TargetPort/dashboard"
  for ($attempt = 1; $attempt -le 60; $attempt += 1) {
    try {
      $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
      if ($response.StatusCode -eq 200) {
        Write-Host "L2L local demo ready: $url"
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  throw "Timed out waiting for $url"
}

Stop-PortListeners -TargetPort $Port

if (-not $SkipBuild) {
  Write-Host "Building production demo..."
  & "C:\Program Files\nodejs\npm.cmd" run build
}

Write-Host "Starting L2L local demo at http://127.0.0.1:$Port/dashboard"

if ($Background) {
  $logDir = Join-Path $repoRoot "test-results\benchmark-latest"
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  $stdoutPath = Join-Path $logDir "start-local-demo.out.log"
  $stderrPath = Join-Path $logDir "start-local-demo.err.log"
  $process = Start-Process -FilePath "C:\Program Files\nodejs\npm.cmd" `
    -ArgumentList @("run", "start", "--", "-p", "$Port") `
    -WorkingDirectory $repoRoot `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -PassThru
  Write-Host "Started background Next process $($process.Id). Logs: $stdoutPath / $stderrPath"
  Wait-ForDashboard -TargetPort $Port
  return
}

Write-Host "Keep this window open while testing."
& "C:\Program Files\nodejs\npm.cmd" run start -- -p $Port
