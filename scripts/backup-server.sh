#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")/.."
arc_backup_dir="${ARC_BACKUP_DIR:-/home/ubuntu/arc-invoice-backups}"
umask 077
mkdir -p "$arc_backup_dir"
arc_backup_result=$(sudo -n docker compose -f compose.yaml -f compose.https.yaml exec -T app node < scripts/backup-db.cjs)
arc_filename=$(printf '%s' "$arc_backup_result" | sed -n 's/.*"filename":"\([^"]*\)".*/\1/p')
case "$arc_filename" in
  invoices-*.sqlite) ;;
  *) printf '%s\n' 'Backup failed: missing filename'; exit 1 ;;
esac
arc_container=$(sudo -n docker compose -f compose.yaml -f compose.https.yaml ps -q app)
sudo -n docker cp "$arc_container:/app/data/backups/$arc_filename" "$arc_backup_dir/$arc_filename"
sudo -n chown "$(id -u):$(id -g)" "$arc_backup_dir/$arc_filename"
chmod 600 "$arc_backup_dir/$arc_filename"
printf '%s\n' "$arc_backup_result"
printf 'Verified server backup: %s/%s\n' "$arc_backup_dir" "$arc_filename"
# Copy backups to independent storage too; this directory shares the server's disk.
