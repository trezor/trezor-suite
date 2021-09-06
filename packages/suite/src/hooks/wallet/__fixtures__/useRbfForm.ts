export { DEFAULT_STORE } from './useSendForm';

// m/44'/0'/0' all-all-all
export const BTC_ACCOUNT = {
    status: 'loaded',
    account: {
        symbol: 'btc',
        networkType: 'bitcoin',
        path: "m/44'/0'/0'",
        descriptor:
            'xpub6BiVtCpG9fQPxnPmHXG8PhtzQdWC2Su4qWu6XW9tpWFYhxydCLJGrWBJZ5H6qTAHdPQ7pQhtpjiYZVZARo14qHiay2fvrX996oEP42u8wZy',
        deviceState: 'deviceState',
        key: 'xpub-btc-deviceState',
        addresses: {
            change: [
                {
                    path: "m/44'/0'/0'/1/0",
                    address: '1DyHzbQUoQEsLxJn6M7fMD8Xdt1XvNiwNE',
                    transfers: 1,
                },
                {
                    path: "m/44'/0'/0'/1/1",
                    address: '139SnSTcoTF7jpkqh4wZFc7y6fQ1SLj4oR',
                    transfers: 0,
                },
            ],
            used: [
                { path: "m/44'/0'/0'/0/0", address: '1JAd7XCBzGudGpJQSDSfpmJhiygtLQWaGL' },
                { path: "m/44'/0'/0'/0/1", address: '1GWFxtwWmNVqotUPXLcKVL2mUKpshuJYo' },
            ],
            unused: [
                { path: "m/44'/0'/0'/0/2", address: '1Eni8JFS4yA2wJkicc3yx3QzCNzopLybCM' },
                { path: "m/44'/0'/0'/0/3", address: '124dT55Jqpj9AKTyJnTX6G8RkUs7ReTzun' },
            ],
        },
        balance: '1',
        availableBalance: '1',
        formattedBalance: '0.00000001 BTC',
        utxo: [{ amount: '1', txid: 'dust-limit-utxo-should-never-be-used' }],
        history: {},
    },
    network: { networkType: 'bitcoin', symbol: 'btc', decimals: 8, features: ['rbf'] },
};

// {
//     address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
//     // amount: '20000',
//     // script_type: 'PAYTOADDRESS',
// },
// {
//     address_n: [2147483692, 2147483648, 2147483648, 1, 0],
//     // amount: '10083',
//     // script_type: 'PAYTOADDRESS',
// },

const PREPARE_TX = (params = {}) => ({
    symbol: 'btc',
    rbfParams: {
        txid: 'ABCD',
        utxo: [
            {
                amount: '31000',
                txid: 'DCBA',
                vout: 0,
                address: 'address',
                path: "m/44'/0'/0'/0/0",
                blockHeight: 0,
                confirmations: 0,
                required: true,
            },
        ],
        outputs: [
            {
                type: 'change',
                address: '1DyHzbQUoQEsLxJn6M7fMD8Xdt1XvNiwNE',
                amount: '10771',
                formattedAmount: '0.00010771',
            },
            {
                type: 'payment',
                address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                amount: '20000',
                formattedAmount: '0.0002',
            },
        ],
        changeAddress: {
            path: "m/44'/0'/0'/1/0",
            address: '1DyHzbQUoQEsLxJn6M7fMD8Xdt1XvNiwNE',
            transfers: 1,
        },
        feeRate: 1,
        baseFee: 1,
        ...params,
    },
});

