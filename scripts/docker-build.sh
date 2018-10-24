#!/bin/bash

cd "$(dirname "$0")"

if [[ "$1" == "dev" || "$1" == 'beta' || "$1" == 'prod' ]]
    then
        docker stop trezor-wallet
        docker rm trezor-wallet
        docker build -t trezor-wallet ../ --build-arg BUILD_TYPE=$1
        docker run -p 8080:8080 -d --name trezor-wallet trezor-wallet:latest
        docker cp trezor-wallet:/trezor-wallet-app/build/$1 ../build/
        docker stop trezor-wallet
        docker rm trezor-wallet
    else
        echo "invalid parameters... valid parameters are (beta, dev, prod)"
fi