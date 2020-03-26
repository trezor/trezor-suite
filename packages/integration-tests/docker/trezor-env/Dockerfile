# buster is for debian 10. the same version as firmware team has in its Dockerfile.
FROM node:12-buster

RUN apt-get update && apt-get install -y \ 
    build-essential \
    # required by core/emulator
    scons \
    libsdl2-dev \
    libsdl2-image-dev \
    # why not
    zip \
    rsync

RUN apt-get install -y \
    python3-dev \
    python3-pip

RUN pip3 install --upgrade setuptools
RUN pip3 install trezor
RUN pip3 install termcolor

USER root

# "fake" dbus address to prevent errors
# https://github.com/SeleniumHQ/docker-selenium/issues/87
ENV DBUS_SESSION_BUS_ADDRESS=/dev/null

# good colors for most applications
ENV TERM xterm

# trezor emu
# ENV SDL_VIDEODRIVER "dummy"
ENV XDG_RUNTIME_DIR "/var/tmp"

# trezorctl https://click.palletsprojects.com/en/7.x/python3/
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8

COPY ./packages/integration-tests/bin/trezor-emu-core-v2.1.4 ./trezor-emu-core-v2.1.4

COPY ./packages/integration-tests/docker/trezor-env/python /python
COPY ./packages/integration-tests/bin /trezor-bin

RUN python3 --version
RUN python3 -m pip --version
RUN trezorctl version

# ENTRYPOINT ["./python/python3", "main.py"]