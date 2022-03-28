#!/usr/bin/env bash

set -euxo pipefail

# Before first use:
# Install awscli (pip install awscli)
# Configure access credentials (aws configure), region is "eu-central-1"

# Usage:
# ./s3sync.sh DESTINATION
# @DESTINATION: required, destination directory (connect major version)

# Validate params
if [ -z "$1" ]; then
    echo "Invalid params"
    echo "Usage example: ./s3sync.sh 8"
    exit 1
fi

echo "Uploading to s3://connect.trezor.io/$1/"

aws s3 sync --delete --cache-control 'public, max-age=3600' build/ s3://connect.trezor.io/$1/
aws cloudfront create-invalidation --distribution-id E3LVNAOGT94E37 --paths '/*'

echo "DONE"
