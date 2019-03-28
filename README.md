![Alt text](trezor-rocks.png?raw=true "Trezor Wallet rocks")

# Trezor Wallet

You can try this wallet live [HERE](https://beta-wallet.trezor.io/next/)

To install dependencies run `npm install` or `yarn`
To start locally run `npm run dev` or `yarn run dev`
To build the project run `npm run build` or `yarn run build`

## trezor-connect
If you are implementing a new feature from 'trezor-connect' which is not deployed on npm yet follow these steps:

1. Build trezor-connect npm module locally:
- go to trezor-connect project
- call `yarn build:npm`
- `cd npm`
2. Call `yarn link` to register this module
3. go to trezor-wallet project
4. Call `yarn link trezor-connect` to link registered module with trezor-wallet

Additionally you can publish trezor-connect to dev server (sisyfos.trezor.io/connect):
1. go to trezor-connect project
2. call `make build-test`


