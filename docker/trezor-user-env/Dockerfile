FROM debian:10

RUN apt-get update && apt-get install -y \ 
    build-essential \
    # required by core/emulator
    scons \
    libsdl2-dev \
    libsdl2-image-dev \
    curl

RUN apt-get install -y \
    python3-dev \
    python3-pip \
    git-all

RUN pip3 install --upgrade setuptools
# RUN pip3 install trezor
RUN pip3 install "git+https://github.com/trezor/trezor-firmware#egg=trezor&subdirectory=python"
RUN pip3 install termcolor

# handle file permissions of generated files inside container
RUN curl -o /usr/local/bin/gosu -SL "https://github.com/tianon/gosu/releases/download/1.4/gosu-$(dpkg --print-architecture)" \
    && curl -o /usr/local/bin/gosu.asc -SL "https://github.com/tianon/gosu/releases/download/1.4/gosu-$(dpkg --print-architecture).asc" \
    && chmod +x /usr/local/bin/gosu

COPY ./suite/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

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
COPY ./trezor-user-env/controller /controller

RUN python3 --version
RUN python3 -m pip --version
RUN trezorctl version

WORKDIR /controller

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD [ "/bin/bash", "-c", "rm -rf /var/tmp/trezor.flash && trezorctl --version && python3 ./main.py" ]
