#!/usr/bin/env bash
set -uo pipefail   # no -e here, we’ll handle errors manually

export GIT_PAGER=cat  # cat used so that raw output is compared (prevent pagination or diff tools such as vim)
export LC_ALL=C  # force `sort` to work the same way (ASCII order)

SNAPSHOT_FILE="scripts/circular-dependencies/madge-snapshot.txt"
TMP_FILE="$(mktemp)"

# Run madge, allow it to fail
if ! npx madge@8.0.0 --circular --extensions ts,tsx --exclude "node_modules|lib|libDev" packages suite suite-native suite-common | tail -n +2 | sed 's/^[0-9][0-9]*) *//' | sort > "$TMP_FILE"; then
  echo "⚠️ madge exited with non-zero status, continuing to compare results..."
  echo
fi

# Compare results
if ! git diff --no-index --color=always "$SNAPSHOT_FILE" "$TMP_FILE"; then
  echo
  echo "❌ Circular dependency snapshot mismatch!"
  echo "Update the snapshot with:"
  echo "  npx madge@8.0.0 --circular --extensions ts,tsx --exclude \"node_modules|lib|libDev\" packages suite suite-native suite-common | tail -n +2 | sed 's/^[0-9][0-9]*) *//' | LC_ALL=C sort > $SNAPSHOT_FILE"
  rm -f "$TMP_FILE"
  exit 1
fi

echo "✅ Circular dependencies match snapshot."
rm -f "$TMP_FILE"
exit 0
