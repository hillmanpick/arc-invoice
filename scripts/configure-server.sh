#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")/.."
if [ -f .env ]; then
  echo '.env already exists; preserve it and edit manually if required.'
  exit 1
fi
umask 077
arc_admin_token=$(openssl rand -hex 32)
arc_session_secret=$(openssl rand -hex 32)
cat > .env <<EOF
MERCHANT_ADDRESS=0xab9e4362ced96d403dab09e0561aded7b20e96d6
ADMIN_TOKEN=$arc_admin_token
SESSION_SECRET=$arc_session_secret
COOKIE_SECURE=true
ARC_RPC_URL=https://rpc.mainnet.arc.io
SITE_HOST=170.106.189.16.sslip.io
EOF
printf '%s\n' 'Configuration created locally on the server. Secrets were not printed.'
