## Supabase Project-to-Project Migration

This folder contains scripts to migrate Postgres table rows and Storage objects (bucket-based) from a source Supabase project to a destination Supabase project.

### Prerequisites
- Python 3.10+
- Service Role keys for both projects (Settings → API)
- Direct Postgres connection strings for both projects (Settings → Database → Connection string → URI)

### Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and fill in values
```

### Commands
- Migrate database tables (CSV export/import via COPY):
```bash
python migrate_db.py --tables "$TABLES"
```

- Migrate storage objects in a bucket:
```bash
python migrate_storage.py --bucket "$BUCKET_ID"
```

### Notes
- Service role bypasses RLS during server-side operations, which is required for full-copy operations.
- Policies are not migrated; re-apply safe RLS policies on the destination after migration if needed.
- For large buckets, the script paginates and streams files.