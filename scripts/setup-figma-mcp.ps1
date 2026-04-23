param(
  [switch]$SkipPrompt
)

$ErrorActionPreference = "Stop"

Write-Host "Configuring Figma MCP for Codex..." -ForegroundColor Cyan

$projectConfigDir = Join-Path (Get-Location) ".codex"
$projectConfig = Join-Path $projectConfigDir "config.toml"
if (!(Test-Path $projectConfigDir)) {
  New-Item -ItemType Directory -Path $projectConfigDir | Out-Null
}

$config = @"
[mcp_servers.figma]
url = "https://mcp.figma.com/mcp"
bearer_token_env_var = "FIGMA_OAUTH_TOKEN"
tool_timeout_sec = 120
"@

Set-Content -Path $projectConfig -Value $config -Encoding UTF8
Write-Host "Wrote project MCP config: $projectConfig" -ForegroundColor Green

if (!$SkipPrompt) {
  $secureToken = Read-Host "Paste your Figma token. Input is hidden" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
  try {
    $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    if ([string]::IsNullOrWhiteSpace($token)) {
      throw "Token was empty."
    }

    [Environment]::SetEnvironmentVariable("FIGMA_OAUTH_TOKEN", $token, "User")
    $env:FIGMA_OAUTH_TOKEN = $token
    Write-Host "Saved FIGMA_OAUTH_TOKEN to the Windows user environment." -ForegroundColor Green
  }
  finally {
    if ($bstr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
  }
}

try {
  $headers = @{}
  if ($env:FIGMA_OAUTH_TOKEN) {
    $headers.Authorization = "Bearer $env:FIGMA_OAUTH_TOKEN"
  }

  $body = @{
    jsonrpc = "2.0"
    id = 1
    method = "initialize"
    params = @{
      protocolVersion = "2024-11-05"
      capabilities = @{}
      clientInfo = @{
        name = "codex-figma-mcp-check"
        version = "1"
      }
    }
  } | ConvertTo-Json -Depth 10

  $response = Invoke-WebRequest -Uri "https://mcp.figma.com/mcp" -Method Post -ContentType "application/json" -Headers $headers -Body $body -TimeoutSec 20
  Write-Host "Figma MCP endpoint responded with HTTP $($response.StatusCode)." -ForegroundColor Green
}
catch {
  Write-Host "Figma MCP endpoint check did not complete: $($_.Exception.Message)" -ForegroundColor Yellow
  Write-Host "If this says unauthorized, rotate the pasted PAT and prefer OAuth via Codex when available." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next step: restart Codex Desktop so it loads the Figma MCP tools." -ForegroundColor Cyan
Write-Host "Then send: continue Figma build" -ForegroundColor Cyan

