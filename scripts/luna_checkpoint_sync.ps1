# ============================================================
# Luna OpenClaw Checkpoint Sync Script
# ============================================================
# PURPOSE: Verifies VPS gateway health, captures a new fallback
#          checkpoint from the VPS, pulls it locally, commits
#          and pushes to GitHub automatically.
#
# USAGE:   .\scripts\luna_checkpoint_sync.ps1
# PREREQ:  SSH access to himel@100.80.74.21 (Tailscale active)
# ============================================================

$ErrorActionPreference = "Stop"
$VPS_HOST    = "himel@100.80.74.21"
$REPO_ROOT   = Split-Path $PSScriptRoot -Parent
$CHECKPOINT  = "openclaw_fallback_checkpoint.tar.gz"
$REMOTE_PATH = "/tmp/$CHECKPOINT"
$OPENCLAW_DIR = "~/.openclaw"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  LUNA CHECKPOINT SYNC  |  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# ----------------------------------------------------------
# STEP 1: Verify Gateway Health
# ----------------------------------------------------------
Write-Host "`n[1/5] Verifying gateway health on VPS..." -ForegroundColor Yellow
$gatewayStatus = ssh -o ConnectTimeout=15 $VPS_HOST "systemctl --user is-active openclaw-gateway.service 2>/dev/null || systemctl is-active openclaw-gateway.service 2>/dev/null || echo 'UNKNOWN'"
Write-Host "    Gateway status: $gatewayStatus"

if ($gatewayStatus -notmatch "active") {
    Write-Host "`n[WARN] Gateway not active! Attempting restart..." -ForegroundColor Red
    ssh -o ConnectTimeout=15 $VPS_HOST "systemctl --user restart openclaw-gateway.service 2>/dev/null || systemctl restart openclaw-gateway.service"
    Start-Sleep -Seconds 5
    $gatewayStatus = ssh -o ConnectTimeout=15 $VPS_HOST "systemctl --user is-active openclaw-gateway.service 2>/dev/null || echo 'FAILED'"
    if ($gatewayStatus -notmatch "active") {
        Write-Host "[ERROR] Gateway failed to restart. Aborting checkpoint sync." -ForegroundColor Red
        Write-Host "        Run: ssh $VPS_HOST 'journalctl --user -u openclaw-gateway.service -n 50'" -ForegroundColor Gray
        exit 1
    }
    Write-Host "    Gateway restarted successfully." -ForegroundColor Green
} else {
    Write-Host "    Gateway is ACTIVE." -ForegroundColor Green
}

# ----------------------------------------------------------
# STEP 2: Capture new checkpoint on VPS
# ----------------------------------------------------------
Write-Host "`n[2/5] Capturing new checkpoint on VPS..." -ForegroundColor Yellow
ssh -o ConnectTimeout=30 $VPS_HOST "tar -czf $REMOTE_PATH -C ~ .openclaw 2>/dev/null && echo 'CHECKPOINT_OK' || echo 'CHECKPOINT_FAILED'"
Write-Host "    Checkpoint captured at: $REMOTE_PATH" -ForegroundColor Green

# ----------------------------------------------------------
# STEP 3: SCP checkpoint to local repo
# ----------------------------------------------------------
Write-Host "`n[3/5] Downloading checkpoint to local repo..." -ForegroundColor Yellow
$localPath = Join-Path $REPO_ROOT $CHECKPOINT
scp -o ConnectTimeout=60 "${VPS_HOST}:${REMOTE_PATH}" "$localPath"
Write-Host "    Saved to: $localPath" -ForegroundColor Green

# ----------------------------------------------------------
# STEP 4: Run full validation script
# ----------------------------------------------------------
Write-Host "`n[4/5] Running full VPS validation..." -ForegroundColor Yellow
$validationScript = Join-Path $PSScriptRoot "luna_vps_validate.sh"
if (Test-Path $validationScript) {
    $result = Get-Content $validationScript -Raw | ssh -o ConnectTimeout=30 $VPS_HOST "bash -s"
    Write-Host $result
} else {
    Write-Host "    SKIP: luna_vps_validate.sh not found locally" -ForegroundColor Gray
}

# ----------------------------------------------------------
# STEP 5: Commit and push to GitHub
# ----------------------------------------------------------
Write-Host "`n[5/5] Committing and pushing to GitHub..." -ForegroundColor Yellow
Push-Location $REPO_ROOT
try {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm UTC"
    git add $CHECKPOINT
    git add AGENT_HANDOFF.md 2>$null
    git add . 2>$null
    $commitMsg = "chore: auto-checkpoint sync [$timestamp] gateway=$gatewayStatus"
    git commit -m $commitMsg
    git push
    Write-Host "    Committed and pushed: $commitMsg" -ForegroundColor Green
} catch {
    Write-Host "    WARN: Git operation failed: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  SYNC COMPLETE                                       " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
