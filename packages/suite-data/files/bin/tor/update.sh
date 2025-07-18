#!/usr/bin/env bash
set -e

VERSION_FILE=tor_version

# Comment this for debugging
QUIET=--quiet

# check whether we have all required commands
for cmd in tar ; do
  command -v $cmd >/dev/null 2>&1 || { echo >&2 "Program $cmd required but not installed. Aborting."; exit 1; }
done

test_version() {
    if curl --head --silent --fail "https://archive.torproject.org/tor-package-archive/torbrowser/$1/tor-expert-bundle-windows-x86_64-$1.tar.gz" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Update tor version
IFS='.' read -r MAJOR MINOR PATCH < "$VERSION_FILE"
while test_version "$((MAJOR+1)).0.0"; do
    MAJOR=$((MAJOR+1))
    MINOR=0
    PATCH=0
done
while test_version "$MAJOR.$((MINOR+1)).0"; do
    MINOR=$((MINOR+1))
    PATCH=0
done
while test_version "$MAJOR.$MINOR.$((PATCH+1))"; do
    PATCH=$((PATCH+1))
done

# Save tor version
TOR_VERSION=$MAJOR.$MINOR.$PATCH
echo $TOR_VERSION > $VERSION_FILE


# install exit trap which removes the temp directory
function finish {
    rm -rf tmp/
}
trap finish EXIT

# create temp directory
mkdir -p tmp/

# get windows from the official source
echo "win-x64"
wget $QUIET https://archive.torproject.org/tor-package-archive/torbrowser/$TOR_VERSION/tor-expert-bundle-windows-x86_64-$TOR_VERSION.tar.gz -O tmp/tor-win.tar.gz
tar xzf tmp/tor-win.tar.gz --directory=tmp/
cp tmp/tor/tor.exe win-x64/tor.exe

# get linux and mac from nix
echo "mac-arm64"
cp $(nix-build $QUIET '<nixpkgs>' -A tor --argstr system aarch64-darwin --no-out-link)/bin/tor mac-arm64/tor
echo "mac-x64"
cp $(nix-build $QUIET '<nixpkgs>' -A tor --argstr system x86_64-darwin --no-out-link)/bin/tor mac-x64/tor
echo "linux-arm64"
cp $(nix-build $QUIET '<nixpkgs>' -A tor --argstr system aarch64-linux --no-out-link)/bin/tor linux-arm64/tor
echo "linux-x64"
cp $(nix-build $QUIET '<nixpkgs>' -A tor --argstr system x86_64-linux --no-out-link)/bin/tor linux-x64/tor


# set executable flag in case it wasn't set yet
chmod +x linux-*/tor mac-*/tor

echo "Done!"
