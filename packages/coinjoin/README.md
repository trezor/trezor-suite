# @trezor/coinjoin

Coinjoin client library.

## CoinjoinClient class

Usage:

```
const client = new CoinjoinClient(settings);
const status = await client.enable();
```

Once enabled it periodically syncs with coordinator `/status` using random proxy (TOR) identities and time frequency until `client.disable();` is called.

Status changes are emitted as `status` event:

```
client.on('status', event => {});

{
    rounds: Round[]; // current list of rounds
    changed: Round[]: // list of changed rounds since recent update
    maxMingFee: number // max mining fee resulting from recommended fee rate median
    coordinatorFeeRate: CoordinationFeeRate // current rate and plebsDontPayThreshold
    allowedInputAmounts: AllowedRange; // min and max allowed input value
}
```
