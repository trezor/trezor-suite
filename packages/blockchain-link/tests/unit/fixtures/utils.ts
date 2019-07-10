const token = {
    address: undefined,
    amount: undefined,
    decimals: 0,
    name: undefined,
    symbol: undefined,
};

const tOut = {
    name: 'Token name',
    symbol: 'TN',
    address: '0x0',
    amount: '0',
    decimals: 0,
    from: undefined,
    to: undefined,
};

const tIn = {
    name: 'Token name',
    symbol: 'TN',
    token: '0x0',
    value: '0',
};

const tokenTransfers = [
    { ...tIn, from: 'A', to: 'B' },
    { ...tIn, from: 'C', to: 'D' },
    { ...tIn, from: 'X', to: 'X' },
];

export default {
    filterTargets: [
        {
            description: 'addresses as string',
            addresses: 'A',
            targets: [{ addresses: ['A'] }, { addresses: ['B'] }],
            parsed: [{ addresses: ['A'] }],
        },
        {
            description: 'addresses as array of strings',
            addresses: ['A'],
            targets: [{ addresses: ['A'] }, { addresses: ['B'] }],
            parsed: [{ addresses: ['A'] }],
        },
        {
            description: 'addresses as array of mixed objects',
            addresses: [
                'A',
                1,
                undefined,
                'C',
                { address: 'B', path: '', transfers: 0, decimal: 0 },
            ],
            targets: [{ addresses: ['A'] }, { addresses: ['B'] }],
            parsed: [{ addresses: ['A'] }, { addresses: ['B'] }],
        },
        {
            description: 'targets not found',
            addresses: 'A',
            targets: [{ addresses: ['B'] }, { addresses: ['C'] }],
            parsed: [],
        },
        {
            description: 'addresses as unexpected object (number)',
            addresses: 1,
            targets: [{ addresses: ['A'] }],
            parsed: [],
        },
        {
            description: 'addresses as unexpected object (null)',
            addresses: null,
            targets: [{ addresses: ['A'] }],
            parsed: [],
        },
        {
            description: 'addresses as unexpected object (array of numbers)',
            addresses: [1],
            targets: [{ addresses: ['A'] }],
            parsed: [],
        },
        {
            description: 'addresses as unexpected object (array of unexpected objects)',
            addresses: [{ foo: 'bar' }],
            targets: [{ addresses: ['A'] }],
            parsed: [],
        },
        {
            description: 'targets as unexpected object (string)',
            addresses: 'A',
            targets: 'A',
            parsed: [],
        },
        {
            description: 'targets as unexpected object (null)',
            addresses: 'A',
            targets: null,
            parsed: [],
        },
        {
            description: 'targets as unexpected object (array of unexpected objects)',
            addresses: 'A',
            targets: ['A', null, 1, {}],
            parsed: [],
        },
    ],
    filterTokenTransfers: [
        {
            description: 'transfer recv',
            addresses: 'B',
            transfers: tokenTransfers,
            parsed: [
                {
                    ...tOut,
                    type: 'recv',
                    from: 'A',
                    to: 'B',
                },
            ],
        },
        {
            description: 'transfer self',
            addresses: 'X',
            transfers: tokenTransfers,
            parsed: [
                {
                    ...tOut,
                    type: 'self',
                    from: 'X',
                    to: 'X',
                },
            ],
        },
        {
            description: 'sent: addresses as string',
            addresses: 'A',
            transfers: tokenTransfers,
            parsed: [
                {
                    ...tOut,
                    type: 'sent',
                    from: 'A',
                    to: 'B',
                },
            ],
        },
        {
            description: 'sent: addresses as array of strings',
            addresses: ['A'],
            transfers: tokenTransfers,
            parsed: [
                {
                    ...tOut,
                    type: 'sent',
                    from: 'A',
                    to: 'B',
                },
            ],
        },
        {
            description: 'addresses as array of mixed objects (sent/recv/sent)',
            addresses: ['A', 1, undefined, 'X', { address: 'D' }, 'NOT_FOUND'],
            transfers: tokenTransfers,
            parsed: [
                {
                    ...tOut,
                    type: 'sent',
                    from: 'A',
                    to: 'B',
                },
                {
                    ...tOut,
                    type: 'recv',
                    from: 'C',
                    to: 'D',
                },
                {
                    ...tOut,
                    type: 'self',
                    from: 'X',
                    to: 'X',
                },
            ],
        },
        {
            description: 'sent: addresses as Address object',
            addresses: [{ address: 'A' }],
            transfers: tokenTransfers,
            parsed: [
                {
                    ...tOut,
                    type: 'sent',
                    from: 'A',
                    to: 'B',
                },
            ],
        },
        {
            description: 'addresses as unexpected object (number)',
            addresses: 1,
            transfers: tokenTransfers,
            parsed: [],
        },
        {
            description: 'addresses as unexpected object (null)',
            addresses: null,
            transfers: tokenTransfers,
            parsed: [],
        },
        {
            description: 'addresses as unexpected object (array of numbers)',
            addresses: [1],
            transfers: tokenTransfers,
            parsed: [],
        },
        {
            description: 'addresses as unexpected object (array of unexpected objects)',
            addresses: [{ foo: 'bar' }],
            transfers: tokenTransfers,
            parsed: [],
        },
        {
            description: 'transfers as unexpected object (string)',
            addresses: 'A',
            transfers: 'A',
            parsed: [],
        },
        {
            description: 'transfers as unexpected object (null)',
            addresses: 'A',
            transfers: null,
            parsed: [],
        },
        {
            description: 'transfers as unexpected object (empty array)',
            addresses: 'A',
            transfers: [],
            parsed: [],
        },
        {
            description: 'transfers as unexpected object (array of unexpected objects)',
            addresses: 'A',
            transfers: ['A', null, 1, {}],
            parsed: [],
        },
    ],
    transformTransaction: [
        {
            description: 'sent to 1 outputs (no change)',
            descriptor: 'A',
            tx: {
                vin: [
                    {
                        addresses: ['A'],
                    },
                ],
                vout: [
                    {
                        addresses: ['B'],
                    },
                ],
            },
            parsed: {
                type: 'sent',
                targets: [
                    {
                        addresses: ['B'],
                    },
                ],
            },
        },
        {
            description: 'sent to 2 outputs (one external, one change)',
            descriptor: 'A',
            addresses: {
                used: ['utxo'],
                unused: [],
                change: ['change'],
            },
            tx: {
                vin: [
                    {
                        addresses: ['utxo'],
                    },
                ],
                vout: [
                    {
                        addresses: ['B'],
                    },
                    {
                        addresses: ['change'],
                    },
                ],
            },
            parsed: {
                type: 'sent',
                targets: [
                    {
                        addresses: ['B'],
                    },
                ],
            },
        },
        {
            description: 'sent to myself (1 input, 1 change output)',
            descriptor: 'A',
            addresses: {
                used: ['utxo'],
                unused: [],
                change: ['change'],
            },
            tx: {
                vin: [
                    {
                        addresses: ['utxo'],
                    },
                ],
                vout: [
                    {
                        addresses: ['change'],
                    },
                ],
            },
            parsed: {
                type: 'self',
                targets: [],
            },
        },
        {
            description: 'sent OP_RETURN with change',
            descriptor: 'A',
            addresses: {
                used: ['utxo'],
                unused: [],
                change: ['change'],
            },
            tx: {
                vin: [
                    {
                        addresses: ['utxo'],
                    },
                ],
                vout: [
                    {
                        addresses: ['change'],
                    },
                    {
                        value: '0',
                        addresses: ['OP_RETURN deadbeef'],
                        isAddress: false,
                    },
                ],
            },
            parsed: {
                type: 'sent',
                targets: [
                    {
                        amount: '0',
                        addresses: ['OP_RETURN deadbeef'],
                        isAddress: false,
                    },
                ],
            },
        },
        {
            description: 'sent without output',
            descriptor: 'utxo',
            addresses: {
                used: ['utxo'],
                unused: [],
                change: ['change'],
            },
            tx: {
                vin: [
                    {
                        addresses: ['utxo'],
                    },
                ],
            },
            parsed: {
                type: 'sent',
                targets: [],
            },
        },
        {
            description: 'recv from 1 input',
            descriptor: 'A',
            tx: {
                vin: [
                    {
                        addresses: ['utxo'],
                    },
                ],
                vout: [
                    {
                        addresses: ['A'],
                    },
                ],
            },
            parsed: {
                type: 'recv',
                targets: [
                    {
                        addresses: ['utxo'],
                    },
                ],
            },
        },
        {
            description: 'recv from 2 inputs',
            descriptor: 'A',
            tx: {
                vin: [
                    {
                        addresses: ['utxo1', 'utxo2'],
                    },
                    {
                        addresses: ['utxo3'],
                    },
                ],
                vout: [
                    {
                        addresses: ['A'],
                    },
                ],
            },
            parsed: {
                type: 'recv',
                targets: [
                    {
                        addresses: ['utxo1', 'utxo2'],
                    },
                    {
                        addresses: ['utxo3'],
                    },
                ],
            },
        },
        {
            description: 'recv coinbase',
            descriptor: 'A',
            tx: {
                vin: [
                    {
                        coinbase: 'ABCD',
                    },
                ],
                vout: [
                    {
                        addresses: ['A'],
                    },
                ],
            },
            parsed: {
                type: 'recv',
                targets: [
                    {
                        coinbase: 'ABCD',
                    },
                ],
            },
        },
        {
            description: 'recv without address',
            descriptor: 'A',
            tx: {
                vin: [
                    {
                        addresses: [],
                    },
                ],
                vout: [
                    {
                        addresses: ['A'],
                    },
                ],
            },
            parsed: {
                type: 'recv',
                targets: [
                    {
                        addresses: [],
                    },
                ],
            },
        },
        {
            description: 'recv with no input (vin is undefined)',
            descriptor: 'A',
            tx: {
                vout: [
                    {
                        addresses: ['A'],
                    },
                ],
            },
            parsed: {
                type: 'recv',
                targets: [],
            },
        },
        {
            description: 'recv with no input (vin is empty)',
            descriptor: 'A',
            tx: {
                vin: [],
                vout: [
                    {
                        addresses: ['A'],
                    },
                ],
            },
            parsed: {
                type: 'recv',
                targets: [],
            },
        },
        {
            description: 'recv with no input (vin is invalid type)',
            descriptor: 'A',
            tx: {
                vin: 1,
                vout: [
                    {
                        addresses: ['A'],
                    },
                ],
            },
            parsed: {
                type: 'recv',
                targets: [],
            },
        },
        {
            description: 'recv with no input (vin item is invalid type)',
            descriptor: 'A',
            tx: {
                vin: [1],
                vout: [
                    {
                        addresses: ['A'],
                    },
                ],
            },
            parsed: {
                type: 'recv',
                targets: [],
            },
        },
        {
            description: 'token recv',
            descriptor: 'A',
            tx: {
                vin: [
                    {
                        addresses: ['0x1'],
                    },
                ],
                vout: [
                    {
                        addresses: ['0x2'],
                    },
                ],
                tokenTransfers: [{ from: '0x2', to: 'A' }],
            },
            parsed: {
                type: 'recv',
                targets: [],
                tokens: [{ ...token, type: 'recv', from: '0x2', to: 'A' }],
            },
        },
        {
            description: 'token sent',
            descriptor: 'A',
            tx: {
                vin: [
                    {
                        addresses: ['A'],
                    },
                ],
                vout: [
                    {
                        addresses: ['0x2'],
                    },
                ],
                tokenTransfers: [{ from: 'A', to: 'B' }],
            },
            parsed: {
                type: 'sent',
                targets: [],
                tokens: [{ ...token, type: 'sent', from: 'A', to: 'B' }],
            },
        },
        {
            description: 'token to myself',
            descriptor: 'A',
            tx: {
                vin: [
                    {
                        addresses: ['A'],
                    },
                ],
                vout: [
                    {
                        addresses: ['0x2'],
                    },
                ],
                tokenTransfers: [{ from: 'A', to: 'A' }],
            },
            parsed: {
                type: 'sent',
                targets: [],
                tokens: [{ ...token, type: 'self', from: 'A', to: 'A' }],
            },
        },
        {
            description: 'token sent without sender (from)',
            descriptor: 'A',
            tx: {
                vin: [
                    {
                        addresses: ['A'],
                    },
                ],
                vout: [
                    {
                        addresses: ['0x2'],
                    },
                ],
                tokenTransfers: [{ to: 'A' }],
            },
            parsed: {
                type: 'sent',
                targets: [],
                tokens: [{ ...token, type: 'recv', to: 'A' }],
            },
        },
        {
            description: 'token recv without sender (from)',
            descriptor: 'A',
            tx: {
                vin: [
                    {
                        addresses: ['B'],
                    },
                ],
                vout: [
                    {
                        addresses: ['0x2'],
                    },
                ],
                tokenTransfers: [{ to: 'A' }, { to: 'B' }, { to: 'C' }],
            },
            parsed: {
                type: 'recv',
                targets: [],
                tokens: [{ ...token, type: 'recv', to: 'A' }],
            },
        },
        {
            description: 'token sent without receiver (to)',
            descriptor: 'A',
            tx: {
                vin: [
                    {
                        addresses: ['A'],
                    },
                ],
                vout: [
                    {
                        addresses: ['0x2'],
                    },
                ],
                tokenTransfers: [{ from: 'A' }],
            },
            parsed: {
                type: 'sent',
                targets: [],
                tokens: [{ ...token, type: 'sent', from: 'A' }],
            },
        },
        {
            description: 'token sent but no tokenTransfer specified',
            descriptor: 'A',
            tx: {
                vin: [
                    {
                        addresses: ['A'],
                    },
                ],
                vout: [
                    {
                        addresses: ['0x2'],
                    },
                ],
                tokenTransfers: [],
            },
            parsed: {
                type: 'sent',
                targets: [
                    {
                        addresses: ['0x2'],
                    },
                ],
            },
        },
        {
            description: 'unknown tx (no inputs, no outputs)',
            descriptor: 'A',
            tx: {},
            parsed: {
                type: 'unknown',
                targets: [],
            },
        },
        {
            description: 'unknown tx (inputs and outputs are not mine)',
            descriptor: 'A',
            tx: {
                vin: [
                    {
                        coinbase: 'B',
                    },
                ],
                vout: [
                    {
                        addresses: ['B'],
                    },
                ],
            },
            parsed: {
                type: 'unknown',
                targets: [],
            },
        },
    ],
};
