const legacyResults = [
    {
        rules: ['<2.10.1', '1'],
        success: false,
    },
];

export default {
    method: 'tronSignTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'TronTransferContract',
            params: {
                path: "m/44'/195'/0'/0/0",
                ref_block_bytes: 'e942',
                ref_block_hash: '6394747da9fee421',
                expiration: 1752562632000,
                timestamp: 1752562572000,
                contract: [
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
            result: {
                signature:
                    'a7f8602b02413e9dded0170daa5b4ada9a2679198af276be456f4faea1bc326f5070789bec5e6471de3f726f4fe0c9daced8df183e4a62804db26d5650c59a521c',
            },
            legacyResults,
        },
        {
            description: 'TronTriggerSmartContract',
            params: {
                path: "m/44'/195'/0'/0/0",
                ref_block_bytes: 'dae0',
                ref_block_hash: '9ab5c70b3a11405f',
                expiration: 1766454906000,
                fee_limit: 50000000,
                timestamp: 1766453046721,
                contract: [
                    {
                        type: 'TriggerSmartContract',
                        parameter: {
                            value: {
                                data: 'a9059cbb000000000000000000000000d093f24888ab06073a4bdffbb8107db1ea9dc0a000000000000000000000000000000000000000000000000000000000013bb450',
                                owner_address: '41f2cd810c48c401d392ead3c6e1e1cb9f57750a58',
                                contract_address: '4142a1e39aefa49290f2b3f9ed688d7cecf86cd6e0',
                            },
                        },
                    },
                ],
            },
            result: {
                signature:
                    'f99e2f704c78b07d49fcfa4cc7cd032635807f9a1f09b57adc2232cac38d0d42428008bd9953944e0276123ee6851a266078df9c68e5c4db158be05377dadd7b1c',
            },
            legacyResults,
        },
    ],
} satisfies TestCase;
