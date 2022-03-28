const legacyResults = [
    {
        // EOS not supported below this version
        rules: ['<2.1.1', '1'],
        success: false,
    },
];

export default {
    method: 'eosSignTransaction',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'transfer',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio.token',
                            authorization: [
                                {
                                    actor: 'miniminimini',
                                    permission: 'active',
                                },
                            ],
                            name: 'transfer',
                            data: {
                                from: 'miniminimini',
                                to: 'maximaximaxi',
                                quantity: '1.0000 EOS',
                                memo: 'testtest',
                            },
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_JveDuew7oyKjgLmApra3NmKArx3QH6HVmatgkLYeUYWv7aGaoQPFyjBwAdcxuo2Skq9wRgsizos92h9iq9i5JbeHh7zNuo',
            },
        },
        {
            description: 'delegate',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio',
                            authorization: [
                                {
                                    actor: 'miniminimini',
                                    permission: 'active',
                                },
                            ],
                            name: 'delegatebw',
                            data: {
                                from: 'miniminimini',
                                receiver: 'maximaximaxi',
                                stake_net_quantity: '1.0000 EOS',
                                stake_cpu_quantity: '1.0000 EOS',
                                transfer: true,
                            },
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_Juju8Wjzyn38nuvgS1KT3koKQLHxMMfqVHrp5jMjv4QLU2pUG6EbiJD7D1EHE6xP8DRuwFLVUNR38nTyUKC1Eiz33WocUE',
            },
        },
        {
            description: 'undelegate',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio',
                            authorization: [
                                {
                                    actor: 'miniminimini',
                                    permission: 'active',
                                },
                            ],
                            name: 'undelegatebw',
                            data: {
                                from: 'miniminimini',
                                receiver: 'maximaximaxi',
                                unstake_net_quantity: '1.0000 EOS',
                                unstake_cpu_quantity: '1.0000 EOS',
                            },
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_K3XXUzCUkT2HEdrJTz1CdDDKZbLMShmyEjknQozGhy4F21yUetr1nEe2vUgmGebk2nyYe49R5nkA155J5yFBBaLsTcSdBL',
            },
        },
        {
            description: 'buyRam',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio',
                            authorization: [
                                {
                                    actor: 'miniminimini',
                                    permission: 'active',
                                },
                            ],
                            name: 'buyram',
                            data: {
                                payer: 'miniminimini',
                                receiver: 'miniminimini',
                                quant: '1000000000.0000 EOS',
                            },
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_K4gU5S9g7rS6MojaPwWppEBCBbPrJm1pyJtVR9mts1sBq5xyN7nJv3FGnrBR7ByjanboCtK4ogY35sNPFX1F5qoZW7BkF9',
            },
        },
        {
            description: 'buyRamBytes',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio',
                            authorization: [
                                {
                                    actor: 'miniminimini',
                                    permission: 'active',
                                },
                            ],
                            name: 'buyrambytes',
                            data: {
                                payer: 'miniminimini',
                                receiver: 'miniminimini',
                                bytes: 1023,
                            },
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_K618wK9f27YxHoPG9hoUCsazZXzxumBj3V9MqcTUh9yCocvP1uFZQAmGmZLhsAtuC2TRR4gtqbeQj57FniYd5i4faQCb6t',
            },
        },
        {
            description: 'sellRam',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio',
                            authorization: [
                                {
                                    actor: 'miniminimini',
                                    permission: 'active',
                                },
                            ],
                            name: 'sellram',
                            data: {
                                account: 'miniminimini',
                                bytes: 1024,
                            },
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_JusrCS7H5DR53qke7edoWvJuLiQS2VQ84CsN5NWmWYVa7wmJVjh3Hcg5hH42zF8KjAmmvHtaJZ3wkortTW9eds1eoiKsrj',
            },
        },
        {
            description: 'voteProducer',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio',
                            authorization: [
                                {
                                    actor: 'miniminimini',
                                    permission: 'active',
                                },
                            ],
                            name: 'voteproducer',
                            data: {
                                voter: 'miniminimini',
                                proxy: '',
                                producers: [
                                    'argentinaeos',
                                    'bitfinexeos1',
                                    'cryptolions1',
                                    'eos42freedom',
                                    'eosamsterdam',
                                    'eosasia11111',
                                    'eosauthority',
                                    'eosbeijingbp',
                                    'eosbixinboot',
                                    'eoscafeblock',
                                    'eoscanadacom',
                                    'eoscannonchn',
                                    'eoscleanerbp',
                                    'eosdacserver',
                                    'eosfishrocks',
                                    'eosflytomars',
                                    'eoshuobipool',
                                    'eosisgravity',
                                    'eoslaomaocom',
                                    'eosliquideos',
                                    'eosnewyorkio',
                                    'eosriobrazil',
                                    'eosswedenorg',
                                    'eostribeprod',
                                    'helloeoscnbp',
                                    'jedaaaaaaaaa',
                                    'libertyblock',
                                    'starteosiobp',
                                    'teamgreymass',
                                ],
                            },
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_JxgVhc6ExoTHee3Djrciwmmf2Xck7NLgvAtC2gfgV4Wj2AqMXEb6aKMhpUcTV59VTR1DdnPF1XbiCcJViJiU3zsk1kQz89',
            },
        },
        {
            description: 'refund',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio',
                            authorization: [
                                {
                                    actor: 'miniminimini',
                                    permission: 'active',
                                },
                            ],
                            name: 'refund',
                            data: {
                                owner: 'miniminimini',
                            },
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_JwWZSSKQZL1hCdMmwEAKjs3r15kau5gaBrQczKy65QANANzovV6U4XbVUZQkZzaQrNGYAtgxrU1WJ1smWgXZNqtKVQUZqc',
            },
        },
        {
            description: 'updateAuth',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio',
                            authorization: [
                                {
                                    actor: 'miniminimini',
                                    permission: 'active',
                                },
                            ],
                            name: 'updateauth',
                            data: {
                                account: 'miniminimini',
                                permission: 'active',
                                parent: 'owner',
                                auth: {
                                    threshold: 1,
                                    keys: [
                                        {
                                            weight: 1,
                                            key: 'EOS8Dkj827FpinZBGmhTM28B85H9eXiFH5XzvLoeukCJV5sKfLc6K',
                                        },
                                        {
                                            weight: 2,
                                            key: 'EOS8Dkj827FpinZBGmhTM28B85H9eXiFH5XzvLoeukCJV5sKfLc6K',
                                        },
                                    ],
                                    accounts: [
                                        {
                                            permission: {
                                                actor: 'miniminimini',
                                                permission: 'active',
                                            },
                                            weight: 3,
                                        },
                                    ],
                                    waits: [
                                        {
                                            wait_sec: 55,
                                            weight: 4,
                                        },
                                    ],
                                },
                            },
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_JuNuwmJm7nLfpxbCqXZMxZoU56TzBh8F5PH7ZyPvQMti6QxJbErDGbKCAaHhoRxwWKzv5kj6kX3WyWys6jAzVe9pDhXB1k',
            },
        },
        {
            description: 'deleteAuth',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio',
                            authorization: [
                                {
                                    actor: 'miniminimini',
                                    permission: 'active',
                                },
                            ],
                            name: 'deleteauth',
                            data: {
                                account: 'maximaximaxi',
                                permission: 'active',
                            },
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_KjPTp8jCtgBKQWqsndhrH4pdCGiks76Q1qBt9e8MtexW6FQg3FzfVFKDU4SvyVDyFs3worn6RyW6WYavw76ACNqcqkCYjf',
            },
        },
        {
            description: 'linkAuth',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio',
                            authorization: [
                                {
                                    actor: 'miniminimini',
                                    permission: 'active',
                                },
                            ],
                            name: 'linkauth',
                            data: {
                                account: 'maximaximaxi',
                                code: 'eosbet',
                                type: 'whatever',
                                requirement: 'active',
                            },
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_Kgs3JdLNqTyGz7uyNiuYLK8sy5qhVQWozrBY7bJWKsjrWAxNyDQUKqHsHmTom5rGY21vYdXmCpi4msU6XeMgWvi4bsBxTx',
            },
        },
        {
            description: 'unlinkAuth',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio',
                            authorization: [
                                {
                                    actor: 'miniminimini',
                                    permission: 'active',
                                },
                            ],
                            name: 'unlinkauth',
                            data: {
                                account: 'miniminimini',
                                code: 'eosbet',
                                type: 'whatever',
                            },
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_K1ioB5KMRC2mmTwYsGwsFU51ENp1XdSBUrb4bxUCLYhoq7Y733WaLZ4Soq9fdrkaJS8uJ3R7Z1ZjyEKRHU8HU4s4MA86zB',
            },
        },
        {
            description: 'newAccount',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio',
                            authorization: [
                                {
                                    actor: 'miniminimini',
                                    permission: 'active',
                                },
                            ],
                            name: 'newaccount',
                            data: {
                                creator: 'miniminimini',
                                name: 'maximaximaxi',
                                owner: {
                                    threshold: 1,
                                    keys: [
                                        {
                                            key: 'EOS8Dkj827FpinZBGmhTM28B85H9eXiFH5XzvLoeukCJV5sKfLc6K',
                                            weight: 1,
                                        },
                                    ],
                                    accounts: [],
                                    waits: [],
                                },
                                active: {
                                    threshold: 1,
                                    keys: [
                                        {
                                            key: 'EOS8Dkj827FpinZBGmhTM28B85H9eXiFH5XzvLoeukCJV5sKfLc6K',
                                            weight: 1,
                                        },
                                    ],
                                    accounts: [],
                                    waits: [],
                                },
                            },
                        },
                        {
                            account: 'eosio',
                            name: 'buyrambytes',
                            authorization: [{ actor: 'miniminimini', permission: 'active' }],
                            data: {
                                payer: 'miniminimini',
                                receiver: 'maximaximaxi',
                                bytes: 4096,
                            },
                        },
                        {
                            account: 'eosio',
                            name: 'delegatebw',
                            authorization: [{ actor: 'miniminimini', permission: 'active' }],
                            data: {
                                from: 'miniminimini',
                                receiver: 'maximaximaxi',
                                stake_net_quantity: '1.0000 EOS',
                                stake_cpu_quantity: '1.0000 EOS',
                                transfer: true,
                            },
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_KhjdS1gKUHR4jKbN3YSdNbPbEqnUVM1Nt6ybdzEAwsUtfbCRJDwpQwPRuEau48CyvhYC5fKo5BiWMPQJbQPrg5ErHThieU',
            },
        },
        {
            description: 'setContract',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-06-19T13:29:53',
                        refBlockNum: 30587,
                        refBlockPrefix: 338239089,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'eosio1',
                            name: 'setcode',
                            authorization: [{ actor: 'ednazztokens', permission: 'active' }],
                            data: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                        },
                        {
                            account: 'eosio1',
                            name: 'setabi',
                            authorization: [{ actor: 'ednazztokens', permission: 'active' }],
                            data: '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_KiG8c8t2SQkSfrEbD9BwJoYT133BPFLx3gu8sAzJadXyFk1EXKYAsgx4tkjt79G6ofuaQzJPAfDqy1FSpgLRbhbeFH9omd',
            },
        },
        {
            description: 'unknown',
            params: {
                path: "m/44'/194'/0'/0/0",
                transaction: {
                    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
                    header: {
                        expiration: '2018-07-14T10:43:28',
                        refBlockNum: 6439,
                        refBlockPrefix: 2995713264,
                        maxNetUsageWords: 0,
                        maxCpuUsageMs: 0,
                        delaySec: 0,
                    },
                    actions: [
                        {
                            account: 'foocontract',
                            name: 'baraction',
                            authorization: [{ actor: 'miniminimini', permission: 'active' }],
                            data: 'deadbeef',
                        },
                    ],
                },
            },
            result: {
                signature:
                    'SIG_K1_JvoJtrHpQJjHAZzEBhiQm75iimYabcAVNDvz8mkempLh6avSJgnXm5JzCCUEBjDtW3syByfXknmgr93Sw3P9RNLnwySmv6',
            },
        },
    ].map(fixture => ({ ...fixture, legacyResults })),
};
