#!/usr/bin/env bash
set -uo pipefail

export GIT_PAGER=cat
export LC_ALL=C

SHOULD_UPDATE_SNAPSHOT=0

for arg in "$@"; do
    case "$arg" in
        --update)
            SHOULD_UPDATE_SNAPSHOT=1
            ;;
        *)
            echo "Usage: bash scripts/knip/check-knip.sh [--update]"
            exit 1
            ;;
    esac
done

SNAPSHOT_FILE="scripts/knip/knip-snapshot.txt"
KNIP_ARGS=(--reporter compact --no-exit-code)
REPO_ROOT="$(git rev-parse --show-toplevel)"
REPO_PARENT="$(dirname "$REPO_ROOT")"
REPO_GRANDPARENT="$(dirname "$REPO_PARENT")"

RAW_OUTPUT_FILE="$(mktemp)"
NORMALIZED_OUTPUT_FILE="$(mktemp)"

trap 'rm -f "$RAW_OUTPUT_FILE" "$NORMALIZED_OUTPUT_FILE"' EXIT

# Knip stdout is prefixed with non-deterministic dotenv tips in this repo, so we must
# strip those lines before snapshotting. We also need to rewrite absolute paths to stable
# repo-relative ones because Knip reports machine-specific checkout paths in some findings.
# CI may also force colorized output, so ANSI escape sequences must be removed before
# parsing section headers or diffing against the plain-text snapshot.
# The section-prefixing and sorting then make the snapshot stable even if Knip changes
# report ordering, while still preserving each line's category after the original section
# headers are removed.
normalize_knip_output() {
    sed '/^\[dotenv@/d;/^$/d' "$1" |
        sed -E $'s/\x1B\[[0-9;]*[[:alpha:]]//g; s/\r$//' | awk '
        /^[^[:space:]].* \([0-9]+\)$/ {
            section = $0;
            sub(/ \([0-9]+\)$/, "", section);
            next;
        }

        section != "" {
            print section ": " $0;
        }
    ' | sed \
        -e "s|$REPO_ROOT/||g" \
        -e "s|$REPO_PARENT/|../|g" \
        -e "s|$REPO_GRANDPARENT/|../../|g" | sort -u > "$2"
}

if ! yarn exec knip "${KNIP_ARGS[@]}" > "$RAW_OUTPUT_FILE"; then
    echo "⚠️ knip exited with non-zero status, continuing to compare results..."
    echo
fi

normalize_knip_output "$RAW_OUTPUT_FILE" "$NORMALIZED_OUTPUT_FILE"

if [[ ! -s "$NORMALIZED_OUTPUT_FILE" && -s "$SNAPSHOT_FILE" ]]; then
    echo "❌ Failed to parse Knip output into a normalized snapshot."
    exit 1
fi

if [[ "$SHOULD_UPDATE_SNAPSHOT" -eq 1 ]]; then
    cp "$NORMALIZED_OUTPUT_FILE" "$SNAPSHOT_FILE"
    echo "✅ Updated $SNAPSHOT_FILE"
    exit 0
fi

if ! git diff --no-index --color=always "$SNAPSHOT_FILE" "$NORMALIZED_OUTPUT_FILE"; then
    echo
    echo "❌ Knip snapshot mismatch!"
    echo "Update the snapshot with:"
    echo "  bash scripts/knip/check-knip.sh --update"

    exit 1
fi

echo "✅ Knip snapshot matches."
exit 0
