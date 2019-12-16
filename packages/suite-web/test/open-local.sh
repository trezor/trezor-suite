#!/bin/bash

# open (debug) e2e tests localy
# note that you need to start your own dev server

# on dev server, due to on-demand compilation nature of next.js, we need much longer timeout
export CYPRESS_defaultCommandTimeout=60000 

yarn concurrently --success first --kill-others  "python3 ./test/plugins/python/main.py" "wait-on --timeout 10000 http://localhost:8001 && cypress open --config baseUrl=http://localhost:8001 --browser chrome"