#!/usr/bin/env bash
set -euo pipefail

repository="${CACHE_REPOSITORY:?Expected owner/repository}"
pr_filter="${CACHE_PR_NUMBER:-}"
if [[ -n "$pr_filter" && ! "$pr_filter" =~ ^[0-9]+$ ]]; then
    echo 'Expected a numeric pull request number.' >&2
    exit 1
fi

caches=$(mktemp)
trap 'rm -f "$caches"' EXIT
gh api --paginate "repos/$repository/actions/caches?per_page=100" \
    --jq '.actions_caches[] | [.id, .ref, .size_in_bytes] | @tsv' > "$caches"

cut -f2 "$caches" | sort -u | while IFS= read -r ref; do
    [[ "$ref" =~ ^refs/pull/([0-9]+)/merge$ ]] || continue
    pr_number="${BASH_REMATCH[1]}"
    [[ -z "$pr_filter" || "$pr_filter" == "$pr_number" ]] || continue
    state=$(gh api "repos/$repository/pulls/$pr_number" --jq '.state')
    [[ "$state" == closed ]] || continue

    awk -F '\t' -v ref="$ref" '$2 == ref { print $1 "\t" $3 }' "$caches" |
        while IFS=$'\t' read -r cache_id bytes; do
            printf 'Closed PR #%s: cache %s (%s bytes), ref %s\n' "$pr_number" "$cache_id" "$bytes" "$ref"
            if [[ "${CACHE_DELETE:-false}" == true ]]; then
                gh api --method DELETE "repos/$repository/actions/caches/$cache_id"
            fi
        done
done
