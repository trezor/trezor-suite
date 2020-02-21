#!/bin/bash  

cd "$(dirname "$0")"
cd ..

docker build -f Dockerfile -t trezor-ui-components .
docker run -d -p 9001:9001 trezor-ui-components