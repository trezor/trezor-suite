FROM node:10.15.1

WORKDIR /trezor-ui-components

COPY package.json /trezor-ui-components
COPY yarn.lock /trezor-ui-components

COPY . /trezor-ui-components