#!/bin/bash

# Creates a monthly dependency maintenance GitHub issue for a given team,
# adds it to the Suite project board, and sets Team and Release fields.
#
# Usage: TEAM=Suite-Growth ./scripts/dependa-bot/create-monthly-deps-issue.sh
#
# Environment variables:
#   TEAM     (required) - e.g. Suite-Growth, Suite-Wallet, Suite-Trade, Suite-Earn, Suite-Networks
#   GH_TOKEN - GitHub token for gh CLI (optional if already authenticated)

set -euo pipefail

: "${TEAM:?TEAM environment variable is required}"

REPO="trezor/trezor-suite"
ISSUE_TEMPLATE_DIR="scripts/dependa-bot"
TEAM_TEMPLATE="$ISSUE_TEMPLATE_DIR/${TEAM%% *}.md"
ISSUE_BODY_FILE=$(mktemp)
trap 'rm -f "$ISSUE_BODY_FILE" "${ISSUE_BODY_FILE}.tmp"' EXIT

# Compose the common checklist, optional team checklist, and shared footer.
cat "$ISSUE_TEMPLATE_DIR/common.md" > "$ISSUE_BODY_FILE"
if [ -f "$TEAM_TEMPLATE" ]; then
    cat "$TEAM_TEMPLATE" >> "$ISSUE_BODY_FILE"
fi
printf '\n' >> "$ISSUE_BODY_FILE"
cat "$ISSUE_TEMPLATE_DIR/footer.md" >> "$ISSUE_BODY_FILE"

# Target next month's release, using the same UTC date for year and month.
read -r CURRENT_YEAR CURRENT_MONTH < <(date -u '+%Y %m')
CURRENT_MONTH=$((10#$CURRENT_MONTH))
NEXT_MONTH=$((CURRENT_MONTH % 12 + 1))
NEXT_YEAR=$((CURRENT_YEAR + CURRENT_MONTH / 12))
YEAR_MONTH=$(printf "%02d.%d" "$((NEXT_YEAR % 100))" "$NEXT_MONTH")
PREV_YEAR_MONTH=$(printf "%02d.%d" "$((CURRENT_YEAR % 100))" "$CURRENT_MONTH")

# Resolve project metadata before creating an issue, so missing configuration
# fails visibly instead of leaving a successfully-created issue unclassified.
PROJECT_ID=$(gh project view 58 --owner trezor --format json --jq '.id')
FIELDS_JSON=$(gh project field-list 58 --owner trezor --limit 1000 --format json)

unique_id() {
    jq -er --arg description "$1" 'if length == 1 and .[0] != null and .[0] != "" then .[0]
        else error("Expected exactly one match for " + $description) end'
}

TEAM_FIELD_ID=$(jq '[.fields[] | select(.name == "Team") | .id]' <<< "$FIELDS_JSON" | unique_id "Team field")
# Match the stable team name independently of decorative emoji.
TEAM_OPTION_ID=$(jq --arg team "${TEAM%% *}" \
    '[.fields[] | select(.name == "Team") | .options[] |
        select((.name | split(" ")[0]) == $team) | .id]' <<< "$FIELDS_JSON" | unique_id "Team option: ${TEAM%% *}")
RELEASE_FIELD_ID=$(jq '[.fields[] | select(.name == "Release") | .id]' <<< "$FIELDS_JSON" | unique_id "Release field")

# shellcheck disable=SC2016
ITERATIONS_JSON=$(gh api graphql \
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
    -f fieldId="$RELEASE_FIELD_ID")
RELEASE_ITERATION_ID=$(jq --arg release "$YEAR_MONTH" \
    '[.data.node.configuration | (.iterations + .completedIterations)[] |
        select(.title == $release) | .id]' <<< "$ITERATIONS_JSON" | unique_id "Release iteration: $YEAR_MONTH")

# Find and link the preceding release's issue
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
ISSUE_URL=$(gh issue create \
    --repo "$REPO" \
    --title "Bump ${TEAM} deps (${YEAR_MONTH})" \
    --body-file "$ISSUE_BODY_FILE" \
    --label "dependencies")

echo "Created issue: $ISSUE_URL"

# Add issue to Suite project and capture item ID
if ! ITEM_ID=$(gh project item-add 58 \
    --owner trezor \
    --url "$ISSUE_URL" \
    --format json \
    --jq '.id'); then
    # The project's auto-add workflow can add the issue before item-add does.
    # shellcheck disable=SC2016
    ITEM_ID=$(gh api graphql \
        -f query='query($url: URI!) {
            resource(url: $url) {
                ... on Issue {
                    projectItems(first: 20) { nodes { id project { id } } }
                }
            }
        }' \
        -f url="$ISSUE_URL" \
        --jq ".data.resource.projectItems.nodes[] | select(.project.id == \"$PROJECT_ID\") | .id")
fi
: "${ITEM_ID:?Issue $ISSUE_URL is not on project 58}"

echo "Added to project (item: $ITEM_ID)"

# Apply the same team and release used in the issue title.
gh project item-edit \
    --project-id "$PROJECT_ID" \
    --id "$ITEM_ID" \
    --field-id "$TEAM_FIELD_ID" \
    --single-select-option-id "$TEAM_OPTION_ID"
echo "Set Team: $TEAM"

gh project item-edit \
    --project-id "$PROJECT_ID" \
    --id "$ITEM_ID" \
    --field-id "$RELEASE_FIELD_ID" \
    --iteration-id "$RELEASE_ITERATION_ID"
echo "Set Release: $YEAR_MONTH"
