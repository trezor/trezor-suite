const BECH32_ACCOUNT = {
    path: "m/84'/0'/0'",
    addresses: {
        used: [], // irrelevant
        unused: [], // irrelevant
        change: [
            {
                address: 'bc1qktmhrsmsenepnnfst8x6j27l0uqv7ggrg8x38q',
                path: "m/84'/0'/0'/1/0",
                transfers: 0,
            },
        ],
    },
    utxo: [
        {
            txid: '86a6e02943dcd057cfbe349f2c2274478a3a1be908eb788606a6950e727a0d36',
            vout: 0,
            amount: '9426',
            blockHeight: 590093,
            address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
            path: "m/84'/0'/0'/0/0",
            confirmations: 100,
        },
    ],
};

const DOGE_ACCOUNT = {
    path: "m/44'/3'/0'",
    addresses: {
        used: [],
        unused: [],
        change: [
            {
                address: 'DKu2a8Wo6zC2dmBBYXwUG3fxWDHbKnNiPj',
                path: "m/44'/3'/0'/1/0",
                transfers: 0,
            },
        ],
    },
    utxo: [
        {
            txid: '78c3ee88226c7f63060fbf27ab0450961c09241bfd56a12ce164881791c7c6e5',
            vout: 1,
            amount: '500000000',
            blockHeight: 2272181,
            address: 'DUCd1B3YBiXL5By15yXgSLZtEkvwsgEdqS',
            path: "m/44'/3'/0'/0/0",
            confirmations: 100,
        },
    ],
};

const FEE_LEVELS = [
    {
        label: 'normal',
        feePerUnit: '1',
    },
];

const DOGE_FEE_LEVELS = [
    {
        label: 'normal',
        feePerUnit: '1000', // 0.001 DOGE
    },
];

