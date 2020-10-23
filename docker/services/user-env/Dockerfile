FROM debian:10

ARG SUPPORTED_SHELLS

RUN apt-get update && apt-get install -y \ 
    build-essential \
    $SUPPORTED_SHELLS \
    # required by core/emulator
    scons \
    libsdl2-dev \
    libsdl2-image-dev \
    curl \
    openssh-server \
    python3-dev \
    python3-pip \
    git-all

RUN pip3 install --upgrade setuptools
RUN pip3 install "git+https://github.com/trezor/trezor-firmware#egg=trezor&subdirectory=python"
RUN pip3 install termcolor

# setup ssh access for root, used to tunnel bridge to test-runner
ARG ROOT_PASSWORD
RUN mkdir /var/run/sshd
RUN echo 'root:${ROOT_PASSWORD}' | chpasswd
RUN sed -i 's/#*PermitRootLogin prohibit-password/PermitRootLogin yes/g' /etc/ssh/sshd_config
RUN sed -i 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' /etc/pam.d/sshd

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
COPY ./user-env/controller /controller
WORKDIR /controller

# prepare web server root
COPY ./user-env/control-server /control-server

# prepare launch script
COPY ./user-env/launch.sh /launch.sh
RUN chmod +x /launch.sh

RUN python3 --version
RUN python3 -m pip --version
RUN trezorctl version
