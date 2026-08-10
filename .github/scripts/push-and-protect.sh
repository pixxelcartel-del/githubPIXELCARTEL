#!/usr/bin/env bash
# push-and-protect.sh
# Run this ONCE when git push access is confirmed.
# Works from: local Windows (PowerShell/WSL) OR VPS (LUNA) with correct credentials.
#
# Usage:
#   bash .github/scripts/push-and-protect.sh
#
# Requirements:
#   - gh CLI authenticated as pixxelcartel-del OR a collaborator with Write access
#   - git remote set to https://github.com/pixxelcartel-del/githubPIXELCARTEL.git

set -e

REPO="pixxelcartel-del/githubPIXELCARTEL"

echo "🚀 PixelCartel — Push & Protect"
echo ""

# ── Verify auth ───────────────────────────────────────────────
echo "1. Checking gh auth..."
VIEWER=$(gh api /repos/$REPO --jq '.permissions.push' 2>/dev/null || echo "false")
if [ "$VIEWER" != "true" ]; then
  echo "   ❌ Current gh account does NOT have push access to $REPO"
  echo "   → Run: gh auth login"
  echo "   → Or add your account as a collaborator at:"
  echo "     https://github.com/$REPO/settings/access"
  exit 1
fi
echo "   ✅ Push access confirmed"
echo ""

# ── Push branches ────────────────────────────────────────────
echo "2. Pushing branches..."
git push origin main && echo "   ✅ main"
git push -u origin develop && echo "   ✅ develop"
git push -u origin work && echo "   ✅ work"
echo ""

# ── Branch protection: main ──────────────────────────────────
echo "3. Protecting main..."
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
  "required_conversation_resolution": true
}
EOF
echo "   ✅ main: 1 review + CODEOWNERS + CI required, no force push"
echo ""

# ── Branch protection: develop ───────────────────────────────
echo "4. Protecting develop..."
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
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF
echo "   ✅ develop: 1 review + lint CI required, no force push"
echo ""

# ── Add collaborators ─────────────────────────────────────────
echo "5. Adding collaborators..."
gh api --method PUT /repos/$REPO/collaborators/jonaqiprojections-PixC \
  --field permission=push 2>/dev/null \
  && echo "   ✅ jonaqiprojections-PixC: Write" \
  || echo "   ⚠️  jonaqiprojections-PixC: already set or failed (check manually)"

gh api --method PUT /repos/$REPO/collaborators/luxurioupotato \
  --field permission=push 2>/dev/null \
  && echo "   ✅ luxurioupotato: Write" \
  || echo "   ⚠️  luxurioupotato: already set or failed (check manually)"
echo ""

echo "✅ Done. All branches pushed and protected."
echo ""
echo "Flow: work/* → PR to develop (1 review) → PR to main (1 review + CI + CODEOWNERS)"
