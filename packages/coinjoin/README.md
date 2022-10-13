# @trezor/coinjoin

Coinjoin client library.

## CoinjoinClient class

Usage:

```
const client = new CoinjoinClient(settings);
const status = await client.enable();
```

Once enabled it periodically sync with coordinator `/status` using random proxy (TOR) identities and time frequency until `client.disable();` is called.

Status changes are emitted as `status` event:

```
client.on('status', event => {});

{
    rounds: Round[]; // current list of rounds
    changes: Round[]: // list of changed rounds since recent update
    feeRatesMedians: Array<{ timeFrame: string; medianFeeRate: number; }>, // timeFrame format: "0d 0h 0m 0s"
    coordinatorFeeRate: action.status.coordinatorFeeRate, // current coordinatorFeeRate
}
```
