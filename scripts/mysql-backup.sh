#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -o errexit
# Return value of a pipeline is the status of the last command to exit with a non-zero status
set -o pipefail
# Treat unset variables as an error
set -o nounset

# Load environment variables if available
# Assuming DB connection info and S3 config are set in env or passed
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-}"
S3_BUCKET="${S3_BUCKET:-}"
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

# Setup variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/tmp/mysql_backups"
DUMP_FILE="${BACKUP_DIR}/dump_${DB_NAME}_${TIMESTAMP}.sql"
ARCHIVE_FILE="${DUMP_FILE}.tar.gz"

# JSON Logging Helper
log_json() {
  local level="$1"
  local message="$2"
  local extra_json="${3:-{}}"
  # Construct a strict JSON log string matching Winston format
  local log_time
  log_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "{\"timestamp\":\"${log_time}\",\"level\":\"${level}\",\"message\":\"${message}\",\"meta\":${extra_json}}"
}

# Create backup directory
mkdir -p "${BACKUP_DIR}"

log_json "INFO" "Starting MySQL database backup process" "{\"database\":\"${DB_NAME}\",\"host\":\"${DB_HOST}\"}"

# Ensure mysqldump is available
if ! command -v mysqldump &> /dev/null; then
  log_json "ERROR" "mysqldump command not found. Backup failed." "{}"
  exit 1
fi

# Ensure aws cli is available
if ! command -v aws &> /dev/null; then
  log_json "ERROR" "AWS CLI command not found. Backup failed." "{}"
  exit 1
fi

if [ -z "${DB_NAME}" ] || [ -z "${S3_BUCKET}" ]; then
  log_json "ERROR" "DB_NAME or S3_BUCKET environment variables are not set. Backup failed." "{}"
  exit 1
fi

# Perform mysqldump
# Using environment variable for password to avoid plain text warning
export MYSQL_PWD="${DB_PASSWORD}"
if mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" "${DB_NAME}" > "${DUMP_FILE}"; then
  log_json "INFO" "Successfully generated MySQL database dump" "{\"path\":\"${DUMP_FILE}\"}"
else
  log_json "ERROR" "Failed to generate MySQL database dump" "{}"
  exit 1
fi

# Compress dump file
if tar -czf "${ARCHIVE_FILE}" -C "${BACKUP_DIR}" "$(basename "${DUMP_FILE}")"; then
  log_json "INFO" "Successfully compressed database dump" "{\"path\":\"${ARCHIVE_FILE}\"}"
  rm -f "${DUMP_FILE}"
else
  log_json "ERROR" "Failed to compress database dump" "{}"
  rm -f "${DUMP_FILE}"
  exit 1
fi

# Upload to S3
S3_KEY="backups/${DB_NAME}/${TIMESTAMP}/$(basename "${ARCHIVE_FILE}")"
log_json "INFO" "Uploading backup archive to AWS S3" "{\"bucket\":\"${S3_BUCKET}\",\"key\":\"${S3_KEY}\"}"

if aws s3 cp "${ARCHIVE_FILE}" "s3://${S3_BUCKET}/${S3_KEY}" --region "${AWS_DEFAULT_REGION}"; then
  log_json "INFO" "Successfully uploaded backup archive to S3. Deleting local archive." "{\"s3_uri\":\"s3://${S3_BUCKET}/${S3_KEY}\"}"
  rm -f "${ARCHIVE_FILE}"
  log_json "INFO" "Database backup process completed successfully" "{}"
else
  log_json "ERROR" "Failed to upload backup archive to AWS S3" "{\"bucket\":\"${S3_BUCKET}\",\"key\":\"${S3_KEY}\"}"
  rm -f "${ARCHIVE_FILE}"
  exit 1
fi
