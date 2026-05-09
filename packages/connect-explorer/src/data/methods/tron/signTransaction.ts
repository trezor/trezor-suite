const name = 'tronSignTransaction';

export default [
    {
        name,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                type: 'input',
                value: `m/44'/195'/0'/0/0`,
            },
            {
                name: 'ref_block_bytes',
                type: 'input',
                value: 'e942',
            },
            {
                name: 'ref_block_hash',
                type: 'input',
                value: '6394747da9fee421',
            },
            {
                name: 'expiration',
                type: 'number',
                value: 1752562632000,
            },
            {
                name: 'timestamp',
                type: 'number',
                value: 1752562572000,
            },
            {
                name: 'fee_limit',
                type: 'number',
                value: 10000000,
            },
            {
                name: 'data',
                type: 'input',
                value: '',
            },
            {
                name: 'contract',
                type: 'json',
                value: [
                    {
                        type: 'TransferContract',
                        parameter: {
                            value: {
                                owner_address: '41f2cd810c48c401d392ead3c6e1e1cb9f57750a58',
                                to_address: '4141f82674a30ae1328745d08afe2d1a0a24195283',
                                amount: 18123456,
                            },
                        },
                    },
                ],
            },
        ],
    },
];
