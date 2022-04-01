const { ADDRESS_N, TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: 'Komodo: fee sapling',
            params: {
                coin: 'kmd',
                version: 4,
                overwintered: true,
                versionGroupId: 2301567109,
                branchId: 1991772603,
                locktime: 1563046072,
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/141'/0'/0/0"),
                        prev_hash:
                            '2807c5b126ec8e2b078cab0f12e4c8b4ce1d7724905f8ebef8dca26b0c8e0f1d',
                        prev_index: 0,
                        amount: '1099980000',
                    },
                ],
                outputs: [
                    {
                        address: 'R9HgJZo6JBKmPvhm7whLSR8wiHyZrEDVRi',
                        amount: '1099970000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['2807c5'], true),
            },
            result: {
                serializedTx:
                    '0400008085202f89011d0f8e0c6ba2dcf8be8e5f9024771dceb4c8e4120fab8c072b8eec26b1c50728000000006a4730440220158c970ca2fc6bcc33026eb5366f0342f63b35d178f7efb334b1df78fe90b67202207bc4ff69f67cf843b08564a5adc77bf5593e28ab4d5104911824ac13fe885d8f012102a87aef7b1a8f676e452d6240767699719cd58b0261c822472c25df146938bca5ffffffff01d0359041000000001976a91400178fa0b6fc253a3a402ee2cadd8a7bfec08f6388acb8302a5d000000000000000000000000000000',
            },
        },
        {
            description: 'Komodo: rewards claim',
            params: {
                coin: 'kmd',
                version: 4,
                overwintered: true,
                versionGroupId: 0x892f2085,
                branchId: 0x76b809bb,
                locktime: 0x5d2af1f2,
                inputs: [
                    {
                        address_n: ADDRESS_N("m/44'/141'/0'/0/0"),
                        prev_hash:
                            '7b28bd91119e9776f0d4ebd80e570165818a829bbf4477cd1afe5149dbcd34b1',
                        prev_index: 0,
                        amount: '1099970000',
                    },
                ],
                outputs: [
                    {
                        address: 'R9HgJZo6JBKmPvhm7whLSR8wiHyZrEDVRi',
                        amount: '1099960000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: 'R9HgJZo6JBKmPvhm7whLSR8wiHyZrEDVRi',
                        amount: '79605',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
                refTxs: TX_CACHE(['7b28bd'], true),
            },
            result: {
                serializedTx:
                    '0400008085202f8901b134cddb4951fe1acd7744bf9b828a816501570ed8ebd4f076979e1191bd287b000000006a4730440220483a58f5be3a147c773c663008c992a7fcea4d03bdf4c1d4bc0535c0d98ddf0602207b19d69140dd00c7a94f048c712aeaed55dfd27f581c7212d9cc5e476fe1dc9f012102a87aef7b1a8f676e452d6240767699719cd58b0261c822472c25df146938bca5ffffffff02c00e9041000000001976a91400178fa0b6fc253a3a402ee2cadd8a7bfec08f6388acf5360100000000001976a91400178fa0b6fc253a3a402ee2cadd8a7bfec08f6388acf2f12a5d000000000000000000000000000000',
            },
        },
    ],
};
