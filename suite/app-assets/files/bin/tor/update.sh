#!/usr/bin/env bash

# If you are going to make changes to the script, make sure it stays compatible with update-tor.yml

set -e

# Ensure the script runs from its own directory so it can be invoked from repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

CRX_VER=1_0_51
CRX_LINUX_ARM_VER=1_0_20

# check whether we have all required commands
for cmd in 7z curl git lipo shasum ; do
  command -v $cmd >/dev/null 2>&1 || { echo >&2 "Program $cmd required but not installed. Aborting."; exit 1; }
done

# install exit trap which removes the temp directory
function finish {
  rm -rf tmp/
}
trap finish EXIT

# create temp directory
mkdir -p tmp/

echo "Downloading extension CRX files for:"

# download extensions from which we extract tor binaries
# the extension ids come from "torClient*ExtensionID" variables in
# https://raw.githubusercontent.com/brave/go-update/master/extension/utils.go
echo "- Mac"
curl -s -L "https://tor.bravesoftware.com/release/cldoidikboihgcjfkhdeidbpclkineef/extension_${CRX_VER}.crx" -o tmp/brave-tor-mac.crx
echo "- Windows"
curl -s -L "https://tor.bravesoftware.com/release/cpoalefficncklhjfpglfiplenlpccdb/extension_${CRX_VER}.crx" -o tmp/brave-tor-win.crx
echo "- Linux x64"
curl -s -L "https://tor.bravesoftware.com/release/biahpgbdmdkfgndcmfiipgcebobojjkp/extension_${CRX_VER}.crx" -o tmp/brave-tor-lin-x64.crx
echo "- Linux arm64"
curl -s -L "https://tor.bravesoftware.com/release/monolafkoghdlanndjfeebmdfkbklejg/extension_${CRX_LINUX_ARM_VER}.crx" -o tmp/brave-tor-lin-arm64.crx

# unpack extensions into the temp directory
echo
echo "Unpacking extensions"
for p in lin-arm64 lin-x64 mac win ; do
    7z x -y -otmp/${p}/ tmp/brave-tor-${p}.crx > /dev/null
done

# packageTorClient.js on master can be ahead of the published extensions, so read the version from the mac binary
MAC_BINARIES=(tmp/mac/tor-*-darwin-brave-*)
if [ "${#MAC_BINARIES[@]}" -ne 1 ] || [ ! -f "${MAC_BINARIES[0]}" ]; then
  echo >&2 "Expected exactly one Tor binary in the mac extension. Aborting."
  exit 1
fi
MAC_BINARY=$(basename "${MAC_BINARIES[0]}")
TOR_VER=$(echo "$MAC_BINARY" | sed -E 's/^tor-(.+)-darwin-brave-(.+)$/\1/')
SUFFIX=$(echo "$MAC_BINARY" | sed -E 's/^tor-(.+)-darwin-brave-(.+)$/\2/')
echo
echo "Found Tor release $TOR_VER-$SUFFIX"

git clone --quiet --filter=blob:none --no-checkout --single-branch https://github.com/brave/brave-core-crx-packager.git tmp/packager
for sha in $(git -C tmp/packager log --format=%H -- scripts/packageTorClient.js); do
  git -C tmp/packager show "$sha:scripts/packageTorClient.js" > tmp/packageTorClient.js 2>/dev/null || continue
  if grep -q "const torVersion = '${TOR_VER}'" tmp/packageTorClient.js && grep -q "const braveVersion = '${SUFFIX}'" tmp/packageTorClient.js; then
    PACKAGER_SHA=$sha
    break
  fi
done
if [ -z "$PACKAGER_SHA" ]; then
  echo >&2 "No brave-core-crx-packager revision releases Tor $TOR_VER-$SUFFIX. Aborting."
  exit 1
fi
echo "Using hashes from brave-core-crx-packager $PACKAGER_SHA"

# check extracted binaries against hashes from packageTorClient.js
echo
echo "Checking hashes of downloaded binaries"
grep "  sha512Tor = '" tmp/packageTorClient.js | cut -d "'" -f 2 > tmp/SHA512SUMS
sed -i.bkp "1s;$;  tmp/mac/tor-${TOR_VER}-darwin-brave-${SUFFIX};" tmp/SHA512SUMS
sed -i.bkp "2s;$;  tmp/lin-x64/tor-${TOR_VER}-linux-brave-${SUFFIX};" tmp/SHA512SUMS
sed -i.bkp "3s;$;  tmp/lin-arm64/tor-${TOR_VER}-linux-arm64-brave-${SUFFIX};" tmp/SHA512SUMS
sed -i.bkp "4s;$;  tmp/win/tor-${TOR_VER}-win32-brave-${SUFFIX};" tmp/SHA512SUMS

shasum -a 512 -c tmp/SHA512SUMS

echo
echo "Copying files"
# unpack universal mac binary into arm64 and x64 binaries
lipo "tmp/mac/tor-${TOR_VER}-darwin-brave-${SUFFIX}" -thin arm64 -output mac-arm64/tor
lipo "tmp/mac/tor-${TOR_VER}-darwin-brave-${SUFFIX}" -thin x86_64 -output mac-x64/tor
# copy linux binaries
cp -a "tmp/lin-x64/tor-${TOR_VER}-linux-brave-${SUFFIX}" linux-x64/tor
cp -a "tmp/lin-arm64/tor-${TOR_VER}-linux-arm64-brave-${SUFFIX}" linux-arm64/tor
# copy windows binary
cp -a "tmp/win/tor-${TOR_VER}-win32-brave-${SUFFIX}" win-x64/tor.exe

# set executable flag in case it wasn't set yet
chmod +x linux-*/tor mac-*/tor

echo "Done!"
