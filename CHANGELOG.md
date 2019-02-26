## 1.1.0-beta
__added__
- Ripple support
- responsive sidebar
- QR code scanner in send form
- clear send form button
- backup notification modal

__updated__
- connect v7
- babel v7
- ethereum tokens list
- most of dependencies

__changed__
- icons for T1 and TT
- device header styles
- input styles
- sign and verify title

__fixed__
- beta disclaimer wrapper position
- sidebar scrollbar

## 1.0.3-beta
__added__
- Ethereum: sign & verify tab
- Stellar and Cardano external wallets
- UI: modal background fade in/ fade out
- UI: fonts refactoring
- Experimental Ripple support (disabled by default)

__changed__
- Split code to coin specific types for components, actions and reducers (ripple/ethereum/...)
- Update 
- Use TrezorConnect to communicate with trezor-blockchain-link

__fixed__
- validation of token existence in send tx draft (https://github.com/trezor/trezor-wallet/pull/252)

## 1.0.2-beta
__changed__
- Fiat rates from coingecko (https://github.com/trezor/trezor-wallet/pull/242)
- firmware update link to beta-wallet (https://github.com/trezor/trezor-wallet/commit/b9b7d2d076f2d4c59ae2e055dc140cda6aaa5512)
- update list of ETH and ETC tokens

__added__
- set default gas limit button (https://github.com/trezor/trezor-wallet/issues/184)
- added 1 click to select value in input (https://github.com/trezor/trezor-wallet/issues/251)
- added account loader (https://github.com/trezor/trezor-wallet/pull/225)
- added message how to add ERC20 tokens (https://github.com/trezor/trezor-wallet/issues/238)

__fixed__
- validation of token existence in send tx draft (https://github.com/trezor/trezor-wallet/pull/252)


## 1.0.1-beta
__added__
- DigiByte in coin menu
- blocking device with seedless setup

__fixed__
- token input in "Account/Summary" (https://github.com/trezor/trezor-wallet/issues/235)
- "Go to your standard wallet" button in passphrase modal (https://github.com/trezor/trezor-wallet/issues/222)
- Double click on "show passphrase" (https://github.com/trezor/trezor-wallet/issues/221)
- images preloader for offline status (https://github.com/trezor/trezor-wallet/issues/218)


## 1.0.0-beta
- first release