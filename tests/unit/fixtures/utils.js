const token = {
    address: undefined,
    amount: undefined,
    decimals: 0,
    name: undefined,
    symbol: undefined,
};

export default {
    filterTargets: [
        {
            description: 'addresses as string',
            addresses: 'A',
            targets: [{ addresses: ['A'] }, { addresses: ['B'] }],
            parsed: [{ addresses: ['A'] }],
        },
    ],
    transformTargets: [],
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
