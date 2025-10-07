import argparse
import csv
import os
import sys
import tempfile
from contextlib import contextmanager

import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv
from tqdm import tqdm


@contextmanager
def pg_conn(dsn: str):
	conn = psycopg2.connect(dsn)
	try:
		yield conn
	finally:
		conn.close()


def copy_out_table(conn, schema: str, table: str, tmp_dir: str) -> str:
	file_path = os.path.join(tmp_dir, f"{schema}.{table}.csv")
	with conn.cursor() as cur, open(file_path, "w", newline="") as f:
		cur.copy_expert(f"COPY {schema}.{table} TO STDOUT WITH (FORMAT csv, HEADER true)", f)
	return file_path


def truncate_table(conn, schema: str, table: str):
	with conn.cursor() as cur:
		cur.execute(f"TRUNCATE TABLE {schema}.{table} RESTART IDENTITY CASCADE")


def copy_in_table(conn, schema: str, table: str, file_path: str):
	with conn.cursor() as cur, open(file_path, "r") as f:
		cur.copy_expert(f"COPY {schema}.{table} FROM STDIN WITH (FORMAT csv, HEADER true)", f)


def ensure_rls_disabled_for_import(conn, schema: str, table: str):
	# Service role bypasses RLS, but some environments may still enforce. Best effort to disable/enable around import.
	with conn.cursor(cursor_factory=DictCursor) as cur:
		cur.execute(
			"SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=%s AND c.relname=%s",
			(schema, table),
		)
		row = cur.fetchone()
		if row and row[0]:
			with conn.cursor() as c2:
				c2.execute(f"ALTER TABLE {schema}.{table} DISABLE ROW LEVEL SECURITY")
				return True
	return False


def restore_rls(conn, schema: str, table: str):
	with conn.cursor() as cur:
		cur.execute(f"ALTER TABLE {schema}.{table} ENABLE ROW LEVEL SECURITY")


def migrate_tables(src_dsn: str, dest_dsn: str, tables: list[str]):
	with pg_conn(src_dsn) as src, pg_conn(dest_dsn) as dest, tempfile.TemporaryDirectory() as tmp:
		src.autocommit = True
		dest.autocommit = True

		for fqtn in tqdm(tables, desc="Tables"):
			if "." not in fqtn:
				raise ValueError(f"Table must be schema-qualified: {fqtn}")
			schema, table = fqtn.split(".", 1)

			csv_path = copy_out_table(src, schema, table, tmp)

			# destination: truncate then copy in
			rls_was_enabled = ensure_rls_disabled_for_import(dest, schema, table)
			try:
				truncate_table(dest, schema, table)
				copy_in_table(dest, schema, table, csv_path)
			finally:
				if rls_was_enabled:
					restore_rls(dest, schema, table)


def main():
	load_dotenv()
	parser = argparse.ArgumentParser(description="Migrate Postgres tables between Supabase projects via COPY")
	parser.add_argument("--tables", type=str, required=False, help="Comma-separated list of schema-qualified tables")
	args = parser.parse_args()

	src_dsn = os.getenv("SRC_DB_CONNECTION")
	dest_dsn = os.getenv("DEST_DB_CONNECTION")
	default_tables = os.getenv("TABLES", "").strip()

	if not src_dsn or not dest_dsn:
		print("Missing SRC_DB_CONNECTION or DEST_DB_CONNECTION in .env", file=sys.stderr)
		sys.exit(1)

	tables = []
	if args.tables:
		tables = [t.strip() for t in args.tables.split(",") if t.strip()]
	elif default_tables:
		tables = [t.strip() for t in default_tables.split(",") if t.strip()]
	else:
		print("No tables specified. Use --tables or set TABLES in .env", file=sys.stderr)
		sys.exit(1)

	migrate_tables(src_dsn, dest_dsn, tables)
	print("Done.")


if __name__ == "__main__":
	main()