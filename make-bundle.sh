#!/bin/bash

RELEASE_BRANCH="releases"

rm -rf bundle
mkdir bundle
mkdir ./bundle/wallet

# to build web locally
assetPrefix=/wallet yarn workspace @trezor/suite-web build
mv ./packages/suite-web/build/* ./bundle/wallet

yarn workspace @trezor/landing-page build
rsync -abviuzP ./packages/landing-page/build/* ./bundle/

# to download web from ci
# wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/${RELEASE_BRANCH}/download?job=suite-web%20deploy%20staging" -O ./bundle/suite-web.zip
# unzip ./bundle/suite-web.zip -d ./bundle/
# mkdir ./bundle/wallet
# mv ./bundle/packages/suite-web/build/* ./bundle/wallet
# rm ./bundle/suite-web.zip

# wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/${RELEASE_BRANCH}/download?job=landing-page%20deploy%20staging" -O ./bundle/landing-page.zip
# unzip ./bundle/landing-page.zip -d ./bundle/
# rsync -auv ./bundle/packages/landing-page/build/* ./bundle/
# rm ./bundle/landing-page.zip

# download apps from ci
mkdir ./combined/static/desktop 
wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/${RELEASE_BRANCH}/download?job=suite-desktop%20build%20linux" -O ./bundle/desktop-linux.zip
unzip ./bundle/desktop-linux.zip -d ./bundle/static/desktop
rm ./bundle/desktop-linux.zip

wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/${RELEASE_BRANCH}/download?job=suite-desktop%20build%20windows" -O ./bundle/desktop-windows.zip
unzip ./bundle/desktop-windows.zip -d ./bundle/static/desktop
rm ./bundle/desktop-windows.zip

wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/${RELEASE_BRANCH}/download?job=suite-desktop%20build%20mac" -O ./bundle/desktop-mac.zip
unzip ./bundle/desktop-mac.zip -d ./bundle/static/desktop
rm ./bundle/desktop-mac.zip

ls -la bundle