FROM python:latest

#
# setup
#
RUN apt-get update
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y chromium libappindicator3-1 xdg-utils fonts-liberation nodejs wget dpkg git python python3 python3-pip xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2
RUN npm install -g yarn

RUN ln -s /usr/bin/chromium /usr/local/bin/chromium-browser

#
# build emulator
#
RUN mkdir /trezor-emulator
WORKDIR /trezor-emulator

RUN git clone https://github.com/trezor/trezor-core
WORKDIR /trezor-emulator/trezor-core
RUN git submodule update --init --recursive

RUN apt-get install libusb-1.0-0
RUN pip3 install scons trezor
RUN make build_unix_noui

#
# install bridge
#
RUN mkdir /trezor-bridge
WORKDIR /trezor-bridge
RUN wget https://wallet.trezor.io/data/bridge/2.0.25/trezor-bridge_2.0.25_amd64.deb
RUN dpkg -x /trezor-bridge/trezor-bridge_2.0.25_amd64.deb /trezor-bridge/extracted

#
# install trezor-wallet
#
RUN mkdir /trezor-wallet
WORKDIR /trezor-wallet
COPY package.json /trezor-wallet
COPY yarn.lock /trezor-wallet
RUN yarn
COPY . /trezor-wallet
RUN yarn run build:stable

#
# run
#
ENTRYPOINT ["/trezor-wallet/test/scripts/run-all.sh"]
EXPOSE 8080 21325