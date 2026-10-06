#!/bin/bash

# Creates a monthly dependency maintenance GitHub issue for a given team,
# adds it to the Suite project board, and sets Team and Release fields.
#
# Usage: TEAM=Suite-Growth ./create-monthly-deps-issue.sh
#
# Environment variables:
#   TEAM     (required) - e.g. Suite-Growth, Suite-Wallet, Suite-Trade, Suite-Earn, Suite-Networks
#   GH_TOKEN - GitHub token for gh CLI (optional if already authenticated)

set -euo pipefail

: "${TEAM:?TEAM environment variable is required}"

REPO="trezor/trezor-suite"
ISSUE_TEMPLATE=".github/ISSUE_TEMPLATE/07_deps_maintenance_task.md"
ISSUE_BODY_FILE="/tmp/issue_body.md"

# Prepare issue body (strip YAML frontmatter delimited by ---)
awk '/^---$/{f=!f; next} !f' "$ISSUE_TEMPLATE" > "$ISSUE_BODY_FILE"

# Calculate previous month/year
CURRENT_MONTH=$(( 10#$(date +%m) ))
CURRENT_YEAR=$(date +%Y)
if [ "$CURRENT_MONTH" -eq 1 ]; then
    PREV_MONTH=12
    PREV_YEAR=$(( CURRENT_YEAR - 1 ))
else
    PREV_MONTH=$(( CURRENT_MONTH - 1 ))
    PREV_YEAR=$CURRENT_YEAR
fi
PREV_YEAR_MONTH=$(printf "%02d.%02d" $(( PREV_YEAR % 100 )) "$PREV_MONTH")

# Find and link previous month's issue
PREV_ISSUE_URL=$(gh issue list \
    --repo "$REPO" \
    --search "Bump ${TEAM} deps in:title" \
    --state all \
    --json url,title \
    --jq ".[] | select(.title == \"Bump ${TEAM} deps (${PREV_YEAR_MONTH})\") | .url" \
    | head -1)

if [ -n "$PREV_ISSUE_URL" ]; then
    sed "s|<!--- Previous issue: optionally link the previous issue for visibility -->|Previous issue: ${PREV_ISSUE_URL}|" "$ISSUE_BODY_FILE" > "${ISSUE_BODY_FILE}.tmp"
else
    sed "/<!--- Previous issue: optionally link the previous issue for visibility -->/d" "$ISSUE_BODY_FILE" > "${ISSUE_BODY_FILE}.tmp"
fi
mv "${ISSUE_BODY_FILE}.tmp" "$ISSUE_BODY_FILE"

# Create the issue
YEAR_MONTH="$(date +%y).${CURRENT_MONTH}"
ISSUE_URL=$(gh issue create \
    --repo "$REPO" \
    --title "Bump ${TEAM} deps (${YEAR_MONTH})" \
    --body-file "$ISSUE_BODY_FILE" \
    --label "dependencies")

echo "Created issue: $ISSUE_URL"

# Add issue to Suite project and capture item ID
ITEM_ID=$(gh project item-add 58 \
    --owner trezor \
    --url "$ISSUE_URL" \
    --format json \
    --jq '.id')

echo "Added to project (item: $ITEM_ID)"

# Set Team and Release project fields
PROJECT_ID=$(gh project view 58 --owner trezor --format json --jq '.id')
FIELDS_JSON=$(gh project field-list 58 --owner trezor --format json)

TEAM_FIELD_ID=$(echo "$FIELDS_JSON" | jq -r '.fields[] | select(.name == "Team") | .id')
TEAM_OPTION_ID=$(echo "$FIELDS_JSON" | jq -r --arg v "$TEAM" '.fields[] | select(.name == "Team") | .options[] | select(.name | startswith($v)) | .id')

RELEASE_FIELD_ID=$(echo "$FIELDS_JSON" | jq -r '.fields[] | select(.name == "Release") | .id')
# shellcheck disable=SC2016
RELEASE_ITERATION_ID=$(gh api graphql \
    -f query='query($fieldId: ID!) {
        node(id: $fieldId) {
            ... on ProjectV2IterationField {
                configuration {
                    iterations { id title }
                    completedIterations { id title }
                }
            }
        }
    }' \
    -f fieldId="$RELEASE_FIELD_ID" \
    --jq ".data.node.configuration | (.iterations + .completedIterations)[] | select(.title == \"$YEAR_MONTH\") | .id")

if [ -n "$TEAM_FIELD_ID" ] && [ -n "$TEAM_OPTION_ID" ]; then
    gh project item-edit \
        --project-id "$PROJECT_ID" \
        --id "$ITEM_ID" \
        --field-id "$TEAM_FIELD_ID" \
        --single-select-option-id "$TEAM_OPTION_ID"
    echo "Set Team: $TEAM"
else
    echo "Warning: Team field or option '$TEAM' not found, skipping" >&2
fi

if [ -n "$RELEASE_FIELD_ID" ] && [ -n "$RELEASE_ITERATION_ID" ]; then
    gh project item-edit \
        --project-id "$PROJECT_ID" \
        --id "$ITEM_ID" \
        --field-id "$RELEASE_FIELD_ID" \
        --iteration-id "$RELEASE_ITERATION_ID"
    echo "Set Release: $YEAR_MONTH"
else
    echo "Warning: Release iteration '$YEAR_MONTH' not found, skipping" >&2
fi
