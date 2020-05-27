#!/bin/bash


rm -rf combined-build
mkdir combined-build
wget "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/develop/download?job=suite-desktop%20build%20linux" -O ./combined-build/desktop-linux.zip
unzip ./combined-build/desktop-linux.zip -d ./combined-build
rm ./combined-build/desktop-linux.zip


ls -la combined-build