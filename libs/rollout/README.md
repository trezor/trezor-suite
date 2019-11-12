trezor-rollout
=========

[![npm version](https://badge.fury.io/js/trezor-rollout.svg)](https://badge.fury.io/js/trezor-rollout)

Tldr: For historical reasons, Trezor devices firmware updates are not always straightforward. 

__Incremental update__: not every firmware update can be applied on any installed firmware. This currently applies only for T1 devices. Releases definitions (see below), contain `min_bootloader_version` and `min_firmware_version`. Depending on whether the device is in bootloader mode or not, respective field (`min_bootloader_version` or `min_firmware_version`) should be observed and next firmware to apply should be evaulated againts them. 

__Incremental downgrade__: it is not possible to downgrade to lower version of bootloader. __Rollout module does not solve this__. Problem is, device will not tell you bootloader version if it is not in bootloader mode. 

__Rollout update__: sometimes we might want to offer firmware only to small portion of users. This behaviour is defined by `rollout` field and handled by this lib.

__Firmware headers__: any firmware that is applied on firmware with bootloader  >= 1.8.0 has old firmware header of 256 bytes, that should be removed before installing. This should be only temporary state and will be solved in future by introducing special intermediate firmwares for updating.


Commands
-

#### Build 
to build a bundle run `yarn build`

#### Tests
run tests using `yarn test` or `yarn run test:watch` for watch mode

#### eslint
`yarn run lint`

Installation
-----

#### Npm 
```npm install trezor-rollout --save```

or

#### Yarn
```yarn add trezor-rollout```

Usage
-----

```import Rollout from 'trezor-rollout';```

Functions
-----

#### Rollout(options)
- options 
```
{
  baseUrl: 'https://wallet.trezor.io',
  releasesListsPaths: {
    1: 'data/firmware/1/releases.json',
    2: 'data/firmware/2/releases.json',
  }
}
```
-  [t1 list](https://github.com/trezor/webwallet-data/blob/master/firmware/1/releases.json), [t2 list](https://github.com/trezor/webwallet-data/blob/master/firmware/2/releases.json)
- returns rollout object that exposes following functions:

#### getScore()
- returns random number from 0 to 1 (0.21, 0.89, 0,45)
- You may use this method to implement "rolling update". You probably want to save result of this function client side (local storage) under a key defined by concrete firmware. Items in releases list might have rollout field (number 0-1) that should be evaluated against getScore() result.

#### getInfo(features, score)
- features: Features object provided by Connect
```
{
  major_version: 1,
  minor_version: 8,
  patch_version: 0,
  bootloader_mode: false,
  firmware_present: true,
  ...
}
```
- score: Number (result of getScore()). This is to used to decide whether items with `rollout` defined are to be offered. Update is offered in case `score` provided is lower than `rollout`.

- returns UpdateInfo item
```
{
    firmware: Object,               // single object from releaseList,
    isLatest: boolean || null,      // is returned firwmare the latest one? null means we cant tell
    isRequired: boolean,            // true if any of unistalled firmwares are required
    isNewer: boolean || null,       // is returned firmware newer then actual? null means we cant tell
}
```
#### getFw(features, score)
- returns array buffer with firmware that is safe to upload to device.
