export const validateTrezorInputs = [
    {
        description: 'valid input',
        params: [
            {
                address_n: [1],
                amount: '1',
                prev_index: 1,
                prev_hash: 'txid',
            },
        ],
        result: [{ amount: '1' }],
    },
    {
        description: 'input with fixed path',
        params: [
            {
                address_n: [44 | 0x80000000], // -2147483604
                amount: '1',
                prev_index: 1,
                prev_hash: 'txid',
            },
        ],
        result: [{ address_n: [(44 | 0x80000000) >>> 0] }], // 2147483692
    },
    {
        description: 'input with converted multisig pubkey',
        params: [
            {
                address_n: [0],
                amount: '1',
                prev_index: 1,
                prev_hash: 'txid',
                multisig: {
                    pubkeys: [
                        {
                            node: 'xpub661MyMwAqRbcF1zGijBb2K6x9YiJPh58xpcCeLvTxMX6spkY3PcpJ4ABcCyWfskq5DDxM3e6Ez5ePCqG5bnPUXR4wL8TZWyoDaUdiWW7bKy',
                        },
                    ],
                },
            },
        ],
        result: [
            {
                multisig: {
                    pubkeys: [
                        {
                            node: {
                                public_key:
                                    '03f645ec6544a92f951f3bca16a2bc1c56846d065594db222725d59b9902528385',
                                chain_code:
                                    '2fb77e25cd3e2e034bcbafa1f81ec7e4caf927b06c87db296f1186208315525e',
                                depth: 0,
                            },
                        },
                    ],
                },
            },
        ],
    },
    {
        description: 'valid EXTERNAL input',
        params: [
            {
                amount: '1',
                prev_index: 1,
                prev_hash: 'txid',
                script_type: 'EXTERNAL',
                script_pubkey: '0000',
                witness: '00',
            },
        ],
        result: [{ amount: '1' }],
    },
    {
        description: 'missing address_n',
        params: [{ amount: '1', prev_index: 1, prev_hash: 'txid' }],
    },
    {
        description: 'missing prev_index',
        params: [{ address_n: [0], amount: '1', prev_hash: 'txid' }],
    },
    {
        description: 'missing prev_hash',
        params: [{ address_n: [0], amount: '1', prev_index: 1 }],
    },
    {
        description: 'missing amount on non segwit path. valid only because of legacy reasons',
        params: [{ address_n: [0], prev_index: 1, prev_hash: 'txid' }],
        result: [{ prev_index: 1 }],
    },
    {
        description: 'missing amount p2sh',
        params: [{ address_n: [49 | 0x80000000], prev_index: 1, prev_hash: 'txid' }],
    },
    // {
    //     description: 'missing amount p2wpkh',
    //     params: [{ address_n: [84 | 0x80000000], prev_index: 1, prev_hash: 'txid' }],
    // },
    // {
    //     description: 'missing amount p2tr',
    //     params: [{ address_n: [86 | 0x80000000], prev_index: 1, prev_hash: 'txid' }],
    // },
    {
        description: 'missing script_pubkey in EXTERNAL',
        params: [{ amount: '1', prev_index: 1, prev_hash: 'txid', script_type: 'EXTERNAL' }],
    },
];
