#!/bin/bash

# Before first use:
# Install awscli (pip install awscli)
# Configure access credentials (aws configure), region is "eu-central-1"

function confirm {
    read -r -p "Are you sure? [y/N] " response
    if [[ $response =~ ^(yes|y)$ ]]; then
        echo "let's go!"
    else
        exit 2
    fi
}

if [ "x$1" == "x" ]; then
    echo "./s3sync.sh stage|beta|wallet [-d]"
    exit 1
fi

if [ "x$1" == "xstage" ]; then
    DIST=../build/beta
    BUCKET=stage.mytrezor.com
    DISTRIBUTION_ID="E24M0QWO692FQL"

elif [ "x$1" == "xbeta" ]; then
    DIST=../build/beta
    BUCKET=beta.mytrezor.com
    DISTRIBUTION_ID="E1PONNHWUNCQ9M"

    confirm

elif [ "x$1" == "xwallet" ]; then
    DIST=../build/prod
    BUCKET=wallet.mytrezor.com
    DISTRIBUTION_ID="EZM01GFTITGVD"

    confirm

fi

set -e
cd `dirname $0`

if [ "x$2" == "x-d" ]; then
    aws s3 sync --delete --cache-control 'public, max-age=3600' $DIST s3://$BUCKET/next
else
    aws s3 sync --cache-control 'public, max-age=3600' $DIST s3://$BUCKET/next
fi

aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths '/*'

echo "DONE"