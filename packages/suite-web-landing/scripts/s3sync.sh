#! /usr/bin/env nix-shell
#! nix-shell -i bash -p awscli

# Before first use:
# Install awscli (pip install awscli)
# Configure access credentials (aws configure), region is "eu-central-1"

# Usage:
# ./s3sync.sh DESTINATION SOURCE [clear]
# @DESTINATION: required, destination server
# @SOURCE: required, build
# @CLEAR: optional, delete previous uploads
# ./s3sync.sh stage beta
# ./s3sync.sh stage stable
# ./s3sync.sh stage stable clear
# ./s3sync.sh beta beta
# ./s3sync.sh stable stable

function confirm {
    read -r -p "Are you sure? [y/N] " response
    if [[ $response =~ ^(yes|y)$ ]]; then
        echo "let's go!"
    else
        exit 2
    fi
}

# Validate params
if [ "x$1" == "x" ] || [ "x$2" == "x" ]; then
    echo "Invalid params"
    echo "./s3sync.sh stage|beta|stable beta|stable [clear]"
    exit 1
fi

# Validate destination param
if [ "x$1" != "xstage" ] && [ "x$1" != "xbeta" ] && [ "x$1" != "xstable" ]; then
    echo "Invalid destination: "$1
    echo "use: stage|beta|stable"
    exit 1
fi

# Validate source param
if [ "x$2" != "xbeta" ] && [ "x$2" != "xstable" ]; then
    echo "Invalid source: "$2
    echo "use: beta|stable"
    exit 1
fi

# Set source directory
if [ "x$2" == "xbeta" ]; then
    SOURCE=../build/

elif [ "x$2" == "xstable" ]; then
    SOURCE=../build/
fi

# Set destination
if [ "x$1" == "xstage" ]; then
    BUCKET=stage.mytrezor.com
    DISTRIBUTION_ID="E24M0QWO692FQL"
elif [ "x$1" == "xbeta" ]; then
    BUCKET=beta.mytrezor.com
    DISTRIBUTION_ID="E1PONNHWUNCQ9M"
elif [ "x$1" == "xstable" ]; then
    BUCKET=wallet.mytrezor.com
    DISTRIBUTION_ID="EZM01GFTITGVD"
fi

echo "sync "$SOURCE" with "$BUCKET"/"

if [ "x$1" == "xbeta" ] || [ "x$1" == "xstable" ]; then
    confirm
fi

set -e
cd `dirname $0`

if [ "x$3" == "x-clear" ]; then
    aws s3 sync --delete --cache-control 'public, max-age=3600' $SOURCE s3://$BUCKET/
else
    aws s3 sync --cache-control 'public, max-age=3600' $SOURCE s3://$BUCKET/
fi

aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths '/*'

echo "DONE"
