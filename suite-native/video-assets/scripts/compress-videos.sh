#!/usr/bin/env bash
# Reads all .mp4 files from `assets/raw` and creates a compressed copy in `assets/compressed` if not already existing.

cd assets/raw || exit
for video_file in *.mp4
do
      ffmpeg -y -i "$video_file" -c:v libx265 -vtag hvc1 ../compressed/"$video_file" -loglevel error -nostats
      echo "Video file $video_file compressed!"
done

exit