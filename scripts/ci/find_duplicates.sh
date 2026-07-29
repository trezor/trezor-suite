#!/usr/bin/env bash
# this script finds duplicated files in project per provided extension
#
# Excluded from duplicate check (intentional duplicates):
#   - packages/suite-data/files/videos/device/t3t1/connect_bt.webm
#   - packages/suite-data/files/videos/device/t3t1/connect_bt_loop.webm
#     BT connect videos are placeholders for older Trezor Suite before TS7 release.
#   - packages/suite-data/files/**/t3w1/*_color_4*.webm and t3w1-backcolor-4.webp
#     The T3W1 color 4 variant intentionally reuses color 1's artwork.
#     The rotate video path is built dynamically as rotate_color_${color}.webm
#     (DeviceAnimation.tsx), so a physical color_4 file must exist even though it
#     is byte-identical to color_1. Remove these once real color-4 assets land.
#
# $1 should contain path such as ./packages/suite-data/files
# $2 should contain file extension such as .png

exclude_paths=(
    "**/node_modules/*"
    "*t3t1/connect_bt.webm"
    "*t3t1/connect_bt_loop.webm"
    "*t3w1/rotate_color_4.webm"
    "*t3w1/rotate_color_4_large.webm"
    "*t3w1/t3w1-backcolor-4.webp"
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
