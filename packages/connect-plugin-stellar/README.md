# @trezor/connect-plugin-stellar (deprecated)

[![NPM](https://img.shields.io/npm/v/@trezor/connect-plugin-stellar.svg)](https://www.npmjs.org/package/@trezor/connect-plugin-stellar)

> **Deprecated as of `@trezor/connect@10`.** Do not use in new code.

The Stellar transaction transformation (turning a `@stellar/stellar-sdk`
`Transaction` into the protobuf-aligned shape Trezor firmware expects) is now
performed internally by `@trezor/connect`. Pass the stellar-sdk `Transaction`
directly to `TrezorConnect.stellarSignTransaction` along with `path` and
`networkPassphrase`; connect normalizes it for you.

## Migration

Before (`@trezor/connect@9` + `@trezor/connect-plugin-stellar@9.x` — historical, will not run against `@trezor/connect-plugin-stellar@10` because the v10 release is a deprecation stub):

```ts
import TrezorConnect from '@trezor/connect';
import { transformTransaction } from '@trezor/connect-plugin-stellar';

const transformed = transformTransaction(path, stellarSdkTransaction);

await TrezorConnect.stellarSignTransaction(transformed);
```

After (`@trezor/connect@10`):

```ts
import TrezorConnect from '@trezor/connect';

await TrezorConnect.stellarSignTransaction({
    path,
    networkPassphrase: stellarSdkTransaction.networkPassphrase,
    transaction: stellarSdkTransaction,
});
```

Steps:

1. Upgrade `@trezor/connect` to 10.x.
2. Stop calling `transformTransaction`.
3. Pass the stellar-sdk `Transaction` directly as `transaction`.
4. Remove `@trezor/connect-plugin-stellar` from your `dependencies`.

## Background

This package was originally split out so non-Stellar consumers wouldn't pay the
`@stellar/stellar-sdk` bundle cost. Connect 10 introduces per-coin lazy loading,
so the transformation now lives inside the lazy-loaded stellar chunk and only
affects consumers that actually use Stellar methods. With that, the plugin's
remaining purpose was "be a separate npm package," which is pure overhead.
