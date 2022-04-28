#!/usr/bin/env bash
set -e

CRX_VER=1_0_25
TOR_VER=0.4.6.10

curl https://tor.bravesoftware.com/release/biahpgbdmdkfgndcmfiipgcebobojjkp/extension_${CRX_VER}.crx -o brave-tor-lin.crx
curl https://tor.bravesoftware.com/release/cldoidikboihgcjfkhdeidbpclkineef/extension_${CRX_VER}.crx -o brave-tor-mac.crx
curl https://tor.bravesoftware.com/release/cpoalefficncklhjfpglfiplenlpccdb/extension_${CRX_VER}.crx -o brave-tor-win.crx

for p in lin mac win ; do
    7z x -y -o_${p}/ brave-tor-${p}.crx
done

mv _lin/tor-${TOR_VER}-linux-brave-0 linux-x64/tor
# linux-arm64/tor needs to be built manually using the build_linux.sh script
# from https://github.com/brave/tor_build_scripts and running on aarch64/arm64 machine
rm -rf _lin/

lipo _mac/tor-${TOR_VER}-darwin-brave-0 -thin arm64 -output mac-arm64/tor
lipo _mac/tor-${TOR_VER}-darwin-brave-0 -thin x86_64 -output mac-x64/tor
rm -rf _mac/

mv _win/tor-${TOR_VER}-win32-brave-0 win-x64/tor.exe
rm -rf _win/

chmod +x linux-x64/tor mac-arm64/tor mac-x64/tor

rm -rf brave-tor-*.crx
