#!/bin/bash
# Luna VPS Full Validation Script
# Runs ON the VPS via: ssh himel@100.80.74.21 'bash -s' < scripts/luna_vps_validate.sh

echo "============================================"
echo " LUNA VPS VALIDATION REPORT"
echo " $(date)"
echo "============================================"

echo ""
echo "--- [1] GATEWAY SERVICE STATUS ---"
systemctl --user is-active openclaw-gateway.service 2>/dev/null || \
  systemctl is-active openclaw-gateway.service 2>/dev/null || \
  echo "CHECK: run as correct user"

echo ""
echo "--- [2] LAST 30 GATEWAY LOGS ---"
journalctl --user -u openclaw-gateway.service -n 30 --no-pager 2>/dev/null || \
  journalctl -u openclaw-gateway.service -n 30 --no-pager 2>/dev/null || \
  echo "WARN: journalctl not accessible"

echo ""
echo "--- [3] OPENCLAW DIR STRUCTURE ---"
ls -la ~/.openclaw/ 2>/dev/null || ls -la /root/.openclaw/ 2>/dev/null

echo ""
echo "--- [4] WORKSPACE & SKILLS ---"
ls ~/.openclaw/workspace/ 2>/dev/null || ls /root/.openclaw/workspace/ 2>/dev/null
echo "--- Skills ---"
ls ~/.openclaw/workspace/skills/ 2>/dev/null || ls /root/.openclaw/workspace/skills/ 2>/dev/null

echo ""
echo "--- [5] QDRANT HEALTH ---"
curl -s http://localhost:6333/healthz 2>/dev/null || echo "QDRANT: not reachable on 6333"

echo ""
echo "--- [6] N8N HEALTH ---"
curl -s http://100.80.74.21:5678/healthz 2>/dev/null | head -c 300 || \
curl -s http://localhost:5678/healthz 2>/dev/null | head -c 300 || \
echo "N8N: not reachable"

echo ""
echo "--- [7] ENV SECRETS (REDACTED) ---"
ENVFILE=$(ls ~/.openclaw/.env /root/.openclaw/.env 2>/dev/null | head -1)
if [ -f "$ENVFILE" ]; then
  grep -o '^[^=]*=' "$ENVFILE" | sed 's/=/=***REDACTED***/'
  echo "Total secrets: $(grep -c '=' $ENVFILE)"
else
  echo "WARN: .env not found"
fi

echo ""
echo "--- [8] OPENCLAW.JSON KEY FIELDS ---"
JSONFILE=$(ls ~/.openclaw/openclaw.json /root/.openclaw/openclaw.json 2>/dev/null | head -1)
if [ -f "$JSONFILE" ]; then
  node -e "
    const d = require('$JSONFILE');
    const agents = d.agents ? Object.keys(d.agents) : [];
    const plugins = (d.plugins || []).map(p => p.name || p);
    const telegramEnabled = d.telegram && d.telegram.enabled;
    const idleHook = !!(d.hooks && d.hooks.idle);
    const agentEndHook = !!(d.hooks && d.hooks.agent_end);
    const mem0Active = plugins.some(p => String(p).includes('mem0'));
    console.log('agents:', agents.join(', '));
    console.log('plugins:', plugins.join(', '));
    console.log('telegram.enabled:', telegramEnabled);
    console.log('idle_hook_active:', idleHook);
    console.log('agent_end_hook:', agentEndHook);
    console.log('mem0_plugin:', mem0Active);
    console.log('default_agent:', d.default || 'NOT SET');
  " 2>/dev/null || echo "WARN: node parse failed, raw peek:" && head -50 "$JSONFILE"
else
  echo "WARN: openclaw.json not found at expected path"
fi

echo ""
echo "--- [9] TELEGRAM CONNECTIVITY ---"
# Check if the bot token is set and test against Telegram API
BOTTOKEN=$(grep 'TELEGRAM' ~/.openclaw/.env /root/.openclaw/.env 2>/dev/null | grep -o '=.*' | tr -d '=' | head -1)
if [ -n "$BOTTOKEN" ]; then
  TGRES=$(curl -s "https://api.telegram.org/bot${BOTTOKEN}/getMe" 2>/dev/null | head -c 200)
  echo "$TGRES"
else
  echo "TELEGRAM: token not found in .env (may be inline in openclaw.json)"
fi

echo ""
echo "--- [10] DISK & MEMORY ---"
df -h / 2>/dev/null
free -h 2>/dev/null

echo ""
echo "--- [11] NODE VERSION ---"
node --version 2>/dev/null

echo ""
echo "============================================"
echo " VALIDATION COMPLETE"
echo "============================================"
