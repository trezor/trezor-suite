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
                address: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d',
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

export const serializeEthereumTx = [
    {
        // https://eth1.trezor.io/tx/0xf6652a681b4474132b8b96512eb0bd5311f5ed8414af59e715c9738a3b3673f3
        description: 'ETH regular',
        tx: {
            // data sent to TrezorConnect.ethereumSignTransaction
            to: '0x4dC573D5DB497C0bF0674599E81c7dB91151D4e6',
            value: '0x3905f13a8f0e',
            chainId: 1,
            nonce: '0x12',
            gasLimit: '0x5208',
            gasPrice: '0x104c533c00',
            data: '0x',
            // data received from TrezorConnect.ethereumSignTransaction
            v: '0x1c',
            r: '0x4256ec5ddf73f12f781e9f646f56fd8843296cf3eb7e2fb8f0b67ea317be3e7c',
            s: '0x7be26525b6d6d39ef8745801bbb463c35ede09746708316a011e6eee7a2d83cf',
        },
        result: '0xf6652a681b4474132b8b96512eb0bd5311f5ed8414af59e715c9738a3b3673f3',
    },
    {
        // https://eth1.trezor.io/tx/0xdcaf3eba690a3cdbad8c2926a8f5a95cd20003c5ba2aace91d8c5fe8048e395b
        description: 'Eth with ERC20',
        tx: {
            to: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d',
            value: '0x0',
            chainId: 1,
            nonce: '0xb',
            gasLimit: '0x30d40',
            gasPrice: '0x12a05f200',
            data: '0xa9059cbb000000000000000000000000a6abb480640d6d27d2fb314196d94463cedcb31e0000000000000000000000000000000000000000000000000011c37937e08000',
            v: '0x26',
            r: '0x47ef1bb1625e4152b0febf6ddc1a57bfcea6438132928dda4c9c092b34f38a78',
            s: '0x3f70084c300235d588b70103988dd6f367e0f67bf38e2759a4c77aa461b220e2',
        },
        result: '0xdcaf3eba690a3cdbad8c2926a8f5a95cd20003c5ba2aace91d8c5fe8048e395b',
    },
    {
        // https://etc1.trezor.io/tx/0xebd7ef20c4358a6fdb09a951d6e77b8e88b37ac0f7a8d4e3b68f1666bf4c1d1a
        description: 'ETC regular',
        tx: {
            to: '0xABE894C18832edbe9B7926D729FA950673faD1EC',
            value: '0x56c212a8e4628',
            chainId: 61,
            nonce: '0x0',
            gasLimit: '0x5208',
            gasPrice: '0x5409c6a7b',
            data: '0x',
            v: '0x9e',
            r: '0x9d4599beedc587e0dc3d88578d79573c0138f9389810ffb036c37423ccd86375',
            s: '0x4a0eb870fbae9a11a02e3e0068830d141ee952bb4ab4d1e1b7542d75f7a24dc1',
        },
        result: '0xebd7ef20c4358a6fdb09a951d6e77b8e88b37ac0f7a8d4e3b68f1666bf4c1d1a',
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
