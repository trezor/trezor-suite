#!/usr/bin/env bash
set -euo pipefail

operation="${1:?Expected save or restore}"
archive="${2:?Expected archive path}"

case "$operation" in
    save)
        # Keep the install state and every workspace's dependencies together, including symlinks.
        test -f .yarn/install-state.gz
        paths=$(mktemp)
        trap 'rm -f "$paths"' EXIT
        find . -type d \( -name .git -o -name .yarn \) -prune -o \
            -type d -name node_modules -prune -print0 > "$paths"
        printf './.yarn/install-state.gz\0' >> "$paths"
        tar -czf "$archive" --null -T "$paths"
        ;;
    restore)
        tar -xzf "$archive"
        ;;
    *)
        echo "Unknown operation: $operation" >&2
        exit 1
        ;;
esac
