#!/usr/bin/env bash
set -e

CRX_VER=1_0_34
CRX_LINUX_ARM_VER=1_0_3

# check whether we have all required commands
for cmd in 7z curl lipo shasum ; do
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

# extract TOR_VER and SUFFIX from packageTorClient.js
TOR_VER=$(curl -s -L https://raw.githubusercontent.com/brave/brave-core-crx-packager/master/scripts/packageTorClient.js | grep "const torVersion = '" | cut -d "'" -f 2)
SUFFIX=$(curl -s -L https://raw.githubusercontent.com/brave/brave-core-crx-packager/master/scripts/packageTorClient.js | grep "const braveVersion = '" | cut -d "'" -f 2)
echo
echo "Expecting Tor release $TOR_VER-$SUFFIX"


# check extracted binaries against hashes from packageTorClient.js
echo
echo "Checking hashes of downloaded binaries"
curl -s -L https://raw.githubusercontent.com/brave/brave-core-crx-packager/master/scripts/packageTorClient.js | grep "  sha512Tor = '" | cut -d "'" -f 2 > tmp/SHA512SUMS
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
