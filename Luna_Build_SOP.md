# Luna OpenClaw Build - Standard Operating Procedure (SOP)

## 1. System Overview & Safety Principles
This SOP defines the safe interaction and development lifecycle for the **Luna OpenClaw Build** deployed on the production VPS. 

**Core Principles:**
- **Zero-Downtime Mentality:** Always test configurations locally or in a staging environment before modifying production `openclaw.json`.
- **Memory Integrity:** Luna relies on `.openclaw/workspace/SOUL.md` and `MEMORY.md`. These are automatically compacted. Never manually inject unstructured data into them.
- **Dependency Guardrails:** The VPS runs Node v22.22.2. Gateway dynamically installs plugins. Ignore superficial "Bundled plugin deps missing" warnings unless the gateway actively crashes.

## 2. GitHub Fallback Checkpoint System
A GitHub fallback checkpoint is a full snapshot of the `.openclaw` state (JSON configurations, agent workspaces, and loaded skills).
- **Automated Checkpoints:** Before any major agent delegation change, a `.tar.gz` snapshot of `openclaw.json`, `workspace/`, and `skills/` is captured and pulled to the `githubPIXELCARTEL` repository.
- **Restoration:** To rollback, extract the snapshot directly over `~/.openclaw/` and run `systemctl --user restart openclaw-gateway.service`.

## 3. Skill & SOP Alignment Status
The following core factory engines are verified and aligned in Luna's workspace:

### 🟢 Web Builder & Theme Factory (Verified)
- **Path:** `skills/web-artifacts-builder`, `skills/theme-factory`
- **Status:** Active. Luna has full `edit`, `write`, and `browser` capabilities enabled in her agent configuration.
- **To-Do:** Continuously refine the `snippets/` inside the theme factory to align with modern design aesthetics.

### 🟢 Content Creation Factory Engine (Verified)
- **Path:** `skills/content-automation-engine`, `skills/youtube-full`, `skills/gary-vee-social`
- **Status:** Active. Connected with `n8n-workflow-automation` bridge.
- **To-Do:** Ensure rate limits for YouTube Transcript API and connected social endpoints remain within the designated thresholds.

### 🟢 Luna Delegation Orchestrator (Verified)
- **Path:** `skills/luna-core-agent`, `skills/skill-creator`
- **Status:** Active. Luna is set as the default orchestrator (`"default": "luna"`) with agent-to-agent access explicitly granted to sub-agents: `ernest`, `sun-tzu`, `elon`, `mark`, `a`.
- **To-Do:** Monitor the token usage when Luna cascades tasks down to `elon` and `mark` (currently configured to `openai-codex/gpt-5.4`).

### 🟢 Memory Stack (Verified)
- **Path:** `openclaw-mem0` plugin
- **Status:** Initialized. Running on Qdrant local vector store with `nomic-embed-text` and `gpt-4o-mini`.

## 4. Safe Modification Workflow
1. **Pull Latest Checkpoint:** Sync the local `githubPIXELCARTEL` repo.
2. **Modify Safely:** Edit skills or configs locally.
3. **Deploy:** SCP the changes to the VPS.
4. **Restart Gateway:** `systemctl --user restart openclaw-gateway.service`
5. **Verify:** Check logs using `journalctl --user -u openclaw-gateway.service -n 50`.
