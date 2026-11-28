#!/usr/bin/env bash
# Replaces all old connect v9 releases on connect.trezor.io (e.g. /9.7.3/) with the latest one
# (e.g. /9.7.4/), backing up each old release to the rollback bucket first.
#
# Usage: ./scripts/connect-v9-replace-old-versions.sh [--execute]
# Without --execute it only prints what would be copied and deleted.

set -euo pipefail

BUCKET="s3://connect.trezor.io"
BACKUP="s3://rollback-connect.trezor.io/archive"
CLOUDFRONT_DISTRIBUTION_ID="E3LVNAOGT94E37"

EXECUTE=false
if [[ "${1:-}" == "--execute" ]]; then
    EXECUTE=true
fi

s3_sync() {
    if [[ "$EXECUTE" == true ]]; then
        aws s3 sync "$@"
    else
        aws s3 sync --dryrun "$@"
    fi
}

# Stable 9.x.y releases only, prereleases and the /9/ alias are left untouched.
VERSIONS=$(aws s3 ls "$BUCKET/" | awk '$1 == "PRE" { print $2 }' | tr -d / | grep -E '^9\.[0-9]+\.[0-9]+$' | sort -V)
LATEST=$(tail -n 1 <<< "$VERSIONS")
OLD_VERSIONS=$(sed '$d' <<< "$VERSIONS")

echo "Latest: $LATEST"
echo "Replacing:"
echo "$OLD_VERSIONS"

for VERSION in $OLD_VERSIONS; do
    # On a re-run the old version already holds the latest content, so never overwrite its backup.
    if ! aws s3 ls "$BACKUP/$VERSION/" > /dev/null; then
        s3_sync "$BUCKET/$VERSION/" "$BACKUP/$VERSION/"
    fi

    # Every file of the latest release is newer than the old release, so sync overwrites all of them.
    s3_sync --delete "$BUCKET/$LATEST/" "$BUCKET/$VERSION/"
done

if [[ "$EXECUTE" == true ]]; then
    aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths '/9.*'
else
    echo "Dry run only, re-run with --execute to apply."
fi
