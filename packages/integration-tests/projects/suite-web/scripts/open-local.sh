#!/bin/bash

# open (debug) e2e tests localy
# note that you need to start your own dev server

# on dev server, due to on-demand compilation nature of next.js, we need much longer timeout
export CYPRESS_defaultCommandTimeout=60000 

# wipe emu. tests hang if it has pin set
rm -rf /var/tmp/trezor.flash

yarn concurrently --success first --kill-others \
    "python3 ./projects/suite-web/plugins/python/main.py" \
    "wait-on --timeout 10000 http://localhost:3000 && cypress open \
    --config baseUrl=http://localhost:3000 --browser chrome \
    --project ./projects/suite-web"