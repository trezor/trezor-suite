FROM node:12-buster

RUN apt-get update && apt-get install -y \
    build-essential \
    check \
    clang-format \
    git \
    graphviz \
    libjpeg-dev \
    libsdl2-dev \
    libsdl2-image-dev \
    libsodium-dev \
    libssl-dev \
    libudev-dev \
    libusb-1.0-0-dev \
    valgrind \
    wget \
    zlib1g-dev

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

ENV TERM xterm

# trezor emu
# ENV SDL_VIDEODRIVER "dummy"
ENV XDG_RUNTIME_DIR "/var/tmp"

# trezorctl https://click.palletsprojects.com/en/7.x/python3/
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8

COPY ./bin /trezor

# and then run it with 
# docker run -it --env="DISPLAY" --env="QT_X11_NO_MITSHM=1" --volume="/tmp/.X11-unix:/tmp/.X11-unix:rw" 12f69fb0d096 /bin/bash

