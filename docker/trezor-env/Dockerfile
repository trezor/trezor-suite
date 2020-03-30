# buster is for debian 10. the same version as firmware team has in its Dockerfile.
FROM debian:10

RUN apt-get update && apt-get install -y \ 
    build-essential \
    # required by core/emulator
    scons \
    libsdl2-dev \
    libsdl2-image-dev 

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
ENV XDG_RUNTIME_DIR "/var/tmp"

# trezorctl https://click.palletsprojects.com/en/7.x/python3/
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8

# copy python websocket server and all binaries
COPY ./trezor-env/controller /controller
# COPY ./trezor-env/controller/bin/. /
# COPY ./trezor-env/controller/bin/. /

RUN python3 --version
RUN python3 -m pip --version
RUN trezorctl version

WORKDIR /controller

# docker run -it --env="DISPLAY" --env="QT_X11_NO_MITSHM=1" --volume="/tmp/.X11-unix:/tmp/.X11-unix:rw" 12f69fb0d096 /bin/bash
