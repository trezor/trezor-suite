#!/bin/bash

yarn concurrently --success first --kill-others "python3 ./projects/suite-web/plugins/python/main.py" "cypress run --browser $BROWSER --project ./projects/suite-web"
