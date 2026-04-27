# @trezor/connect-plugin-ethereum (deprecated)

[![NPM](https://img.shields.io/npm/v/@trezor/connect-plugin-ethereum.svg)](https://www.npmjs.org/package/@trezor/connect-plugin-ethereum)

> **Deprecated as of `@trezor/connect@10`.** Do not use in new code.

EIP-712 hash construction (`domain_separator_hash`, `message_hash`) for T1B1
firmware is now performed internally by `@trezor/connect`. Pass the EIP-712
`data` object directly to `TrezorConnect.ethereumSignTypedData` and the hashes
are computed automatically when the device requires them.

## Migration

Before (`@trezor/connect@9` + `@trezor/connect-plugin-ethereum@9.x` — historical, will not run against `@trezor/connect-plugin-ethereum@10` because the v10 release is a deprecation stub):

```ts
import TrezorConnect from '@trezor/connect';
import transformTypedData from '@trezor/connect-plugin-ethereum';

const { domain_separator_hash, message_hash } = transformTypedData(eip712Data, true);

await TrezorConnect.ethereumSignTypedData({
    path: "m/44'/60'/0'/0/0",
    data: eip712Data,
    metamask_v4_compat: true,
    domain_separator_hash,
    message_hash,
});
```

After (`@trezor/connect@10`):

```ts
import TrezorConnect from '@trezor/connect';

await TrezorConnect.ethereumSignTypedData({
    path: "m/44'/60'/0'/0/0",
    data: eip712Data,
    metamask_v4_compat: true,
});
```

Steps:

1. Upgrade `@trezor/connect` to 10.x.
2. Stop calling `transformTypedData`.
3. Stop passing `domain_separator_hash` / `message_hash`.
4. Remove `@trezor/connect-plugin-ethereum` from your `dependencies`.

## Background

This package was originally split out of `@trezor/connect` because
`@metamask/eth-sig-util` was a heavy dependency that non-Ethereum consumers
should not have paid for. Connect 10 introduces per-coin lazy loading, so the
hashing logic now lives inside the lazy-loaded ethereum chunk and only affects
consumers that actually use Ethereum methods. The implementation also moved
from `@metamask/eth-sig-util` to `viem` (`hashDomain` / `hashStruct`), which
produces byte-identical output and is safer in non-Node environments.

See [PR #27091](https://github.com/trezor/trezor-suite/pull/27091) for details.
