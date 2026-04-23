param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,
  [string]$DisplayName = "L2L Learn2 Learn"
)

$ErrorActionPreference = "Stop"

Write-Host "Checking Firebase CLI..."
npx firebase-tools --version | Out-Null

Write-Host "Checking Firebase login..."
npx firebase-tools login:list | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Firebase CLI is not authenticated. Run: npx firebase-tools login"
}

Write-Host "Creating Firebase project if needed: $ProjectId"
npx firebase-tools projects:create $ProjectId --display-name "$DisplayName"

Write-Host "Deploying Firestore rules"
npx firebase-tools deploy --only firestore:rules --project $ProjectId

Write-Host "Next manual Firebase console steps:"
Write-Host "1. Enable Authentication > Sign-in method > Google."
Write-Host "2. Create a Web App and copy client config into Vercel env vars."
Write-Host "3. Create a service account key and set FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY."
Write-Host "4. Add this project ID to Supabase Third-Party Auth Firebase integration."
