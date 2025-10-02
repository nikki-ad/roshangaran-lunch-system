# Roshangarān School Lunch Reservation System

## Project Overview
This is a Persian-language web application for managing school lunch reservations at Roshangarān School. Students can view the weekly menu, make temporary reservations, and complete final registration by uploading payment receipts.

## Tech Stack
- **Frontend**: Vite + React + TypeScript
- **UI Framework**: shadcn/ui + Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: TanStack Query
- **Backend**: Supabase (Database + Storage + Auth)
- **Language**: Persian (RTL layout)

## Project Structure
- `src/pages/`: Application pages (Index, Admin, NotFound)
- `src/components/ui/`: shadcn/ui component library
- `src/integrations/supabase/`: Supabase client configuration
- `public/`: Static assets

## Configuration
- **Development Server**: Runs on port 5000 (0.0.0.0)
- **HMR**: Configured for Replit's WebSocket proxy
- **Environment Variables**: Stored in `.env` file
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_PUBLISHABLE_KEY
  - VITE_SUPABASE_PROJECT_ID

## Features
1. **Weekly Menu Display**: Shows the current week's lunch menu
2. **Temporary Reservation**: Students can reserve without payment
3. **Final Registration**: Students upload payment receipts to confirm
4. **Admin Panel**: Accessible at `/admin` route

## Running the Project
The project is configured to run automatically via the "Start application" workflow:
```bash
npm run dev
```

## Deployment
Configured for autoscale deployment with:
- Build: `npm run build`
- Run: `npm run preview`

## Database Schema (Supabase)
- `menu`: Stores weekly menu information
- `reservations`: Stores student reservations with status (temporary/final)
- `receipts`: Storage bucket for payment receipt uploads

## Recent Changes
- 2025-10-02: Initial Replit environment setup
  - Configured Vite to use port 5000 with 0.0.0.0 host
  - Set up HMR for Replit proxy compatibility
  - Configured workflow and deployment settings
  - Migrated .env and .gitignore from txt files
