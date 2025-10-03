# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/259fd677-d54e-408a-856e-b7968636483f

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/259fd677-d54e-408a-856e-b7968636483f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/259fd677-d54e-408a-856e-b7968636483f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Setup for new Supabase project (Project ID changed)

1) Create `.env.local` with your new Supabase credentials (see `.env.example`).
2) Restart the dev server after changing envs.
3) In Supabase SQL Editor for the NEW project (matching `VITE_SUPABASE_URL`), run the SQL from:
   - `supabase/migrations/20251003123500_enable_pgcrypto.sql`
   - `supabase/migrations/20251003123000_bootstrap_all.sql`
4) Test admin delete in the app. It will call `public.delete_reservation(uuid)` RPC; if missing, re-run the bootstrap SQL in the correct project.

Notes:
- Files are uploaded to `receipts` bucket. We store only the object name; links are created via `getPublicUrl` for the CURRENT project.
- If you still see old links, the app is likely running with old envs; restart after updating.
