trezor-rollout
=========

Small javascript library to get latest safe firmware version for trezor update.

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
```npm install trezor-rollup --save```

or

#### Yarn
```yarn add trezor-rollup```


Usage
-----

```import { getLatestSafeFw, getScore } from 'trezor-rollup';```

Functions
-----
#### getScore():Number
- returns random number from 0 to 1 (0.21, 0.89, 0,45)

#### getLatestSafeFw(parameters):Array (single item from releases list) or null (no new version found)
- parameters: Object

```
{
  releaseList: Array (list from https://github.com/trezor/webwallet-data/blob/master/firmware/{1 or 2}/releases.json),
  isInBootloader: boolean,
  firmwareVersion: Array (for version 1.0.0 [1, 0, 0])
  bootloaderVersion: Array (for version 1.0.0 [1, 0, 0])
}
``` 

    
