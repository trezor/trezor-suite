#!/bin/sh

# todo: experiments

xhost +
export LOCAL_USER_ID=`id -u $USER`

docker run -v ~/repos/trezor-suite:/app -it selenium/standalone-chrome /bin/bash 
