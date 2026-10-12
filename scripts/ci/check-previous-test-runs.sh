#!/usr/bin/env bash
set -euo pipefail

# API and artifact errors must leave the default decision to run tests.
echo "skip_tests=false" >> "$GITHUB_OUTPUT"

if [[ "$EVENT_NAME" == "workflow_dispatch" ]] || (( RUN_ATTEMPT > 1 )); then
    echo "Manually triggered workflow or re-run. Running all tests."
    exit 0
fi

WORKFLOW_ID=$(gh workflow list \
    --repo "$REPO" \
    --json id,name \
    --limit 100 \
    --jq ".[] | select(.name == \"${WORKFLOW_NAME}\") | .id")

PREVIOUS_RUN_RESPONSE=$(curl --fail --silent --show-error \
    -H "Authorization: Bearer ${GH_TOKEN}" \
    --get "https://api.github.com/repos/$REPO/actions/workflows/${WORKFLOW_ID}/runs" \
    --data-urlencode "event=pull_request" \
    --data-urlencode "branch=${PR_BRANCH}" \
    --data-urlencode "created=>=${PR_CREATED_TIMESTAMP}" \
    --data-urlencode "status=completed" \
    --data-urlencode "per_page=1")

if [[ "$(jq -r '.workflow_runs[0].conclusion // ""' <<< "$PREVIOUS_RUN_RESPONSE")" != "success" ]]; then
    echo "No previous successful run found. Running all tests."
    exit 0
fi

PREVIOUS_RUN_ID=$(jq -r '.workflow_runs[0].id' <<< "$PREVIOUS_RUN_RESPONSE")
PREVIOUS_RUN_ATTEMPT=$(jq -r '.workflow_runs[0].run_attempt' <<< "$PREVIOUS_RUN_RESPONSE")
RESULTS_DIRECTORY=$(mktemp -d)
trap 'rm -rf "$RESULTS_DIRECTORY"' EXIT

if ! gh run download "$PREVIOUS_RUN_ID" --repo "$REPO" \
    --pattern "e2e-reuse-status-${PREVIOUS_RUN_ATTEMPT}-*" \
    --dir "$RESULTS_DIRECTORY" 2>/dev/null; then
    echo "Previous raw test results are unavailable. Running all tests."
    exit 0
fi

for (( SHARD = 0; SHARD < TEST_SHARDS; SHARD++ )); do
    REPORT="$RESULTS_DIRECTORY/e2e-reuse-status-${PREVIOUS_RUN_ATTEMPT}-${SHARD}/e2e-reuse-status.json"
    if ! jq -e '.hasFailures == false' "$REPORT" >/dev/null 2>&1; then
        echo "Shard ${SHARD} had failures, including quarantined failures, or has no valid result. Running all tests."
        exit 0
    fi
done

SUCCESSFUL_JOB_URL=$(jq -r '.workflow_runs[0].html_url' <<< "$PREVIOUS_RUN_RESPONSE")
echo "Previous run passed all shards without raw failures: ${SUCCESSFUL_JOB_URL}"
echo "skip_tests=true" >> "$GITHUB_OUTPUT"
