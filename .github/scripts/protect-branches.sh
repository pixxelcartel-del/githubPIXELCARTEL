#!/usr/bin/env bash
# protect-branches.sh
# Run this ONCE after pushing branches to GitHub to lock down main and develop.
# Requires: gh CLI authenticated as repo owner (pixxelcartel-del)
#
# Usage: bash .github/scripts/protect-branches.sh

REPO="pixxelcartel-del/githubPIXELCARTEL"

echo "🔒 Applying branch protection rules to: $REPO"
echo ""

# ── Protect: main ────────────────────────────────────────────
echo "  → Protecting 'main'..."
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO/branches/main/protection" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["🔍 Lint", "🧪 Test", "🏗️ Build"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false
}
EOF
echo "  ✅ main: protected (1 review required, CODEOWNERS enforced, no force push)"

echo ""

# ── Protect: develop ─────────────────────────────────────────
echo "  → Protecting 'develop'..."
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO/branches/develop/protection" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["🔍 Lint"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF
echo "  ✅ develop: protected (1 review required, no force push)"

echo ""
echo "🎯 Branch protection complete."
echo ""
echo "Flow: work/* → PR to develop (1 review) → PR to main (1 review + CI + CODEOWNERS)"
