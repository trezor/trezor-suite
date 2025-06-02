#!/bin/bash

set -e

# Define URLs and destination directories
PACKAGES=(
  "https://registry.npmjs.org/passport-desktop-win32-ia32-msvc/-/passport-desktop-win32-ia32-msvc-0.1.2.tgz passport-desktop-win32-ia32-msvc"
  "https://registry.npmjs.org/passport-desktop-win32-x64-msvc/-/passport-desktop-win32-x64-msvc-0.1.2.tgz passport-desktop-win32-x64-msvc"
)


for entry in "${PACKAGES[@]}"; do
  # Split URL and directory name
  read -r url name <<<"$entry"
  
  echo "Downloading $name..."
  curl -L "$url" -o "$name.tgz"

  echo "Extracting $name..."
  mkdir -p "node_modules/$name"
  tar -xzf "$name.tgz" -C "node_modules/$name" --strip-components=1

  echo "$name installed in node_modules/$name"
  rm "$name.tgz"
done

echo "✅ All done!"
