const legacyResults = [
    {
        rules: ['<2.11.0', '1'],
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
            description: 'Transfer TRX',
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
            description: 'Trigger smart contract',
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
        {
            description: 'Freeze for energy',
            params: {
                path: "m/44'/195'/0'/0/0",
                ref_block_bytes: '7e0b',
                ref_block_hash: 'ed0f599cb230d512',
                expiration: 1770551739000,
                timestamp: 1770551679000,
                contract: [
                    {
                        type: 'FreezeBalanceV2Contract',
                        parameter: {
                            value: {
                                owner_address: '41f2cd810c48c401d392ead3c6e1e1cb9f57750a58',
                                balance: 50000000,
                                resource: 'ENERGY',
                            },
                        },
                    },
                ],
            },
            result: {
                signature:
                    '39114ab6d33aafc741057c7245272b286d71fd4242052445cd058170073bbee1534e6752f2d1a305916fbac06fb0803641df604c713ee927e872a0ad972d18d01c',
            },
            legacyResults,
        },
        {
            description: 'Unfreeze for bandwidth',
            params: {
                path: "m/44'/195'/0'/0/0",
                ref_block_bytes: 'f2b7',
                ref_block_hash: 'fb75c38816f843ef',
                expiration: 1771437825000,
                timestamp: 1771436565000,
                contract: [
                    {
                        type: 'UnfreezeBalanceV2Contract',
                        parameter: {
                            value: {
                                owner_address: '41f2cd810c48c401d392ead3c6e1e1cb9f57750a58',
                                balance: 10000000,
                            },
                        },
                    },
                ],
            },
            result: {
                signature:
                    'b4d10dbd35e1c4e925f45c38809e648df9936f6e5a9fa49ffd90f6ca81abc0595aa388f797114963a5a2be71b982832112846dfdd5b8125c0bcedb2822047a591b',
            },
            legacyResults,
        },
        {
            description: 'Claim unfrozen balance',
            params: {
                path: "m/44'/195'/0'/0/0",
                ref_block_bytes: 'f55c',
                ref_block_hash: 'e53dfa7c93866297',
                expiration: 1771439874000,
                timestamp: 1771438614000,
                contract: [
                    {
                        type: 'WithdrawExpireUnfreezeContract',
                        parameter: {
                            value: { owner_address: '41f2cd810c48c401d392ead3c6e1e1cb9f57750a58' },
                        },
                    },
                ],
            },
            result: {
                signature:
                    '833f6ba5c449a28ee6c58d98298f2f7cce8be1b7f70396e763ec216ca1d396b152bcefe9c7dde9970db2f1d38ecfba5aa20023f966f685da0048944415cb56f31c',
            },
            legacyResults,
        },
    ],
} satisfies TestCase;
