export { getRootReducer } from './useSendForm';

const ABCD = 'abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd';
const DCBA = 'dcbadcbadcbadcbadcbadcbadcbadcbadcbadcbadcbadcbadcbadcbadcbadcba';
const DUST = 'dust-limit-utxo-should-never-be-used-aaaaaaaaaaaaaaaaaaaaaaaaaaa';

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
        utxo: [{ amount: '1', txid: DUST }],
        history: {},
    },
    network: { networkType: 'bitcoin', symbol: 'btc', decimals: 8, features: ['rbf'] },
};

const BTC_CJ_ACCOUNT = {
    ...BTC_ACCOUNT,
    account: {
        ...BTC_ACCOUNT.account,
        accountType: 'coinjoin',
        addresses: {
            ...BTC_ACCOUNT.account.addresses,
            anonymitySet: {
                '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY': 1,
            },
        },
    },
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
                txid: DCBA,
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
        feeRate: '3.79',
        baseFee: 175,
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
                fee: '1761',
                feePerByte: '7.79', // 3.79 (old) + 4 (new)
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
        composeTransactionCalls: 1,
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
                    amount: '9239',
                    orig_index: 1,
                    orig_hash: 'ABCD',
                },
            ],
        },
    },
    {
        description: 'change-output reduced by fee + baseFee of chainedTransactions',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
            },
        },
        chainedTxs: {
            own: [{ txid: 'aaaa', fee: '500' }],
            others: [
                { txid: 'bbbb', fee: '500' },
                { txid: 'cccc', fee: '5000' },
            ],
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
                fee: '7761', // 1761 + 6000 for chainedTxs
                feePerByte: '34.34', // 3.79 (old) + 4 (new) + 26.55 for chainedTxs
            },
        },
        composeTransactionCalls: 1,
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
                    amount: '3239',
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
                feePerByte: '7.79', // 3.79 (old) + 4 (new)
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
        composeTransactionCalls: 1,
        signedTx: {
            outputs: [
                {
                    // change-output is restored
                    address_n: [2147483692, 2147483648, 2147483648, 1, 0],
                    amount: '9239',
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
            feeRate: '1',
        }),
        composedLevels: {
            normal: {
                fee: '1000',
                feePerByte: '5.21', // 1 (old) + 4 (new) + 0.21 (dropped as dust)
                outputs: [
                    // change-output is gone
                    {
                        address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    },
                ],
            },
        },
        composeTransactionCalls: 1,
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
            feeRate: '1',
        }),
        composedLevels: {
            normal: {
                error: 'NOT-ENOUGH-FUNDS',
            },
            custom: {
                type: 'final',
                fee: '600',
                feePerByte: '3.13', // 1 (old) + 2.13 (highest possible)
                outputs: [
                    // change-output is gone
                    {
                        address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                        amount: '30400',
                    },
                ],
            },
        },
        composeTransactionCalls: 2, // 1. normal fee, 2. custom fee
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
                            txid: ABCD,
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
            feeRate: '12',
        }),
        composedLevels: {
            normal: {
                type: 'final',
                fee: '8228',
                feePerByte: '22', // 12 (old) + 10 (new)
                inputs: [{ prev_hash: DCBA }, { prev_hash: ABCD }],
                outputs: [
                    {
                        address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                        amount: '31000',
                    },
                    // change-output is added, note that this is first unused address (not first on the list)
                    {
                        address_n: [2147483692, 2147483648, 2147483648, 1, 1],
                        amount: '1772',
                    },
                ],
            },
        },
        composeTransactionCalls: 1,
        signedTx: {
            outputs: [
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '31000',
                    orig_index: 0,
                    orig_hash: 'ABCD',
                },
                {
                    amount: '1772',
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
                            txid: ABCD,
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
            feeRate: '1',
            changeAddress: undefined,
        }),
        composedLevels: {
            custom: {
                type: 'final',
                fee: '1000',
                feePerByte: '2.94', // 1 (old) + 1.94 (highest possible)
                inputs: [{ prev_hash: DCBA }, { prev_hash: ABCD }],
                outputs: [
                    {
                        address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                        amount: '31000',
                    },
                ],
            },
        },
        composeTransactionCalls: 2, // 1. normal fee, 2. custom fee
        signedTx: {
            inputs: [{ prev_hash: DCBA }, { prev_hash: ABCD }],
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
                            txid: ABCD,
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
            feeRate: '1',
        }),
        composedLevels: {
            custom: {
                type: 'final',
                fee: '1800', // new utxo + old change-output + old fee (100)
                feePerByte: '5.29', // 1 (old) + 4.29 (highest possible)
                inputs: [{ prev_hash: DCBA }, { prev_hash: ABCD }], // new utxo added
                outputs: [
                    // change output was removed
                    {
                        address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                        amount: '30200',
                    },
                ],
            },
        },
        composeTransactionCalls: 2, // 1. normal fee, 2. custom fee
        signedTx: {
            inputs: [{ prev_hash: DCBA }, { prev_hash: ABCD }],
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
                            txid: ABCD,
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
            feeRate: '2',
            changeAddress: undefined,
        }),
        composedLevels: {
            normal: {
                type: 'final',
                fee: '2304',
                feePerByte: '12', // 2 (old) + 10 (new)
                inputs: [{ prev_hash: DCBA }],
                outputs: [
                    {
                        address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                        amount: '28696',
                    },
                ],
            },
        },
        composeTransactionCalls: 3, // 1. normal fee, 2. custom fee, 3. send-max
        decreasedOutputs: true,
        signedTx: {
            inputs: [{ prev_hash: DCBA }],
            outputs: [
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '28696',
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
            feeRate: '1.37',
            changeAddress: undefined,
        }),
        composeTransactionCalls: 1, // 1. immediate send-max
        decreasedOutputs: true,
        composedLevels: {
            normal: {
                type: 'final',
                fee: '1032',
                feePerByte: '5.38', // 1.37 (old) + 4 (new) + 0.01 (fee rounding)
                inputs: [{ prev_hash: DCBA }],
                outputs: [
                    {
                        address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                        amount: '29968',
                    },
                ],
            },
        },
        signedTx: {
            inputs: [{ prev_hash: DCBA }],
            outputs: [
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '29968',
                    orig_index: 0,
                    orig_hash: 'ABCD',
                },
            ],
        },
    },
    {
        description: 'output decreased. there is no change or new utxo.',
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
                fee: '1496',
                feePerByte: '7.79', // 3.79 (old) + 4 (new)
                outputs: [
                    {
                        address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                        amount: '29504',
                    },
                ],
            },
        },
        composeTransactionCalls: 3, // 1. normal fee, 2. custom fee, 3 send-max
        decreasedOutputs: true,
        signedTx: {
            inputs: [{ prev_hash: DCBA }],
            outputs: [
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '29504',
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
                    amount: '29043',
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
            feeRate: '3',
        }),
        composedLevels: {
            normal: {
                type: 'final',
                fee: '1673',
                feePerByte: '7', // 3 (old) + 4 (new)
                // outputs indexes are totally mixed up
                outputs: [
                    {
                        script_type: 'PAYTOOPRETURN',
                    },
                    {
                        amount: '1000', // external
                    },
                    {
                        amount: '28327', // change
                    },
                ],
            },
        },
        composeTransactionCalls: 1,
        signedTx: {
            // outputs are restored
            outputs: [
                {
                    address_n: [2147483692, 2147483648, 2147483648, 1, 0],
                    amount: '28327',
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
        description: 'used utxo is too low to do anything with it.',
        store: {
            selectedAccount: {
                ...BTC_ACCOUNT,
            },
        },
        tx: PREPARE_TX({
            utxo: [
                {
                    amount: '800',
                    txid: DCBA,
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
            feeRate: '1',
            changeAddress: undefined,
        }),
        composedLevels: {
            normal: {
                type: 'error',
                error: 'NOT-ENOUGH-FUNDS',
            },
        },
        composeTransactionCalls: 4, // 1. normal fee, 2. custom fee, 3. send-max normal fee, 4. send-max custom fee
        // tx is not signed
    },
    {
        description: 'CoinJoin account with not anonymized utxos. decreasing output instead.',
        store: {
            selectedAccount: {
                ...BTC_CJ_ACCOUNT,
                account: {
                    ...BTC_CJ_ACCOUNT.account,
                    utxo: [
                        {
                            amount: '30000',
                            txid: 'abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd',
                            vout: 0,
                            address:
                                'bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw',
                            path: "m/44'/0'/0'/0/1",
                            blockHeight: 1000,
                            confirmations: 1000,
                        },
                    ],
                    addresses: {
                        ...BTC_CJ_ACCOUNT.account.addresses,
                        anonymitySet: {
                            bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw: 1,
                        },
                    },
                },
            },
            coinjoin: {
                accounts: [{ key: BTC_CJ_ACCOUNT.account.key }],
            },
        },
        tx: PREPARE_TX({
            utxo: [
                {
                    amount: '8000',
                    txid: DCBA,
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
                    amount: '7800',
                    formattedAmount: '0.000078',
                },
            ],
            feeRate: '11.33',
            changeAddress: undefined,
        }),
        composedLevels: {
            normal: {
                type: 'final',
                fee: '2944',
                feePerByte: '15.33', // 11.33 (old) + 4 (new)
            },
        },
        composeTransactionCalls: 1, // 1. immediate send-max
        decreasedOutputs: 'TR_NOT_ENOUGH_ANONYMIZED_FUNDS_RBF_WARNING',
        signedTx: {
            inputs: [{ prev_hash: DCBA }],
            outputs: [
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '5056',
                    orig_index: 0,
                    orig_hash: 'ABCD',
                },
            ],
        },
    },
    {
        description:
            'CoinJoin account with utxos registered in CJ session. decreasing output instead.',
        store: {
            selectedAccount: {
                ...BTC_CJ_ACCOUNT,
                account: {
                    ...BTC_CJ_ACCOUNT.account,
                    utxo: [
                        {
                            amount: '30000',
                            txid: 'abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd',
                            vout: 0,
                            address:
                                'bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw',
                            path: "m/44'/0'/0'/0/1",
                            blockHeight: 1000,
                            confirmations: 1000,
                        },
                    ],
                    addresses: {
                        ...BTC_CJ_ACCOUNT.account.addresses,
                        anonymitySet: {
                            bc1ptxs597p3fnpd8gwut5p467ulsydae3rp9z75hd99w8k3ljr9g9rqx6ynaw: 10,
                        },
                    },
                },
            },
            coinjoin: {
                accounts: [
                    {
                        key: BTC_CJ_ACCOUNT.account.key,
                        session: {},
                        prison: {
                            cdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdab00000000:
                                { roundId: '00' },
                        },
                    },
                ],
            },
        },
        tx: PREPARE_TX({
            utxo: [
                {
                    amount: '8000',
                    txid: DCBA,
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
                    amount: '7800',
                    formattedAmount: '0.000078',
                },
            ],
            feeRate: '11.33',
            changeAddress: undefined,
        }),
        composedLevels: {
            normal: {
                type: 'final',
                fee: '2944',
                feePerByte: '15.33', // 11.33 (old) + 4 (new)
            },
        },
        composeTransactionCalls: 1, // 1. immediate send-max
        decreasedOutputs: 'TR_UTXO_REGISTERED_IN_COINJOIN_RBF_WARNING',
        signedTx: {
            inputs: [{ prev_hash: DCBA }],
            outputs: [
                {
                    address: '1MCgrVZjXRJJJhi2Z6SR11GpRjCyvNjscY',
                    amount: '5056',
                    orig_index: 0,
                    orig_hash: 'ABCD',
                },
            ],
        },
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
