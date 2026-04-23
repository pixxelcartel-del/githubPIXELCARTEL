param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectRef,
  [Parameter(Mandatory = $true)]
  [string]$FirebaseProjectId
)

$ErrorActionPreference = "Stop"

(Get-Content supabase/config.toml) `
  -replace 'project_id = "REPLACE_WITH_FIREBASE_PROJECT_ID"', "project_id = `"$FirebaseProjectId`"" |
  Set-Content supabase/config.toml

Write-Host "Linking Supabase project: $ProjectRef"
npx supabase link --project-ref $ProjectRef

Write-Host "Pushing l2l schema, RLS, pgvector indexes, and storage buckets"
npx supabase db push

Write-Host "Supabase setup complete."
Write-Host "In Supabase Dashboard > Project Settings > API, expose schema 'l2l' if client Data API access is needed."
Write-Host "In Authentication > Third-Party Auth, confirm Firebase project '$FirebaseProjectId' is enabled."
