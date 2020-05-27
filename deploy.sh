#!/bin/bash

rm -rf combined-build
mkdir combined-build
wget -P ./combined-build "https://gitlab.com/satoshilabs/trezor/trezor-suite/-/jobs/artifacts/develop/download?job=suite-desktop%20build%20linux"

ls -la combined-build