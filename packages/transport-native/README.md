# @trezor/transport-native

Trezor Transport layer for low level communication with Trezor devices for React Native.

## Installation

```sh
yarn add @trezor/transport-native
```

## Usage

```js
import { enumerate } from '@trezor/transport-native';

// ...

const result = await enumerate();
console.log(result);
```
