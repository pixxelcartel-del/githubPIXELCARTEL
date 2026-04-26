# LUNA OPENCLAW — CLAUDE CODE EXECUTION PLAN
> Auto-generated: 2026-04-26 | VPS: himel@100.80.74.21 (Tailscale)

## SYSTEM STATE SUMMARY
- OpenClaw v2026.4.24 INSTALLED, gateway RUNNING but degraded
- Local UI proxy: 127.0.0.1:18789 → 18790 (ECONNABORTED errors)
- VPS .bashrc: CORRUPTED (Windows paths injected, secrets exposed)
- GitHub MCP: BROKEN (Docker not installed)
- n8n MCP: BROKEN (DNS/TLS timeout)
- Memory plugin: UNAVAILABLE (embedding not configured)
- Disk: 85% full
- Telegram: configured inline in openclaw.json — status UNKNOWN

## CRITICAL RULES
1. Never manually edit SOUL.md or MEMORY.md on VPS
2. Always backup .bashrc before modifying
3. Use `systemctl --user restart openclaw-gateway.service` to restart
4. SSH via Tailscale: `ssh himel@100.80.74.21`
5. Check logs: `journalctl --user -u openclaw-gateway.service -n 50`
6. NEVER commit secrets to git — use ~/.openclaw/.env

## AUTOMATED EXECUTION PHASES

### PHASE 1 — VPS Shell Repair (CRITICAL, run first)
```bash
# 1.1 Backup + clean .bashrc
ssh himel@100.80.74.21 'cp ~/.bashrc ~/.bashrc.bak.$(date +%s) && sed -i "/^# Luna NotebookLM/,\$d" ~/.bashrc && sed -i "/^echo BASHRC_OK/d" ~/.bashrc && sed -i "/^export ANTHROPIC_API_KEY=/d" ~/.bashrc && sed -i "/^export CLAUDE_CODE_OAUTH_TOKEN=/d" ~/.bashrc && sed -i "/^export NODE_COMPILE_CACHE=\/var/d" ~/.bashrc && sed -i "/^export OPENCLAW_NO_RESPAWN=1/d" ~/.bashrc && printf "\n# === OpenClaw Runtime (cleaned 2026-04-26) ===\nexport NODE_COMPILE_CACHE=\"\${NODE_COMPILE_CACHE:-/var/tmp/openclaw-compile-cache}\"\nexport OPENCLAW_NO_RESPAWN=\"\${OPENCLAW_NO_RESPAWN:-1}\"\n[ -d \"\$NODE_COMPILE_CACHE\" ] || mkdir -p \"\$NODE_COMPILE_CACHE\" 2>/dev/null || true\n[ -f ~/.openclaw/.env ] && source ~/.openclaw/.env\n" >> ~/.bashrc && echo BASHRC_REPAIR_DONE'

# 1.2 Secure secrets
ssh himel@100.80.74.21 'mkdir -p ~/.openclaw && cat > ~/.openclaw/.env << '"'"'EOF'"'"'
export ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
export CLAUDE_CODE_OAUTH_TOKEN="${CLAUDE_CODE_OAUTH_TOKEN}"
export OLLAMA_API_KEY="ollama-local"
EOF
chmod 600 ~/.openclaw/.env && echo SECRETS_SECURED'

# 1.3 Verify PATH
ssh himel@100.80.74.21 'source ~/.bashrc && echo PATH_OK && which openclaw && openclaw --version'
```

### PHASE 2 — OpenClaw Doctor + Gateway + Cleanup
```bash
# 2.1 Doctor
ssh himel@100.80.74.21 'source ~/.bashrc && openclaw doctor --fix 2>&1'

# 2.2 Restart gateway
ssh himel@100.80.74.21 'systemctl --user restart openclaw-gateway.service && sleep 5 && systemctl --user is-active openclaw-gateway.service'

# 2.3 Task maintenance
ssh himel@100.80.74.21 'source ~/.bashrc && openclaw tasks maintenance --apply 2>&1'

# 2.4 Disk cleanup (parallel)
ssh himel@100.80.74.21 'find /tmp/openclaw -name "*.log" -mtime +7 -delete 2>/dev/null; npm cache clean --force 2>/dev/null; docker image prune -f 2>/dev/null; df -h / | tail -1'

# 2.5 Memory plugin check
ssh himel@100.80.74.21 'source ~/.bashrc && openclaw status --deep 2>&1 | grep -A5 "Memory\|mem0\|qdrant" || openclaw memory doctor 2>&1'
```

### PHASE 3 — MCP Config Fix (local file edit)
Edit: C:\Users\himel\.gemini\antigravity\mcp_config.json
- Replace docker-based github-mcp-server with npx version
- Replace n8n-mcp external URL with localhost:5678 tunnel
- See migration_plan.md Phase 3.4 for full JSON

Start SSH tunnel:
```powershell
Start-Process ssh -ArgumentList "-N","-L","18789:127.0.0.1:18789","-L","5678:127.0.0.1:5678","-o","ServerAliveInterval=60","himel@100.80.74.21" -WindowStyle Hidden
```

### PHASE 4 — Telegram + Validation
```bash
# Telegram check
ssh himel@100.80.74.21 'source ~/.bashrc && BOTTOKEN=$(node -e "const d=require(process.env.HOME+'"'"'/.openclaw/openclaw.json'"'"');console.log(d.telegram&&d.telegram.token||'"'"'NOT_FOUND'"'"')" 2>/dev/null); [ -n "$BOTTOKEN" ] && curl -s "https://api.telegram.org/bot${BOTTOKEN}/getMe" | python3 -c "import sys,json;d=json.load(sys.stdin);print(\"BOT:\",d.get(\"result\",{}).get(\"username\",\"ERROR\"),\"ok:\",d.get(\"ok\"))" || echo "TOKEN_NOT_IN_JSON_CHECK_ENV"'

# Full validation
ssh himel@100.80.74.21 'source ~/.bashrc && echo "=OPENCLAW=" && openclaw --version && echo "=GATEWAY=" && systemctl --user is-active openclaw-gateway.service && echo "=AGENTS=" && openclaw agents list 2>&1 | head -20 && echo "=DOCKER=" && docker ps --format "{{.Names}}: {{.Status}}" && echo "=DISK=" && df -h / | tail -1 && echo "=N8N=" && curl -s http://localhost:5678/healthz | head -c 100 && echo "=QDRANT=" && curl -s http://localhost:6333/healthz | head -c 100'
```

## VPS ARCHITECTURE QUICK-REF
- Gateway: systemd `openclaw-gateway.service`, port 18789 loopback
- Agents: luna (orchestrator), elon, mark, ernest, sun-tzu, a
- Skills: web-artifacts-builder, theme-factory, content-automation-engine, youtube-full, gary-vee-social, luna-core-agent, skill-creator
- Memory: openclaw-mem0 → Qdrant:6333 + nomic-embed-text
- Docker: n8n:5678, grafana, traefik, neo4j:7474, qdrant:6333, mission-control:3000
- Telegram: enabled inline in openclaw.json

## AGENT HANDOFF NOTE
If this context is loaded by a subagent, execute phases sequentially.
If Phase 1 fails at step 1.3, check: `ssh himel@100.80.74.21 'cat ~/.bashrc | tail -20'`
If Gateway won't restart: `ssh himel@100.80.74.21 'journalctl --user -u openclaw-gateway.service -n 30 --no-pager'`
