#!/usr/bin/env bash
# this script finds duplicated files in project per provided extension
#
# Excluded from duplicate check (intentional duplicates):
#   - suite-common/flags/assets/flags/*
#     Same flags are used on purpose (e.g. overseas territories share flags with parent country).
#   - packages/suite-data/files/videos/device/t3t1/connect_bt.webm
#   - packages/suite-data/files/videos/device/t3t1/connect_bt_loop.webm
#     BT connect videos are placeholders for older Trezor Suite before TS7 release.
#
# $1 should contain path such as ./packages/suite-data/files
# $2 should contain file extension such as .png

exclude_paths=(
    "**/node_modules/*"
    "**/suite-common/flags/assets/flags/*"
    "*t3t1/connect_bt.webm"
    "*t3t1/connect_bt_loop.webm"
)

find_exclude_args=()
for pattern in "${exclude_paths[@]}"; do
    find_exclude_args+=(! -path "$pattern")
done

result=$(find "$1" -name "*$2" "${find_exclude_args[@]}" ! -empty -type f -exec md5sum {} + | sort | uniq -w32 -dD)


if [ -z "$result" ]
then
      echo "no duplicates for ${2}"
else
      echo "duplicates found"
      echo "$result" | tr "$2 " "$2\n"
      exit 1
fi
