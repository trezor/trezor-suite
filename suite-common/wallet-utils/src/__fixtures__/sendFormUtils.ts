export const prepareEthereumTransaction = [
    {
        description: 'regular',
        txInfo: {
            to: '0x1f815D67006163E502b8eD4947C91ad0A62De24e',
            amount: '1',
            chainId: 1,
            nonce: '2',
            gasLimit: '21000',
            gasPrice: '1',
            data: 'deadbeef',
        },
        result: {
            to: '0x1f815D67006163E502b8eD4947C91ad0A62De24e',
            value: '0xde0b6b3a7640000',
            chainId: 1,
            nonce: '0x2',
            gasLimit: '0x5208',
            gasPrice: '0x3b9aca00',
            data: '0xdeadbeef',
        },
    },
    {
        // https://eth1.trezor.io/tx/0xdcaf3eba690a3cdbad8c2926a8f5a95cd20003c5ba2aace91d8c5fe8048e395b
        description: 'erc20',
        txInfo: {
            token: {
                type: 'ERC20',
                symbol: 'gnt',
                decimals: 18,
                contract: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d',
                name: 'GNT',
            },
            to: '0xA6ABB480640d6D27D2FB314196D94463ceDcB31e',
            amount: '0.005',
            chainId: 1,
            nonce: '11',
            gasLimit: '200000',
            gasPrice: '5',
            data: 'deadbeef-not-used',
        },
        result: {
            to: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d',
            value: '0x00',
            chainId: 1,
            nonce: '0xb',
            gasLimit: '0x30d40',
            gasPrice: '0x12a05f200',
            data: '0xa9059cbb000000000000000000000000A6ABB480640d6D27D2FB314196D94463ceDcB31e0000000000000000000000000000000000000000000000000011c37937e08000',
        },
    },
];

export const restoreOrigOutputsOrder = [
    {
        description: 'order not changed',
        outputs: [
            {
                address: 'ABCD',
                amount: '1',
            },
            {
                address_n: [],
                amount: '2',
            },
        ],
        origOutputs: [
            {
                type: 'payment',
                address: 'ABCD',
                amount: '1',
            },
            {
                type: 'change',
                address_n: [],
                amount: '2',
            },
        ],
        result: [
            {
                address: 'ABCD',
                amount: '1',
                orig_index: 0,
                orig_hash: 'txid',
            },
            {
                address_n: [],
                amount: '2',
                orig_index: 1,
                orig_hash: 'txid',
            },
        ],
    },
    {
        description: 'order not changed: change-output is removed',
        outputs: [
            {
                address: 'ABCD',
                amount: '1',
            },
        ],
        origOutputs: [
            {
                type: 'payment',
                address: 'ABCD',
                amount: '1',
            },
            {
                type: 'change',
                address_n: [],
                amount: '2',
            },
        ],
        result: [
            {
                address: 'ABCD',
                amount: '1',
                orig_index: 0,
                orig_hash: 'txid',
            },
        ],
    },
    {
        description:
            'order changed: change-output is added on index 0, two external outputs with the same address',
        outputs: [
            {
                address_n: [],
                amount: '2',
            },
            {
                address: 'ABCD',
                amount: '1',
            },
            {
                address: 'ABCD',
                amount: '3',
            },
        ],
        origOutputs: [
            {
                type: 'payment',
                address: 'ABCD',
                amount: '1',
            },
            {
                type: 'payment',
                address: 'ABCD',
                amount: '3',
            },
        ],
        result: [
            {
                address: 'ABCD',
                amount: '1',
                orig_index: 0,
                orig_hash: 'txid',
            },
            {
                address: 'ABCD',
                amount: '3',
                orig_index: 1,
                orig_hash: 'txid',
            },
            {
                address_n: [],
                amount: '2',
            },
        ],
    },
    {
        description: 'order changed: change-output removed from index 0',
        outputs: [
            {
                address: 'ABCD',
                amount: '1',
            },
        ],
        origOutputs: [
            {
                type: 'change',
                address_n: [],
                amount: '2',
            },
            {
                type: 'payment',
                address: 'ABCD',
                amount: '1',
            },
        ],
        result: [
            {
                address: 'ABCD',
                amount: '1',
                orig_index: 1,
                orig_hash: 'txid',
            },
        ],
    },
    {
        description: 'order changed: change-output added on last position',
        outputs: [
            {
                address: 'ABCD',
                amount: '1',
            },
            {
                address_n: [],
                amount: '2',
            },
        ],
        origOutputs: [
            {
                type: 'change',
                address_n: [],
                amount: '2',
            },
            {
                type: 'payment',
                address: 'ABCD',
                amount: '1',
            },
        ],
        result: [
            {
                address_n: [],
                amount: '2',
                orig_index: 0,
                orig_hash: 'txid',
            },
            {
                address: 'ABCD',
                amount: '1',
                orig_index: 1,
                orig_hash: 'txid',
            },
        ],
    },
    {
        description: 'order changed: chaotic outputs mix',
        outputs: [
            {
                script_type: 'PAYTOOPRETURN',
                op_return_data: 'AA',
                amount: '0',
            },
            {
                address: 'DCBA',
                amount: '3',
            },
            {
                address: 'ABCD',
                amount: '1',
            },
            {
                address: 'DEAD',
                amount: '4',
            },
            {
                address_n: [],
                amount: '2',
            },
        ],
        origOutputs: [
            {
                type: 'change',
                address_n: [],
                amount: '2',
            },
            {
                type: 'opreturn',
                dataHex: 'AA',
                dataAscii: 'AA',
            },
            {
                type: 'payment',
                address: 'ABCD',
                amount: '1',
            },
        ],
        result: [
            {
                address_n: [],
                amount: '2',
                orig_index: 0,
                orig_hash: 'txid',
            },
            {
                script_type: 'PAYTOOPRETURN',
                op_return_data: 'AA',
                amount: '0',
                orig_index: 1,
                orig_hash: 'txid',
            },
            {
                address: 'ABCD',
                amount: '1',
                orig_index: 2,
                orig_hash: 'txid',
            },
            {
                address: 'DCBA',
                amount: '3',
            },
            {
                address: 'DEAD',
                amount: '4',
            },
        ],
    },
];
