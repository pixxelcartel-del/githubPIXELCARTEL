# ============================================================
# Luna VPS Health Check (Read-Only, Safe to Run Anytime)
# ============================================================
# PURPOSE: Quick health check of the Luna OpenClaw VPS.
#          Does NOT modify any state. Safe to run at any time.
#
# USAGE:   .\scripts\luna_vps_health.ps1
# ============================================================

$VPS_HOST = "himel@100.80.74.21"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  LUNA VPS HEALTH CHECK  |  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

$validationScript = Join-Path $PSScriptRoot "luna_vps_validate.sh"
if (Test-Path $validationScript) {
    Write-Host "`nStreaming validation from VPS...`n" -ForegroundColor Yellow
    Get-Content $validationScript -Raw | ssh -o ConnectTimeout=30 $VPS_HOST "bash -s"
} else {
    Write-Host "`n[FALLBACK] Running inline health check...`n" -ForegroundColor Yellow
    ssh -o ConnectTimeout=15 $VPS_HOST @'
echo "=== Gateway ===" && systemctl --user is-active openclaw-gateway.service 2>/dev/null || echo UNKNOWN
echo "=== Last 20 Logs ===" && journalctl --user -u openclaw-gateway.service -n 20 --no-pager 2>/dev/null
echo "=== Qdrant ===" && curl -s http://localhost:6333/healthz 2>/dev/null || echo NOT_RUNNING
echo "=== Disk ===" && df -h / 2>/dev/null
echo "=== Memory ===" && free -h 2>/dev/null
'@
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  HEALTH CHECK COMPLETE" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
