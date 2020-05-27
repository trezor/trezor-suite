#!/bin/bash


rm -rf combined-build
mkdir combined-build

wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/develop/download?job=suite-desktop%20build%20linux" -O ./combined-build/desktop-linux.zip
unzip ./combined-build/desktop-linux.zip -d ./combined-build
rm ./combined-build/desktop-linux.zip

wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/569079994/artifacts/download" -O ./combined-build/landing-page.zip
# wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/develop/download?job=landing-page%20deploy%20staging" -O ./combined-build/landing-page.zip
unzip ./combined-build/landing-page.zip -d ./combined-build
mv ./combined-build/packages/landing-page/build/* ./combined-build/

rm ./combined-build/landing-page.zip

wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/569079992/artifacts/download" -O ./combined-build/suite-web.zip
# wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/develop/download?job=landing-page%20deploy%20staging" -O ./combined-build/suite-web.zip
unzip ./combined-build/suite-web.zip -d ./combined-build
mv ./combined-build/packages/suite-web/build/* ./combined-build/
rm ./combined-build/suite-web.zip


ls -la combined-build