FROM node:10.15.1

RUN apt-get update
RUN apt-get install -y build-essential
RUN apt-get install xvfb libgtk2.0-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 --assume-yes

WORKDIR /trezor-ui-components

COPY package.json /trezor-ui-components
COPY yarn.lock /trezor-ui-components

COPY . /trezor-ui-components