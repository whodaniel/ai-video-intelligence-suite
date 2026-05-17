#!/bin/bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-the-new-fuse-2025}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-aivi-backend}"
SUBDOMAIN="${SUBDOMAIN:-aivideointel.thenewfuse.com}"
BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 Deploying AI Video Intel Backend to GCP Cloud Run..."
echo "   Project:   ${PROJECT_ID}"
echo "   Region:    ${REGION}"
echo "   Service:   ${SERVICE_NAME}"
echo "   Subdomain: ${SUBDOMAIN}"
echo ""

if ! command -v gcloud >/dev/null 2>&1; then
  echo "❌ gcloud CLI is required but not installed."
  exit 1
fi

cd "${BACKEND_DIR}"

echo "📦 Building and deploying via Cloud Build..."
gcloud builds submit --config cloudbuild.yaml . --project="${PROJECT_ID}"

SERVICE_URL="$(gcloud run services describe "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format='value(status.url)' 2>/dev/null || true)"

echo ""
echo "✅ Deployment triggered! Monitor at:"
echo "   https://console.cloud.google.com/run?project=${PROJECT_ID}&region=${REGION}"

if [ -n "${SERVICE_URL}" ]; then
  SERVICE_HOST="${SERVICE_URL#https://}"
  echo ""
  echo "🔗 Cloud Run service URL:"
  echo "   ${SERVICE_URL}"
  echo ""
  echo "⚙️  Cloudflare DNS target:"
  echo "   CNAME ${SUBDOMAIN} -> ${SERVICE_HOST}"
  echo ""
  echo "🧪 Verify:"
  echo "   curl ${SERVICE_URL}/health"
  echo "   curl https://${SUBDOMAIN}/health"

  if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ -n "${CLOUDFLARE_ZONE_ID:-}" ]; then
    echo ""
    echo "☁️  Upserting Cloudflare DNS record for ${SUBDOMAIN}..."

    RECORDS_JSON="$(curl -sS -X GET "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=CNAME&name=${SUBDOMAIN}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json")"

    RECORD_ID="$(printf '%s' "${RECORDS_JSON}" | node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));if(!d.success){console.error('Cloudflare lookup failed');process.exit(1);}console.log((d.result&&d.result[0]&&d.result[0].id)||'');")"

    DNS_PAYLOAD="$(cat <<EOF
{"type":"CNAME","name":"${SUBDOMAIN}","content":"${SERVICE_HOST}","ttl":1,"proxied":false}
EOF
)"

    if [ -n "${RECORD_ID}" ]; then
      DNS_RESULT="$(curl -sS -X PUT "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${RECORD_ID}" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "${DNS_PAYLOAD}")"
    else
      DNS_RESULT="$(curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "${DNS_PAYLOAD}")"
    fi

    printf '%s' "${DNS_RESULT}" | node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync(0,'utf8'));if(!d.success){console.error('Cloudflare DNS update failed');console.error(JSON.stringify(d.errors||d,null,2));process.exit(1);}console.log('✅ Cloudflare DNS record updated.');"
  else
    echo ""
    echo "ℹ️  Cloudflare credentials not set in env; DNS not auto-updated."
    echo "   To auto-update DNS, set:"
    echo "   CLOUDFLARE_API_TOKEN=<token>"
    echo "   CLOUDFLARE_ZONE_ID=<zone-id>"
  fi
else
  echo ""
  echo "⚠️  Could not resolve the Cloud Run service URL from gcloud."
  echo "   Run this to fetch it after deploy:"
  echo "   gcloud run services describe ${SERVICE_NAME} --project=${PROJECT_ID} --region=${REGION} --format='value(status.url)'"
fi
