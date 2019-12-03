#!/bin/bash

# browser_opt=$1

yarn concurrently --success first --kill-others "python3 ./test/plugins/python/main.py" "cypress run --browser $BROWSER"