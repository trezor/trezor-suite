#!/bin/bash

# wipe emu. tests hang if it has pin set
rm -rf /var/tmp/trezor.flash

yarn concurrently \
    --success first \
    --kill-others \
    "python3 ../../docker/trezor-env/python/main.py" \
    "cypress run --browser $BROWSER --project ./projects/suite-web"
