#!/usr/bin/env bash

set -e -o pipefail

# Usage:
# ./connect-release-production.sh DESTINATION
# @DESTINATION: required, destination directory (connect major version)

# Validate params
while [[ "$#" -gt 0 ]]; do case $1 in
    9)
        latest_version="9"
        current_version=$(jq -r .version packages/connect/package.json)
        shift
        ;;
    *)
        echo "Invalid version parameter passed: $1
Used only for version 9"
        exit 1
        shift
        ;;
    esac done

echo "Backing up current production version $latest_version to rollback bucket"

# sync the files to rollback bucket
aws s3 sync "s3://connect.trezor.io/$latest_version/" "s3://rollback-connect.trezor.io/$latest_version/"

echo "Uploading to s3://connect.trezor.io/$latest_version/ and s3://connect.trezor.io/$current_version/"

# sync the files to aws
aws s3 sync --delete --cache-control 'public, max-age=3600' "s3://staging-connect.trezor.io/$latest_version/" "s3://connect.trezor.io/$latest_version/"
aws s3 sync --delete --cache-control 'public, max-age=3600' "s3://staging-connect.trezor.io/$current_version/" "s3://connect.trezor.io/$current_version/"
aws cloudfront create-invalidation --distribution-id E3LVNAOGT94E37 --paths '/*'

echo "DONE"
