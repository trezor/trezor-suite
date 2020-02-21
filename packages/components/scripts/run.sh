#!/bin/bash  

cd "$(dirname "$0")"
cd ..

docker build -f Dockerfile -t trezor-ui-components-v2 .
docker run -d -p 9001:9001 trezor-ui-components-v2