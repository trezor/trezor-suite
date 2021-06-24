#! /usr/bin/env nix-shell
#! nix-shell -i bash -p awscli

# Before first use:
# Install awscli (pip install awscli)
# Configure access credentials (aws configure), region is "eu-central-1"

# Usage:
# ./s3sync.sh DESTINATION [-clear]
#     DESTINATION  required, destination server
#     -clear       optional, delete previous uploads

function confirm {
    read -r -p "Are you sure? [y/N] " response
    if [[ $response =~ ^(yes|y)$ ]]; then
        echo "let's go!"
    else
        exit 2
    fi
}

SOURCE=../build/

# Set destination
if [ "x$1" == "xstaging-wallet" ]; then
    BUCKET=stage.mytrezor.com
    DISTRIBUTION_ID=E24M0QWO692FQL
    DESTDIR=/wallet/web
elif [ "x$1" == "xstaging-suite" ]; then
    BUCKET=staging-suite.trezor.io
    DISTRIBUTION_ID=E232X8775ST76R
    DESTDIR=/web
elif [ "x$1" == "xsuite" ]; then
    BUCKET=suite.trezor.io
    DISTRIBUTION_ID=E4TDVEWU4P4CY
    DESTDIR=/web
else
    echo "Invalid destination: $1"
fi

echo "sync $SOURCE with $BUCKET"

if [ "x$1" == "xsuite" ]; then
    confirm
fi

set -e
cd `dirname $0`

if [ "x$2" == "x-clear" ]; then
    aws s3 sync --delete --cache-control 'public, max-age=3600' $SOURCE s3://$BUCKET$DESTDIR
else
    aws s3 sync --cache-control 'public, max-age=3600' $SOURCE s3://$BUCKET$DESTDIR
fi

aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "$DESTDIR/*"

echo "DONE"
