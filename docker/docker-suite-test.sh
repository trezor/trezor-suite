#!/usr/bin/env bash
# Usage for custom emulators: docker/docker-suite-test.sh -o /tmp/1-custom -t /tmp/2-custom
# -o being for T-One location and -t for T-T location, both arguments being optional

DIR=$(dirname "$0")

set -e

# todo: resolve selective xhost permissions
# todo: resolve generated files permissions

xhost +
export LOCAL_USER_ID=`id -u $USER`

# When supplied with custom emulator(s), copying them into tenv container
# Forwarding all script arguments (-o and -t) into the script and running it on
#   the background to be able to wait until the container is running
if [[ $# -ne 0 ]]
then
    echo "Copying custom emulators into the tenv container"
    ${DIR}/copy-custom-emulators-into-tenv.sh $@ &
fi

docker-compose -f ./docker/docker-compose.suite-test.yml up --build --abort-on-container-exit
