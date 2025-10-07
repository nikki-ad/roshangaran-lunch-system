import argparse
import os
import sys
from typing import List, Optional

from dotenv import load_dotenv
from tqdm import tqdm

import requests


def require_env(name: str) -> str:
	value = os.getenv(name)
	if not value:
		raise SystemExit(f"Missing required env: {name}")
	return value


def list_storage_objects(base_url: str, service_key: str, bucket: str, limit: int = 1000):
	# Uses the Storage REST API list endpoint with pagination via 'offset'
	offset = 0
	while True:
		resp = requests.get(
			f"{base_url}/storage/v1/object/list/{bucket}",
			headers={"Authorization": f"Bearer {service_key}", "apikey": service_key},
			params={"limit": limit, "offset": offset},
			timeout=60,
		)
		resp.raise_for_status()
		items = resp.json()
		if not items:
			break
			
		for item in items:
			yield item
		offset += len(items)


def download_object(base_url: str, service_key: str, bucket: str, name: str) -> bytes:
	resp = requests.get(
		f"{base_url}/storage/v1/object/{bucket}/{name}",
		headers={"Authorization": f"Bearer {service_key}", "apikey": service_key},
		timeout=120,
	)
	if resp.status_code == 404:
		# skip missing (could be folder placeholders)
		return b""
	resp.raise_for_status()
	return resp.content


def upload_object(base_url: str, service_key: str, bucket: str, name: str, content: bytes, upsert: bool = True):
	headers = {
		"Authorization": f"Bearer {service_key}",
		"apikey": service_key,
		"x-upsert": "true" if upsert else "false",
	}
	resp = requests.post(
		f"{base_url}/storage/v1/object/{bucket}/{name}",
		headers=headers,
		data=content,
		timeout=120,
	)
	# For existing files, POST may return 409; try PUT to upsert
	if resp.status_code in (409, 400):
		resp = requests.put(
			f"{base_url}/storage/v1/object/{bucket}/{name}",
			headers=headers,
			data=content,
			timeout=120,
		)
	resp.raise_for_status()


def migrate_bucket(src_url: str, src_key: str, dest_url: str, dest_key: str, bucket: str):
	# Ensure bucket exists on destination
	resp = requests.post(
		f"{dest_url}/storage/v1/bucket",
		headers={"Authorization": f"Bearer {dest_key}", "apikey": dest_key, "Content-Type": "application/json"},
		json={"name": bucket, "public": False},
		timeout=30,
	)
	# 409 if already exists
	if resp.status_code not in (200, 201, 409):
		resp.raise_for_status()

	items = list(list_storage_objects(src_url, src_key, bucket))
	for item in tqdm(items, desc=f"Copying {bucket}"):
		name = item.get("name")
		if not name or name.endswith("/"):
			continue
		content = download_object(src_url, src_key, bucket, name)
		if not content:
			continue
		upload_object(dest_url, dest_key, bucket, name, content)


def main():
	load_dotenv()
	parser = argparse.ArgumentParser(description="Migrate Supabase Storage bucket objects between projects")
	parser.add_argument("--bucket", required=True, help="Bucket id (e.g., receipts)")
	args = parser.parse_args()

	src_url = require_env("SRC_SUPABASE_URL")
	src_key = require_env("SRC_SUPABASE_SERVICE_KEY")
	dest_url = require_env("DEST_SUPABASE_URL")
	dest_key = require_env("DEST_SUPABASE_SERVICE_KEY")

	migrate_bucket(src_url, src_key, dest_url, dest_key, args.bucket)
	print("Done.")


if __name__ == "__main__":
	main()