export default {
    method: 'composeTransaction',
    setup: {
        mnemonic: undefined, // device is not used in this test case
    },
    tests: [
        {
            description: 'Bitcoin (Bech32/P2WPKH): precompose with change',
            params: {
                account: BECH32_ACCOUNT,
                feeLevels: FEE_LEVELS,
                outputs: [
                    {
                        address: '36JkLACrdxARqXXffZk91V9W6SJvghKaVK',
                        amount: '6497',
                    },
                ],
                coin: 'btc',
            },
            result: [
                {
                    type: 'final',
                    bytes: 142,
                    fee: '142',
                    feePerByte: '1',
                    max: undefined,
                    totalSpent: '6639',
                    inputs: [{ script_type: 'SPENDWITNESS', sequence: 0xffffffff }],
                    outputs: [
                        { amount: '2787', script_type: 'PAYTOWITNESS' },
                        { amount: '6497', script_type: 'PAYTOADDRESS' },
                    ],
                    outputsPermutation: [1, 0], // default permutation from @trezor/utxo-lib/compose
                },
            ],
        },
        {
            description:
                'Bitcoin (Bech32/P2WPKH): precompose without outputs permutation, with baseFee and custom sequence',
            params: {
                account: BECH32_ACCOUNT,
                feeLevels: FEE_LEVELS,
                outputs: [
                    {
                        address: '36JkLACrdxARqXXffZk91V9W6SJvghKaVK',
                        amount: '6497',
                    },
                ],
                baseFee: 167,
                skipPermutation: true,
                sequence: 1,
                coin: 'btc',
            },
            result: [
                {
                    type: 'final',
                    bytes: 142,
                    fee: '309',
                    feePerByte: '2.176056338028169',
                    max: undefined,
                    totalSpent: '6806',
                    inputs: [{ script_type: 'SPENDWITNESS', sequence: 1 }],
                    outputs: [
                        { amount: '6497', script_type: 'PAYTOADDRESS' },
                        { amount: '2620', script_type: 'PAYTOWITNESS' }, // skipped permutation
                    ],
                    outputsPermutation: [0, 1],
                },
            ],
        },
        {
            description: 'Bitcoin (Bech32/P2WPKH): precompose with required utxo',
            params: {
                account: {
                    ...BECH32_ACCOUNT,
                    utxo: [
                        {
                            txid: '86a6e02943dcd057cfbe349f2c2274478a3a1be908eb788606a6950e727a0d36',
                            vout: 0,
                            amount: '9426',
                            blockHeight: 590093,
                            address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
                            path: "m/84'/0'/0'/0/0",
                            confirmations: 0,
                            required: true, // NOTE: this utxo is used only because of this param
                        },
                        {
                            txid: '86a6e02943dcd057cfbe349f2c2274478a3a1be908eb788606a6950e727a0d36',
                            vout: 1, // NOTE: this utxo doesn't belong to this account
                            amount: '309896',
                            blockHeight: 590093,
                            address: '3N6sbjPwa9L911fPxykD3XnGifMdVRMZPV',
                            path: "m/84'/0'/0'/0/100",
                            confirmations: 100,
                        },
                    ],
                },
                feeLevels: FEE_LEVELS,
                outputs: [
                    {
                        address: '3N6sbjPwa9L911fPxykD3XnGifMdVRMZPV',
                        amount: '1000',
                    },
                ],
                coin: 'btc',
            },
            result: [
                {
                    type: 'final',
                    bytes: 142,
                    fee: '142',
                    totalSpent: '1142',
                    inputs: [{ amount: '9426', script_type: 'SPENDWITNESS' }],
                    outputs: [
                        { amount: '1000', script_type: 'PAYTOADDRESS' },
                        { amount: '8284', script_type: 'PAYTOWITNESS' },
                    ],
                },
            ],
        },
        {
            description: 'Bitcoin (Bech32/P2WPKH): precompose with required and additional utxos',
            params: {
                account: {
                    ...BECH32_ACCOUNT,
                    utxo: [
                        {
                            txid: '86a6e02943dcd057cfbe349f2c2274478a3a1be908eb788606a6950e727a0d36',
                            vout: 0,
                            amount: '9426',
                            blockHeight: 590093,
                            address: 'bc1qannfxke2tfd4l7vhepehpvt05y83v3qsf6nfkk',
                            path: "m/84'/0'/0'/0/0",
                            confirmations: 0,
                            required: true,
                        },
                        {
                            txid: '86a6e02943dcd057cfbe349f2c2274478a3a1be908eb788606a6950e727a0d36',
                            vout: 1, // NOTE: this utxo doesn't belong to this account
                            amount: '309896',
                            blockHeight: 590093,
                            address: '3N6sbjPwa9L911fPxykD3XnGifMdVRMZPV',
                            path: "m/84'/0'/0'/0/100",
                            confirmations: 100,
                        },
                        {
                            txid: '5dfd1b037633adc7f84a17b2df31c9994fe50b3ab3e246c44c4ceff3d326f62e',
                            vout: 0,
                            amount: '7086',
                            blockHeight: 626426,
                            address: 'bc1q7e6qu5smalrpgqrx9k2gnf0hgjyref5p36ru2m',
                            path: "m/84'/0'/0'/0/1",
                            confirmations: 0,
                            required: true,
                        },
                    ],
                },
                feeLevels: FEE_LEVELS,
                outputs: [
                    {
                        address: '3N6sbjPwa9L911fPxykD3XnGifMdVRMZPV',
                        amount: '16400',
                    },
                ],
                coin: 'btc',
            },
            result: [
                {
                    type: 'final',
                    bytes: 278,
                    fee: '278',
                    totalSpent: '16678',
                    inputs: [
                        { amount: '7086' },
                        { amount: '9426' },
                        { amount: '309896' }, // NOTE: this utxo is used because required utxo is not enough to cover fee
                    ],
                    outputs: [
                        { amount: '16400', script_type: 'PAYTOADDRESS' },
                        { amount: '309730', script_type: 'PAYTOWITNESS' },
                    ],
                },
            ],
        },
        {
            description: 'Bitcoin (Bech32/P2WPKH): precompose with send-max',
            params: {
                account: BECH32_ACCOUNT,
                feeLevels: FEE_LEVELS,
                outputs: [
                    {
                        type: 'send-max',
                        address: '3N6sbjPwa9L911fPxykD3XnGifMdVRMZPV',
                    },
                ],
                coin: 'btc',
            },
            result: [
                {
                    type: 'final',
                    bytes: 111,
                    fee: '111',
                    feePerByte: '1',
                    max: '9315',
                    totalSpent: '9426',
                    inputs: [{ script_type: 'SPENDWITNESS' }],
                    outputs: [{ amount: '9315', script_type: 'PAYTOADDRESS' }],
                },
            ],
        },
        {
            description: 'Bitcoin (Segwit/P2SH): precompose with send-max',
            params: {
                account: BECH32_ACCOUNT,
                feeLevels: FEE_LEVELS,
                outputs: [
                    {
                        type: 'send-max',
                        address: '3N6sbjPwa9L911fPxykD3XnGifMdVRMZPV',
                    },
                ],
                coin: 'btc',
            },
            result: [
                {
                    type: 'final',
                    bytes: 111,
                    fee: '111',
                    feePerByte: '1',
                    max: '9315',
                    totalSpent: '9426',
                    inputs: [{ script_type: 'SPENDWITNESS' }],
                    outputs: [{ amount: '9315', script_type: 'PAYTOADDRESS' }],
                },
            ],
        },
        {
            description: 'Doge (P2PKH): precompose with change',
            params: {
                account: DOGE_ACCOUNT,
                feeLevels: DOGE_FEE_LEVELS,
                outputs: [
                    {
                        address: 'DDn7UV1CrqVefzwrHyw7H2zEZZKqfzR2ZD',
                        amount: '100000000',
                    },
                ],
                coin: 'doge',
            },
            result: [
                {
                    type: 'final',
                    bytes: 226,
                    fee: '226000',
                    max: undefined,
                    totalSpent: '100226000',
                    inputs: [{ script_type: 'SPENDADDRESS' }],
                    outputs: [
                        {
                            address: 'DDn7UV1CrqVefzwrHyw7H2zEZZKqfzR2ZD',
                            amount: '100000000',
                            script_type: 'PAYTOADDRESS',
                        },
                        { amount: '399774000', script_type: 'PAYTOADDRESS' },
                    ],
                },
            ],
        },
        {
            description: 'Doge (P2PKH): precompose with 1 dust limit output',
            params: {
                account: DOGE_ACCOUNT,
                feeLevels: DOGE_FEE_LEVELS,
                outputs: [
                    {
                        address: 'DDn7UV1CrqVefzwrHyw7H2zEZZKqfzR2ZD',
                        amount: '100000',
                    },
                ],
                coin: 'doge',
            },
            result: [
                {
                    type: 'final',
                    bytes: 226,
                    fee: '1226000', // NOTE: +0.01 DOGE per dust limit output
                    max: undefined,
                    totalSpent: '1326000',
                    inputs: [{ script_type: 'SPENDADDRESS' }],
                    outputs: [
                        {
                            address: 'DDn7UV1CrqVefzwrHyw7H2zEZZKqfzR2ZD',
                            amount: '100000',
                            script_type: 'PAYTOADDRESS',
                        },
                        { amount: '498674000', script_type: 'PAYTOADDRESS' },
                    ],
                },
            ],
        },
        {
            description:
                'Doge (P2PKH): precompose with 1 dust limit output, change spent as dust limit',
            params: {
                account: DOGE_ACCOUNT,
                feeLevels: DOGE_FEE_LEVELS,
                outputs: [
                    {
                        address: 'DDn7UV1CrqVefzwrHyw7H2zEZZKqfzR2ZD',
                        amount: '299000000',
                    },
                    {
                        address: 'DDn7UV1CrqVefzwrHyw7H2zEZZKqfzR2ZD',
                        amount: '200000000',
                    },
                ],
                coin: 'doge',
            },
            result: [
                {
                    type: 'final',
                    bytes: 226,
                    fee: '1000000', // NOTE: +0.01 DOGE per dust limit output + ~0.08 DOGE dust limit change
                    max: undefined,
                    totalSpent: '500000000',
                    inputs: [{ script_type: 'SPENDADDRESS' }],
                    outputs: [
                        {
                            address: 'DDn7UV1CrqVefzwrHyw7H2zEZZKqfzR2ZD',
                            amount: '200000000',
                            script_type: 'PAYTOADDRESS',
                        },
                        {
                            address: 'DDn7UV1CrqVefzwrHyw7H2zEZZKqfzR2ZD',
                            amount: '299000000',
                            script_type: 'PAYTOADDRESS',
                        },
                    ],
                },
            ],
        },
        {
            description: 'Doge (P2PKH): precompose with send-max',
            params: {
                account: DOGE_ACCOUNT,
                feeLevels: DOGE_FEE_LEVELS,
                outputs: [
                    {
                        type: 'send-max',
                        address: 'DDn7UV1CrqVefzwrHyw7H2zEZZKqfzR2ZD',
                    },
                ],
                coin: 'doge',
            },
            result: [
                {
                    type: 'final',
                    bytes: 192,
                    fee: '192000',
                    max: '499808000',
                    totalSpent: '500000000',
                    inputs: [{ script_type: 'SPENDADDRESS' }],
                    outputs: [{ amount: '499808000', script_type: 'PAYTOADDRESS' }],
                },
            ],
        },
    ],
};
