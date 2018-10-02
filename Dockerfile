FROM node:8

WORKDIR /trezor-wallet-app

COPY package.json /trezor-wallet-app
COPY yarn.lock /trezor-wallet-app

RUN yarn install

COPY . /trezor-wallet-app

RUN yarn run build:prod

EXPOSE 8080
CMD [ "yarn", "run", "prod-server" ]