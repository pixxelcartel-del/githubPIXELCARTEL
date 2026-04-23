# L2L GitHub-First Firebase + Supabase Setup

## Release Rule

GitHub is the source of truth. Vercel deploys from GitHub only. Do not run `vercel deploy --prod` for this app.

## 1. GitHub

1. Authenticate:
   ```powershell
   gh auth login
   ```
2. Create and push the private repo:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\setup-github-vercel-git.ps1
   ```

## 2. Firebase

1. Authenticate:
   ```powershell
   npx firebase-tools login
   ```
2. Create the project and deploy Firestore rules:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\setup-firebase.ps1 -ProjectId "l2l-learn2learn"
   ```
3. In Firebase Console:
   - Enable Authentication > Google.
   - Create a Web App.
   - Copy client config into Vercel env vars.
   - Create a service account key for `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`.

## 3. Supabase

Use the existing Supabase free-tier project, isolated by `l2l` schema and `l2l-*` buckets.

1. Authenticate/link:
   ```powershell
   npx supabase login
   powershell -ExecutionPolicy Bypass -File .\scripts\setup-supabase-l2l.ps1 -ProjectRef "<your-project-ref>" -FirebaseProjectId "l2l-learn2learn"
   ```
2. In Supabase Dashboard:
   - Authentication > Third-Party Auth > add Firebase project ID.
   - API settings > expose `l2l` only if the client should read catalog/question tables directly.
   - Keep mark scheme and answer-bearing resource chunks private.

## 4. Vercel

1. Open Vercel > New Project.
2. Import the private GitHub repo.
3. Add env vars from `.env.example`.
4. Deploy from GitHub.

## Resource Ingestion Contract

Developer-fed papers follow this path:

1. Upload original QP/MS PDFs to `l2l-source-documents`.
2. Store reviewed extraction JSON in `l2l-extraction-artifacts`.
3. Insert public-safe question text, parts, and diagram specs into `l2l`.
4. Insert answer-bearing mark-scheme data into private `l2l.mark_scheme_items`.
5. Insert non-answer public chunks and private mark-scheme chunks into `l2l.resource_chunks`.
6. Hint/grading retrieval uses exact paper/question/sub-question IDs first; pgvector is fallback inside the same paper/subject.
