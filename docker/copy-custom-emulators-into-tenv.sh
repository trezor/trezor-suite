#!/usr/bin/env bash

echo "Sleeping for 5 seconds for the container to fully initialize before transferring the emulator files"
sleep 5

T_ONE_EMU=""
T_T_EMU=""

# Arguments for T1 and TT emulator locations
while getopts :o:t: option
    do
        case $option in
            o) T_ONE_EMU=$OPTARG;;
            t) T_T_EMU=$OPTARG;;
        esac
    done


CONTAINER_ID=$(docker ps | grep 'trezor-user-env-unix' | awk {'print $1'})

if [[ ${T_ONE_EMU} != "" ]]
then
    docker cp ${T_ONE_EMU} ${CONTAINER_ID}:/trezor-user-env/src/binaries/firmware/bin/trezor-emu-legacy-v1-master
    echo "Copying ${T_ONE_EMU} into the container."
fi

if [[ ${T_T_EMU} != "" ]]
then
    docker cp ${T_T_EMU} ${CONTAINER_ID}:/trezor-user-env/src/binaries/firmware/bin/trezor-emu-core-v2-master
    echo "Copying ${T_T_EMU} into the container."
fi
