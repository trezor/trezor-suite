trezor-rollout
=========

Tldr: For historical reasons, Trezor devices firmware updates are not always straightforward. 

__Incremental update__: not every firmware update can be applied on any installed firmware. This currently applies only for T1 devices. `min_bootloader_version` and `min_firmware_version` should be observed. 

__Incremental downgrade__: it is not possible to downgrade to lower version of bootloader.

__Rollout update__: sometimes we might want to offer firmware only to small portion of users. This behaviour is defined by `rollout` field and handled by this lib.


Commands
-----

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

```import { getLatestSafeFw, getScore } from 'trezor-rollout';```

Functions
-----

#### getScore()
- returns random number from 0 to 1 (0.21, 0.89, 0,45)
- You may use this method to implement "rolling update". You probably want to save result of this function client side (local storage) under a key defined by concrete firmware. Items in releases list might have rollout field (number 0-1) that should be evaluated against getScore() result.

#### getLatestSafeFw(options, score)
- options: Object

```
{
  releaseList: Array                        // (see below),
  isInBootloader: boolean,
  firmwareVersion: Array ([1, 0, 0])
  bootloaderVersion: Array ([1, 0, 0]),
  firmwarePresent: boolean
}
```

releaseList is either [t1 list](https://github.com/trezor/webwallet-data/blob/master/firmware/1/releases.json)
or [t2 list](https://github.com/trezor/webwallet-data/blob/master/firmware/2/releases.json)

`isInBootloader`, `firmwareVersion`, `bootloaderVersion` and `firmwarePresent` are supplied by trezor via getFeatures call.

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
