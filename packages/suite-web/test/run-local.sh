#!/bin/bash

# run all e2e tests localy

# on dev server, due to on-demand compilation nature of next.js, we need much longer timeout
export CYPRESS_defaultCommandTimeout=60000

yarn concurrently --success first --kill-others "yarn dev" "python3 ./test/plugins/python/main.py" "wait-on --timeout 120000 http://localhost:8001 && cypress run --config baseUrl=http://localhost:8001 --browser chrome"