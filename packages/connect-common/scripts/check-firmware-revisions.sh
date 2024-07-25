#!/usr/bin/env bash

PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" || exit ; pwd -P )

if [[ $# -ne 1 ]]
    then
        echo "must provide 1 argument. $# provided"
        exit 1
fi

DEVICE=$1

if [[ $DEVICE != "t1b1" && $DEVICE != "t2t1" ]]
    then
        echo "device must be either 't1b1' or 't2t1' (lowercase!)"
        exit 1
fi

BRANCH="main"
REPO_DIR_NAME=$PARENT_PATH"/../../../../trezor-firmware-for-revision-check"

cd ..

if test -d "$REPO_DIR_NAME"; then
    echo "$REPO_DIR_NAME directory exists"
else
    echo "$REPO_DIR_NAME directory does not exist"
    git clone https://github.com/trezor/trezor-firmware.git "$REPO_DIR_NAME"
fi

cd "$REPO_DIR_NAME" || exit
git fetch origin
git checkout "$BRANCH"
git reset "origin/$BRANCH" --hard

DATA=$(jq -r '.[] | .version |= join(".") | .firmware_revision + "%" + .version' < "$PARENT_PATH"/../files/firmware/"$DEVICE"/releases.json)

for ROW in $DATA;
do 
    FW_REVISION=$(echo "$ROW" | cut -d"%" -f1)
    EXPECTED_TAG=$([[ "$DEVICE" == "t1b1" ]] && echo "legacy" || echo "core")/v$(echo "$ROW" | cut -d"%" -f2)
    
    RESULT_TAGS=$(git tag --points-at "$FW_REVISION")

    for RESULT_TAG in $RESULT_TAGS;
    do  
        if [[ "$RESULT_TAG" == "$EXPECTED_TAG" ]]; then
            echo "[$DEVICE] Version $EXPECTED_TAG ... OK"
            continue 2
        fi
    done

    echo "ERROR: [$DEVICE] Tags '$RESULT_TAGS' does not contain expected: '$EXPECTED_TAG' for revision: $FW_REVISION"
    exit 1
done
