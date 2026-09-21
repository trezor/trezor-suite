# coin-selection

Minimal implementation of Cardano coin selection algorithms (see [CIP-2](https://cips.cardano.org/cips/cip2/)) developed solely for Trezor Suite.
Under the hood it leverages Cardano Serialization Lib via WASM module.

## Features

- Final tx plan: Compose transaction plan for given inputs (shelley utxos only), certificates (support for stake (de)registration and delegation), withdrawals,...
- Draft tx plan: Return basic information about potential transaction (such as a size and fee) even for incomplete inputs (without an recipient address or an amount)
- Set max: Calculate the max amount of an asset that is possible to include in a transaction output

## Usage

```typescript
const txPlan = coinSelection(
	txParams: {
        utxos: Utxo[];
        outputs: UserOutput[];
        changeAddress: string;
        certificates: Certificate[];
        withdrawals: Withdrawal[];
        accountPubKey: string;
        ttl?: number;
    },
	options: {
        feeParams?: { a: string };
        debug?: boolean;
        forceLargestFirstSelection?: boolean;
	}
);
```

### `coinSelection(txParams, options)`

#### `txParams`

- `utxos`: Array of account's utxo
- `outputs`: Requested outputs provided by an user
- `changeAddress`: An address where the change will be sent
- `certificates`: Stake registration and/or delegation certificates (stake pool registration is not supported)
- `withdrawals`: Withdrawal requests
- `accountPubKey`: Account public key
- `ttl`: Time-to-live for the transaction

#### `Options`

- `forceLargestFirstSelection`: Always use largest-first algorithm
- `debug`: print debug information about coin-selection (selected utxos, outputs including change output,...)

## Example

### Final tx plan

```typescript

export const utxo1 = {
  address:
    'addr1q860vxljhadqxnrrsr2j6yxnwpdkyquq74lmghx502aj0r28d2kd47hsre5v9urjyu8s0ryk38dxzw0t5jesncw4v90sp0878u',
  txHash: '3c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d',
  outputIndex: 0,
  amount: [
    {
      quantity: '5000000',
      unit: 'lovelace',
    },
  ],
};

export const utxo2 = {
  address:
    'addr1q860vxljhadqxnrrsr2j6yxnwpdkyquq74lmghx502aj0r28d2kd47hsre5v9urjyu8s0ryk38dxzw0t5jesncw4v90sp0878u',
  txHash: '9e63fddf20cb7b5472e2c9a1bb4bbe3112b8f2b22e45bc441206bcddde5c58a0',
  outputIndex: 1,
  amount: [
    {
      quantity: '5000000',
      unit: 'lovelace',
    },
    {
      quantity: '1000',
      unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
    },
  ],
};

const txPlan = coinSelection(
	txParams: {
        utxos: Utxo[];
        outputs: [
        {
            address:
            'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
            amount: '1000000',
            assets: [],
            setMax: false,
        },
        {
            address:
            'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
            amount: undefined,
            assets: [],
            setMax: true,
        },
        ],
        changeAddress: `addr1q8u2f05rprqjhygz22m06mhy4xrnqvqqpyuzhmxqfxnwvxz8d2kd47hsre5v9urjyu8s0ryk38dxzw0t5jesncw4v90s22tk0f`,
        certificates: [],
        withdrawals: [],
        accountPubKey:
        'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
    },
);

// txPlan
// {
//   max: '7480901',
//   totalSpent: '8655202',
//   fee: '174301',
//   inputs: [utxo1, utxo2],
//   outputs: [
//     {
//       address:
//         'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
//       amount: '1000000',
//       assets: [],
//       setMax: false,
//     },
//     {
//       address:
//         'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
//       amount: '7480901',
//       assets: [],
//       setMax: true,
//     },
//     {
//       isChange: true,
//       address: changeAddress,
//       amount: '1344798',
//       assets: [
//         {
//           quantity: '1000',
//           unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
//         },
//       ],
//     },
//   ],
// },
;
```

### Draft tx plan

```typescript

const txPlan = coinSelection(
	{
        utxos: [utxo1];
        outputs: [
            {
                address: undefined, // address not filled
                amount: '2000000',
                assets: [],
                setMax: false,
            },
        ],
        changeAddress: `addr1q8u2f05rprqjhygz22m06mhy4xrnqvqqpyuzhmxqfxnwvxz8d2kd47hsre5v9urjyu8s0ryk38dxzw0t5jesncw4v90s22tk0f`,
        certificates: [],
        withdrawals: [],
        accountPubKey:
        'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
    },
);

// txPlan:
// {
//     totalSpent: '2168053',
//     fee: '168053',
// },

```

## Notes

- If there are certificates present or the transaction includes an output with `setMax: true` then largest-first algorithm will be used instead of random-improve.
