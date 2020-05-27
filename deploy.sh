#!/bin/bash


rm -rf combined-build
mkdir combined-build

wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/deploy-experiments/download?job=suite-web%20deploy%20staging" -O ./combined-build/suite-web.zip
unzip ./combined-build/suite-web.zip -d ./combined-build/
mkdir ./combined-build/wallet
mv ./combined-build/packages/suite-web/build/* ./combined-build/wallet
rm ./combined-build/suite-web.zip

wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/deploy-experiments/download?job=landing-page%20deploy%20staging" -O ./combined-build/landing-page.zip
unzip ./combined-build/landing-page.zip -d ./combined-build/
rsync -auv ./combined-build/packages/landing-page/build/* ./combined-build/
rm ./combined-build/landing-page.zip

mkdir ./combined/static/desktop 

wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/develop/download?job=suite-desktop%20build%20linux" -O ./combined-build/desktop-linux.zip
unzip ./combined-build/desktop-linux.zip -d ./combined-build/static/desktop
rm ./combined-build/desktop-linux.zip

wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/develop/download?job=suite-desktop%20build%20windows" -O ./combined-build/desktop-windows.zip
unzip ./combined-build/desktop-windows.zip -d ./combined-build/static/desktop
rm ./combined-build/desktop-windows.zip

wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/develop/download?job=suite-desktop%20build%20mac" -O ./combined-build/desktop-mac.zip
unzip ./combined-build/desktop-mac.zip -d ./combined-build/static/desktop
rm ./combined-build/desktop-mac.zip

ls -la combined-build