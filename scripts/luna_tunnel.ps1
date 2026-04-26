# ============================================================
# Luna OpenClaw UI Tunnel — Persistent SSH Port Forward
# ============================================================
# PURPOSE: Forwards VPS gateway + n8n to localhost so the
#          OpenClaw browser extension and n8n can be used locally.
#
# PORTS:
#   18789 → OpenClaw Gateway  → http://127.0.0.1:18789
#   5678  → n8n               → http://127.0.0.1:5678
#
# AFTER RUNNING THIS:
#   1. Open http://127.0.0.1:18789/__openclaw__/canvas/ in browser
#   2. Configure the OpenClaw extension endpoint to http://127.0.0.1:18789
#
# USAGE:   .\scripts\luna_tunnel.ps1
#          .\scripts\luna_tunnel.ps1 -Background    (hidden, auto-reconnect)
# ============================================================

param(
    [switch]$Background
)

$VPS = "himel@100.80.74.21"
$SSH_ARGS = @(
    "-N",
    "-o", "ServerAliveInterval=30",
    "-o", "ServerAliveCountMax=3",
    "-o", "ExitOnForwardFailure=yes",
    "-L", "18789:127.0.0.1:18789",
    "-L", "5678:127.0.0.1:5678",
    $VPS
)

if ($Background) {
    Write-Host "Starting Luna tunnel in background..." -ForegroundColor Cyan
    Start-Process ssh -ArgumentList $SSH_ARGS -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Write-Host "Tunnel active. OpenClaw UI: http://127.0.0.1:18789/__openclaw__/canvas/" -ForegroundColor Green
    Write-Host "n8n: http://127.0.0.1:5678" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=== Luna OpenClaw UI Tunnel ===" -ForegroundColor Cyan
    Write-Host "Forwarding: 18789 (gateway) + 5678 (n8n)" -ForegroundColor Yellow
    Write-Host "Canvas UI: http://127.0.0.1:18789/__openclaw__/canvas/" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    Write-Host ""
    & ssh @SSH_ARGS
}
