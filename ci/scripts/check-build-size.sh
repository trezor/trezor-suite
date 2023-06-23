#!/usr/bin/env bash

set -e

echo "artifact path: $1"
echo "base artifact to compare with path path $2"

NEW_SIZE_RES=$(curl $1 -sI | grep -i Content-Length)
OLD_SIZE_RES=$(curl $2 -sI | grep -i Content-Length)

NEW_SIZE=${NEW_SIZE_RES/"content-length: "/""}
OLD_SIZE=${OLD_SIZE_RES/"content-length: "/""}

OLD_SIZE_FORMATTED="$((${OLD_SIZE//[ $'\001'-$'\037']}))"
NEW_SIZE_FORMATTED="$((${NEW_SIZE//[ $'\001'-$'\037']}))"

MAX_ALLOWED_SIZE=$(echo "$OLD_SIZE_FORMATTED * $3" | bc)

echo "new size:$NEW_SIZE"
echo "old size:$OLD_SIZE"
echo "max allowed size change coefficient $3"
echo "max allowed size: $MAX_ALLOWED_SIZE"

result=$(echo "$NEW_SIZE_FORMATTED < $MAX_ALLOWED_SIZE" | bc)

# # if you have considerably more, there is a chance that you accidentally included
# # parts of code that shouldn't be in this build.
if [[ "$result" -eq 1 ]]
then
    echo "size seems ok"
else   
    echo "suspiciously large build detected!"
    exit 1;
fi

