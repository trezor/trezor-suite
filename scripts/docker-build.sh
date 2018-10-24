#!/bin/bash

cd "$(dirname "$0")"

if [[ "$1" == "dev" || "$1" == "beta" || "$1" == "stable" ]]
    then
        mkdir -p ../build
        rm -rf ../build/$1
        docker ps -q --filter "name=trezor-wallet" | grep -q . && docker stop trezor-wallet && docker rm -fv trezor-wallet
        docker build -t trezor-wallet ../ --build-arg BUILD_TYPE=$1
        docker run -p 8080:8080 -d --name trezor-wallet trezor-wallet:latest
        docker cp trezor-wallet:/trezor-wallet-app/build/$1 ../build/$1
        docker stop trezor-wallet
        docker rm trezor-wallet
        echo "DONE!"
        echo "Build directory: "$1
    else
        echo "invalid parameters... valid parameters are (dev, beta, stable)"
fi