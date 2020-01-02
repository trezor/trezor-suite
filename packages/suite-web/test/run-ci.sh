#!/bin/bash

yarn concurrently --success first --kill-others "python3 ./test/plugins/python/main.py" "npx cypress run --browser $BROWSER"