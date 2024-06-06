# Base
## Use a proxy or fallback to no proxy at all (direct access to Docker Hub).
ARG CI_DOCKER_PROXY=""
FROM ${CI_DOCKER_PROXY}debian:bullseye-slim as base

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    zip unzip \
    curl && \
    rm -rf /var/lib/apt/lists/* && \
    update-ca-certificates


# Docker
FROM base as docker
ENV DOCKER_VERSION=20.10.16
RUN curl -fsSLO https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_VERSION}.tgz \
    && mv docker-${DOCKER_VERSION}.tgz docker.tgz \
    && tar xzvf docker.tgz \
    && mv docker/docker /usr/local/bin \
    && rm -r docker docker.tgz

# Docker Compose
FROM base as docker_compose
ENV DOCKER_COMPOSE_VERSION=1.29.2
RUN curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose

# Final image
# bullseye is for debian 11. the same version as firmware team has in its Dockerfile.
FROM ${CI_DOCKER_PROXY}node:lts-bullseye

RUN apt-get update && apt-get install -y \
    build-essential \
    # required by cypress and node
    xvfb \
    libgtk2.0-0 \
    libnotify-dev \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    # required by core/emulator
    scons \
    libsdl2-dev \
    libsdl2-image-dev \
    # why not
    zip \
    jq \
    rsync \
    curl

RUN apt-get install -y \
    python3-dev \
    python3-pip

RUN pip3 install attrs
RUN pip3 install --upgrade setuptools
# trezor ctl is not working with newer version of click
RUN pip3 install "click<8.1"
RUN pip3 install trezor
RUN pip3 install termcolor

USER root

# install Chromebrowser
RUN \
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
    apt-get update && \
    apt-get install -y dbus-x11 google-chrome-stable google-chrome-beta && \
    rm -rf /var/lib/apt/lists/*

# "fake" dbus address to prevent errors
# https://github.com/SeleniumHQ/docker-selenium/issues/87
ENV DBUS_SESSION_BUS_ADDRESS=/dev/null

# a few environment variables to make NPM installs easier
# good colors for most applications
ENV TERM xterm
# avoid million NPM install messages
ENV npm_config_loglevel warn
# allow installing when the main user is root
ENV npm_config_unsafe_perm true

# trezor emu
ENV SDL_VIDEODRIVER "dummy"
ENV XDG_RUNTIME_DIR "/var/tmp"

# trezorctl https://click.palletsprojects.com/en/7.x/python3/
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8

# Install and use correct version of node - should match witch Nix and .nvmrc
ENV NODE_VERSION 20.12.2

# Out of the blue, we started to run into CI failures. All of them had one thing in common.
# Some of our dependencies postinstall scripts tried to execute a binary in ./node_modules/.bin/
# that was not available at the moment. This happens probably because of the async manner in which
# base packages are downloaded and installed in concurrence with the fact that the troublesome
# package relies on existence of another package already installed.
# as a quick fix, create a project and install needed packages to provide yarn cache on image level.
RUN yarn global add opencollective node-pre-gyp

# versions of local tools
RUN node -v
RUN npm -v
RUN yarn -v
RUN google-chrome --version
RUN google-chrome-beta --version
RUN zip --version
RUN git --version
RUN python3 --version
# RUN pipenv --version
RUN python3 -m pip --version
RUN trezorctl version

COPY --from=docker /usr/local/bin/docker /usr/local/bin
COPY --from=docker_compose /usr/local/bin/docker-compose /usr/local/bin
