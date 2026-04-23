param(
  [string]$RepoName = "l2l-learn2learn",
  [string]$VercelProjectName = "l2l-learn2learn"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "GitHub CLI is not installed. Install gh, then run gh auth login."
}

gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "GitHub CLI is not authenticated. Run gh auth login first."
}

if (-not (git remote get-url origin 2>$null)) {
  gh repo create $RepoName --private --source . --remote origin --push
} else {
  git push -u origin (git branch --show-current)
}

Write-Host "GitHub push complete. Connect Vercel using Git integration only:"
Write-Host "1. Open https://vercel.com/new"
Write-Host "2. Import the private GitHub repo: $RepoName"
Write-Host "3. Use project name: $VercelProjectName"
Write-Host "4. Add Firebase and Supabase environment variables from .env.example"
Write-Host "5. Let Vercel deploy from GitHub. Do not run a direct production deploy from the CLI."
