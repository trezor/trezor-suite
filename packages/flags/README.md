trezor-flags
=========

[![codecov](https://codecov.io/gh/mroz22/trezor-flags/branch/master/graph/badge.svg)](https://codecov.io/gh/mroz22/trezor-flags)

This library provides interface for working with flags stored in trezor devices. 

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
```npm install trezor-flags --save```

or

#### Yarn
```yarn add trezor-flags```

Usage
-----

```import { Flags, TREZOR_FLAG_KEYS } from 'trezor-flags';```

Functions
-----

#### Flags.isFlagPresent(flag: string, trezorSavedFlags: number): boolean
- Flag variable represents one of possible flags defined in TREZOR_FLAG_KEYS array. TrezorSavedFlags is number (binary mask) which represents flags field from trezor features. 

#### Flags.setFlag(flag: string, trezorSavedFlags: number): number 
- Returns representation of new combinantions of flag that might be saved into device with applyFlags call
