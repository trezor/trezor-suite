#!/usr/bin/env bash

set -e -o pipefail

# Usage:
# ./connect-release.sh DESTINATION
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

echo "Uploading to s3://staging-connect.trezor.io/$latest_version/ and s3://staging-connect.trezor.io/$current_version/"

# organize the files in one directory
tmp_folder="tmp-connect-release"

mkdir $tmp_folder/
cp -r packages/connect-iframe/build/* $tmp_folder/.
cp -r packages/connect-popup/build/* $tmp_folder/.
cp -r packages/connect-web/build/* $tmp_folder/.
cp -r packages/connect-explorer/build/* $tmp_folder/.

# sync the files to aws
aws s3 sync --delete --cache-control 'public, max-age=3600' "$tmp_folder/" "s3://staging-connect.trezor.io/$latest_version/"
aws s3 sync --delete --cache-control 'public, max-age=3600' "$tmp_folder/" "s3://staging-connect.trezor.io/$current_version/"
aws cloudfront create-invalidation --distribution-id E55GK1B3RPIPX --paths '/*'

# cleaning up
echo "Cleaning up"
rm -rf $tmp_folder

echo "DONE"
