#!/usr/bin/env bash
# this script finds duplicated files in project per provided extension

# $1 should contain path such as ./packages/suite-data/files
# $2 should contain file extension such as .png

result=$(find "$1" -name "*$2" ! -path "**/node_modules/*" ! -empty -type f -exec md5sum {} + | sort | uniq -w32 -dD)


if [ -z "$result" ]
then
      echo "no duplicates for ${2}"
else
      echo "duplicates found"
      echo "$result" | tr "$2 " "$2\n"
      exit 1
fi