export const composeAndSign = [
    {
        description:
            'change-output reduced by fee. outputs order not affected. change was at the end of original tx.',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
            },
        },
        tx: PREPARE_TX({
            outputs: [
                {
                    type: 'payment',
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '20000',
                    formattedAmount: '0.0002',
                },
                {
                    type: 'change',
                    address: '1DyHzbQUoQEsLxJn6M7fMD8Xdt1XvNiwNE',
                    amount: '10771',
                    formattedAmount: '0.00010771',
                },
            ],
        }),
        composedLevels: {
            normal: {
                type: 'final',
                transaction: {
                    outputs: [
                        {
                            address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                        },
                        {
                            address_n: [2147483692, 2147483648, 2147483648, 1, 0],
                        },
                    ],
                },
            },
        },
        signedTx: {
            outputs: [
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '20000',
                    orig_index: 0,
                    orig_hash: 'ABCD',
                },
                {
                    address_n: [2147483692, 2147483648, 2147483648, 1, 0],
                    amount: '10083',
                    orig_index: 1,
                    orig_hash: 'ABCD',
                },
            ],
        },
    },
    {
        description:
            'change-output reduced by fee. outputs needs reordering. change was moved by compose process.',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
            },
        },
        tx: PREPARE_TX(),
        composedLevels: {
            normal: {
                type: 'final',
                transaction: {
                    outputs: [
                        {
                            address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                        },
                        {
                            // change-output is placed at the end
                            address_n: [2147483692, 2147483648, 2147483648, 1, 0],
                        },
                    ],
                },
            },
        },
        signedTx: {
            outputs: [
                {
                    // change-output is restored
                    address_n: [2147483692, 2147483648, 2147483648, 1, 0],
                    amount: '10083',
                    orig_index: 0,
                    orig_hash: 'ABCD',
                },
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '20000',
                    orig_index: 1,
                    orig_hash: 'ABCD',
                },
            ],
        },
    },
    {
        description: 'change-output is given as fee. output is removed.',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
            },
        },
        tx: PREPARE_TX({
            outputs: [
                {
                    type: 'change',
                    address: '1DyHzbQUoQEsLxJn6M7fMD8Xdt1XvNiwNE',
                    amount: '900',
                    formattedAmount: '0.00009',
                },
                {
                    type: 'payment',
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '30000',
                    formattedAmount: '0.0003',
                },
            ],
        }),
        composedLevels: {
            normal: {
                fee: '1000',
                transaction: {
                    outputs: [
                        // change-output is gone
                        {
                            address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                        },
                    ],
                },
            },
        },
        signedTx: {
            outputs: [
                // change-output is gone
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '30000',
                    orig_index: 1,
                    orig_hash: 'ABCD',
                },
            ],
        },
    },
    {
        description: 'change-output given as fee and fee level is switched to custom',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
            },
        },
        tx: PREPARE_TX({
            outputs: [
                {
                    type: 'change',
                    address: '1DyHzbQUoQEsLxJn6M7fMD8Xdt1XvNiwNE',
                    amount: '500',
                    formattedAmount: '0.000005',
                },
                {
                    type: 'payment',
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '30400',
                    formattedAmount: '0.000304',
                },
            ],
        }),
        composedLevels: {
            normal: {
                error: 'NOT-ENOUGH-FUNDS',
            },
            custom: {
                type: 'final',
                fee: '600',
                feePerByte: '3',
                transaction: {
                    outputs: [
                        // change-output is gone
                        {
                            address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                            amount: '30400',
                        },
                    ],
                },
            },
        },
        signedTx: {
            outputs: [
                // change-output is gone
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '30400',
                    orig_index: 1,
                    orig_hash: 'ABCD',
                },
            ],
        },
    },
    {
        description: 'new utxo is used and new change-output is added',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
                account: {
                    ...BTC_ACCOUNT.account,
                    utxo: [
                        {
                            amount: '10000',
                            txid: 'abcddcba',
                            vout: 0,
                            address: 'address',
                            path: "m/44'/0'/0'/0/1",
                            blockHeight: 100,
                            confirmations: 200,
                        },
                    ],
                },
            },
            fees: {
                btc: {
                    minFee: 1,
                    maxFee: 100,
                    blockHeight: 1,
                    blockTime: 1,
                    levels: [{ label: 'normal', feePerUnit: '10', blocks: 1 }],
                },
            },
        },
        tx: PREPARE_TX({
            outputs: [
                {
                    type: 'payment',
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '31000',
                    formattedAmount: '0.00031',
                },
            ],
            changeAddress: undefined,
        }),
        composedLevels: {
            normal: {
                type: 'final',
                fee: '3791',
                transaction: {
                    inputs: [{ prev_hash: 'dcba' }, { prev_hash: 'abcddcba' }],
                    outputs: [
                        {
                            address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                            amount: '31000',
                        },
                        // change-output is added, note that this is first unused address (not first on the list)
                        {
                            address_n: [2147483692, 2147483648, 2147483648, 1, 1],
                            amount: '6209',
                        },
                    ],
                },
            },
        },
        signedTx: {
            outputs: [
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '31000',
                    orig_index: 0,
                    orig_hash: 'ABCD',
                },
                {
                    amount: '6209',
                },
            ],
        },
    },
    {
        description: 'whole new utxo is consumed and switched to custom fee level',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
                account: {
                    ...BTC_ACCOUNT.account,
                    utxo: [
                        {
                            amount: '1000',
                            txid: 'abcddcba',
                            vout: 0,
                            address: 'address',
                            path: "m/44'/0'/0'/0/1",
                            blockHeight: 100,
                            confirmations: 200,
                        },
                    ],
                },
            },
            fees: {
                btc: {
                    minFee: 1,
                    maxFee: 100,
                    blockHeight: 1,
                    blockTime: 1,
                    levels: [{ label: 'normal', feePerUnit: '10', blocks: 1 }],
                },
            },
        },
        tx: PREPARE_TX({
            outputs: [
                {
                    type: 'payment',
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '31000',
                    formattedAmount: '0.00031',
                },
            ],
            changeAddress: undefined,
        }),
        composedLevels: {
            custom: {
                type: 'final',
                fee: '1000',
                feePerByte: '2',
                transaction: {
                    inputs: [{ prev_hash: 'dcba' }, { prev_hash: 'abcddcba' }],
                    outputs: [
                        {
                            address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                            amount: '31000',
                        },
                    ],
                },
            },
        },
        signedTx: {
            inputs: [{ prev_hash: 'dcba' }, { prev_hash: 'abcddcba' }],
            outputs: [
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '31000',
                    orig_index: 0,
                    orig_hash: 'ABCD',
                },
            ],
        },
    },
    {
        description: 'new utxo + change-output is enough to cover the lowest fee.',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
                account: {
                    ...BTC_ACCOUNT.account,
                    utxo: [
                        {
                            amount: '1000',
                            txid: 'abcddcba',
                            vout: 0,
                            address: 'address',
                            path: "m/44'/0'/0'/0/1",
                            blockHeight: 100,
                            confirmations: 200,
                        },
                    ],
                },
            },
            fees: {
                btc: {
                    minFee: 4, // this is essential for this test
                    maxFee: 100,
                    blockHeight: 1,
                    blockTime: 1,
                    levels: [{ label: 'normal', feePerUnit: '10', blocks: 1 }],
                },
            },
        },
        tx: PREPARE_TX({
            outputs: [
                {
                    type: 'change',
                    address: '1DyHzbQUoQEsLxJn6M7fMD8Xdt1XvNiwNE',
                    amount: '700',
                    formattedAmount: '0.00009',
                },
                {
                    type: 'payment',
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '30200',
                    formattedAmount: '0.000302',
                },
            ],
        }),
        composedLevels: {
            custom: {
                type: 'final',
                fee: '1800', // new utxo + old change-output + old fee (100)
                feePerByte: '5',
                transaction: {
                    inputs: [{ prev_hash: 'dcba' }, { prev_hash: 'abcddcba' }], // new utxo added
                    outputs: [
                        // change output was removed
                        {
                            address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                            amount: '30200',
                        },
                    ],
                },
            },
        },
        signedTx: {
            inputs: [{ prev_hash: 'dcba' }, { prev_hash: 'abcddcba' }],
            outputs: [
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '30200',
                    orig_index: 1, // orig index restored
                    orig_hash: 'ABCD',
                },
            ],
        },
    },
    {
        description:
            'new utxo is not enough to cover even the lowest fee. decreasing output instead.',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
                account: {
                    ...BTC_ACCOUNT.account,
                    utxo: [
                        {
                            amount: '500',
                            txid: 'abcddcba',
                            vout: 0,
                            address: 'address',
                            path: "m/44'/0'/0'/0/1",
                            blockHeight: 100,
                            confirmations: 200,
                        },
                    ],
                },
            },
            fees: {
                btc: {
                    minFee: 1,
                    maxFee: 100,
                    blockHeight: 1,
                    blockTime: 1,
                    levels: [{ label: 'normal', feePerUnit: '10', blocks: 1 }],
                },
            },
        },
        tx: PREPARE_TX({
            outputs: [
                {
                    type: 'payment',
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '31000',
                    formattedAmount: '0.00031',
                },
            ],
            changeAddress: undefined,
        }),
        composedLevels: {
            normal: {
                type: 'final',
                fee: '1951',
                transaction: {
                    inputs: [{ prev_hash: 'dcba' }],
                    outputs: [
                        {
                            address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                            amount: '29049',
                        },
                    ],
                },
            },
        },
        signedTx: {
            inputs: [{ prev_hash: 'dcba' }],
            outputs: [
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '29049',
                    orig_index: 0,
                    orig_hash: 'ABCD',
                },
            ],
        },
    },
    {
        description: 'new utxo txid is the same as rbf txid. decreasing output instead.',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
                account: {
                    ...BTC_ACCOUNT.account,
                    utxo: [
                        {
                            amount: '31000',
                            txid: 'ABCD', // tx id is the same
                            vout: 0,
                            address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                            path: "m/44'/0'/0'/0/1",
                            blockHeight: 0,
                            confirmations: 0,
                        },
                    ],
                },
            },
        },
        tx: PREPARE_TX({
            outputs: [
                {
                    type: 'payment',
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '31000',
                    formattedAmount: '0.00031',
                },
            ],
            changeAddress: undefined,
        }),
        composedLevels: {
            normal: {
                type: 'final',
                fee: '781',
                transaction: {
                    inputs: [{ prev_hash: 'dcba' }],
                    outputs: [
                        {
                            address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                            amount: '30219',
                        },
                    ],
                },
            },
        },
        signedTx: {
            inputs: [{ prev_hash: 'dcba' }],
            outputs: [
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '30219',
                    orig_index: 0,
                    orig_hash: 'ABCD',
                },
            ],
        },
    },
    {
        description: 'output decreased. there is not change or new utxo.',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
            },
        },
        tx: PREPARE_TX({
            outputs: [
                {
                    type: 'payment',
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '31000',
                    formattedAmount: '0.00031',
                },
            ],
            changeAddress: undefined,
        }),
        composedLevels: {
            normal: {
                type: 'final',
                fee: '781',
                transaction: {
                    outputs: [
                        {
                            address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                            amount: '30219',
                        },
                    ],
                },
            },
        },
        signedTx: {
            inputs: [{ prev_hash: 'dcba' }],
            outputs: [
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '30219',
                    orig_index: 0,
                    orig_hash: 'ABCD',
                },
            ],
        },
    },
    {
        description: 'with mixed outputs (opreturn, payment, change)',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
            },
        },
        tx: PREPARE_TX({
            outputs: [
                {
                    type: 'change',
                    address: '1DyHzbQUoQEsLxJn6M7fMD8Xdt1XvNiwNE',
                    amount: '700',
                    formattedAmount: '0.000007',
                },
                {
                    type: 'opreturn',
                    dataHex: 'dead',
                    dataAscii: 'dead',
                },
                {
                    type: 'payment',
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '1000',
                    formattedAmount: '0.00001',
                },
            ],
        }),
        composedLevels: {
            normal: {
                type: 'final',
                fee: '969',
                transaction: {
                    // outputs indexes are totally mixed up
                    outputs: [
                        {
                            script_type: 'PAYTOOPRETURN',
                        },
                        {
                            amount: '1000', // external
                        },
                        {
                            amount: '29031', // change
                        },
                    ],
                },
            },
        },
        signedTx: {
            // outputs are restored
            outputs: [
                {
                    address_n: [2147483692, 2147483648, 2147483648, 1, 0],
                    amount: '29031',
                    orig_index: 0,
                    orig_hash: 'ABCD',
                },
                {
                    script_type: 'PAYTOOPRETURN',
                    amount: '0',
                    orig_index: 1,
                    orig_hash: 'ABCD',
                },
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '1000',
                    orig_index: 2,
                    orig_hash: 'ABCD',
                },
            ],
        },
    },
    {
        description: 'used utxo is to low to do anything with it.',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
            },
        },
        tx: PREPARE_TX({
            utxo: [
                {
                    amount: '800',
                    txid: 'DCBA',
                    vout: 0,
                    address: 'address',
                    path: "m/44'/0'/0'/0/0",
                    blockHeight: 0,
                    confirmations: 0,
                    required: true,
                },
            ],
            outputs: [
                {
                    type: 'payment',
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '500',
                    formattedAmount: '0.000005',
                },
            ],
            changeAddress: undefined,
        }),
        composedLevels: {
            normal: {
                type: 'error',
                error: 'NOT-ENOUGH-FUNDS',
            },
        },
        // tx is not signed
    },
];

// TODO: two change outputs in orig tx (edge-case)
// TODO: rbf not supported (no orig_index field in outputs)
// TODO: multiple inputs (select one for decrease)
// TODO: custom fee + set-max (decrease)
// TODO: mad clicking (composeDebounce)
// TODO: finalize (check constants)
// TODO: with locktime
// TODO: ethereum cases
// TODO: with chained txs
