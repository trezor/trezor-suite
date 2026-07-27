# @trezor/connect-plugin-stellar (deprecated)

[![NPM](https://img.shields.io/npm/v/@trezor/connect-plugin-stellar.svg)](https://www.npmjs.org/package/@trezor/connect-plugin-stellar)

> **Deprecated as of `@trezor/connect@10`.** Do not use in new code.

`TrezorConnect.stellarSignTransaction` method now supports XDR base64 format, so utility function
`transformTransaction` is not needed anymore.

## Migration

Before:

```ts
import { Networks, Transaction } from '@stellar/stellar-sdk';
import { transformTransaction } from '@trezor/connect-plugin-stellar';

const tx = new Transaction(..., Networks.TESTNET);
const { path, transaction, networkPassphrase } = transformTransaction(path, tx);

await TrezorConnect.stellarSignTransaction({
    device,
    path,
    transaction,
    networkPassphrase,
});
```

After:

```ts
import { Transaction } from '@stellar/stellar-sdk';

const tx = new Transaction(..., Networks.TESTNET);

await TrezorConnect.stellarSignTransaction({
    device,
    path,
    xdrBase64: tx.toXDR(),
    testnet: true,
});
```
