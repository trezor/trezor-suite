export const getChangeAddressParameters = [
    {
        description: "Get account's change address in changeAddressParameters format",
        account: {
            deviceState: 'ms1TJk4b4s7aisyL3jfrkCqwznttWwiS4r@B9B340D0982492AF536AEFDF:1',
            index: 0,
            path: "m/1852'/1815'/0'",
            descriptor:
                'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
            key: 'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07-ada-ms1TJk4b4s7aisyL3jfrkCqwznttWwiS4r@B9B340D0982492AF536AEFDF:1',
            accountType: 'normal',
            symbol: 'ada',
            empty: false,
            visible: true,
            balance: '4164104124',
            availableBalance: '4164104124',
            formattedBalance: '4164.104124',
            tokens: [],
            networkType: 'cardano',
            addresses: {
                used: [
                    {
                        address:
                            'addr1qq0w6pmkt9khgfud806ycw50zm7gvzkhlf0gpperulsrelhm2tfs2k368ger3n3pngluz0lympuh65rzarw5vux862dskal4js',
                        path: "m/1852'/1815'/0'/0/0",
                        transfers: 6,
                        received: '1003000000',
                        sent: '1003000000',
                    },
                ],
                unused: [
                    {
                        address:
                            'addr1qq2zpf6lqjs0lm0y624qv3a4j3w9x9ynaf5hkx8yqwgxl30m2tfs2k368ger3n3pngluz0lympuh65rzarw5vux862ds83yr28',
                        path: "m/1852'/1815'/0'/0/6",
                        transfers: 0,
                        received: '0',
                        sent: '0',
                    },
                ],
                change: [
                    {
                        address:
                            'addr1qq43pzxxgfdvffrw5jnrej9840nuylaykv7uzcy56t02xv8m2tfs2k368ger3n3pngluz0lympuh65rzarw5vux862dszv2e9w',
                        path: "m/1852'/1815'/0'/1/0",
                        transfers: 30,
                        received: '10',
                        sent: '10',
                    },
                    {
                        address:
                            'addr1qpqz745252wmrd2gmttze7njgguzgrp2dk3e8756u7xdwxlm2tfs2k368ger3n3pngluz0lympuh65rzarw5vux862dscg0wdp',
                        path: "m/1852'/1815'/0'/1/1",
                        transfers: 0,
                        received: '0',
                        sent: '0',
                    },
                ],
            },
            utxo: [],
        },
        result: {
            address:
                'addr1qpqz745252wmrd2gmttze7njgguzgrp2dk3e8756u7xdwxlm2tfs2k368ger3n3pngluz0lympuh65rzarw5vux862dscg0wdp',
            addressParameters: {
                addressType: 0,
                path: "m/1852'/1815'/0'/1/1",
                stakingPath: "m/1852'/1815'/0'/2/0",
            },
        },
    },
];

export const transformUserOutputs = [
    {
        description: 'precompose output with no amount',
        accountTokens: [],
        symbol: 'ada',
        outputs: [
            {
                type: 'payment',
                address:
                    'addr1qruhh37yvr86py46p8z23t2ca53pdng580tnju3vwyhuhtzr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeqc5gfcl',
                amount: '',
                fiat: '',
                currency: {
                    value: 'usd',
                    label: 'USD',
                },
                token: null,
                label: '',
            },
        ],
        result: [
            {
                address:
                    'addr1qruhh37yvr86py46p8z23t2ca53pdng580tnju3vwyhuhtzr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeqc5gfcl',
                amount: undefined,
                assets: [],
                setMax: false,
            },
        ],
    },
    {
        description: 'precompose output with no address',
        accountTokens: [],
        symbol: 'ada',
        outputs: [
            {
                type: 'payment',
                address: '',
                amount: '2',
                fiat: '',
                currency: {
                    value: 'usd',
                    label: 'USD',
                },
                token: null,
                label: '',
            },
        ],
        result: [{ address: undefined, amount: '2000000', assets: [], setMax: false }],
    },
    {
        description: '2 complete outputs + 1 setMax output (with token)',
        accountTokens: [
            {
                unit: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652243484f43',
                quantity: '100',
                decimals: 0,
            },
        ],
        symbol: 'ada',
        outputs: [
            {
                type: 'payment',
                address:
                    'addr1qruhh37yvr86py46p8z23t2ca53pdng580tnju3vwyhuhtzr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeqc5gfcl',
                amount: '2',
                fiat: '',
                currency: {
                    value: 'usd',
                    label: 'USD',
                },
                token: null,
                label: '',
            },
            {
                type: 'payment',
                address:
                    'addr1qrpxkw0m95e3slw9lu8ly4uf7ah6v75z0e5zcg5k56n7a45fsj4ymj5xysk9ycxa99gna6vk7u0df4dkm453d5gatp3spmhpt3',
                amount: '',
                fiat: '',
                currency: {
                    value: 'usd',
                    label: 'USD',
                },
                token: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652243484f43',
                label: '',
            },
            {
                type: 'payment',
                address:
                    'addr1qruhh37yvr86py46p8z23t2ca53pdng580tnju3vwyhuhtzr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeqc5gfcl',
                amount: '4',
                fiat: '',
                currency: {
                    value: 'usd',
                    label: 'USD',
                },
                token: null,
                label: '',
            },
        ],
        maxOutputIndex: 1,
        result: [
            {
                address:
                    'addr1qruhh37yvr86py46p8z23t2ca53pdng580tnju3vwyhuhtzr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeqc5gfcl',
                amount: '2000000',
                assets: [],
                setMax: false,
            },
            {
                address:
                    'addr1qrpxkw0m95e3slw9lu8ly4uf7ah6v75z0e5zcg5k56n7a45fsj4ymj5xysk9ycxa99gna6vk7u0df4dkm453d5gatp3spmhpt3',
                amount: undefined,
                assets: [
                    {
                        quantity: '0',
                        unit: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652243484f43',
                    },
                ],
                setMax: true,
            },
            {
                address:
                    'addr1qruhh37yvr86py46p8z23t2ca53pdng580tnju3vwyhuhtzr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeqc5gfcl',
                amount: '4000000',
                assets: [],
                setMax: false,
            },
        ],
    },
];

export const formatMaxOutputAmount = [
    {
        description: 'lovelace',
        maxAmount: '2000000',
        maxOutput: {
            address:
                'addr1qrpxkw0m95e3slw9lu8ly4uf7ah6v75z0e5zcg5k56n7a45fsj4ymj5xysk9ycxa99gna6vk7u0df4dkm453d5gatp3spmhpt3',
            amount: '',
            setMax: true,
            assets: [],
        },
        account: {
            symbol: 'ada',
            tokens: [
                {
                    contract: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652243484f43',
                    balance: '500000',
                    decimals: 5,
                    name: 'asset1pwhywk7x54g739z3dqs245q62yu47vjh8gapjv',
                    symbol: 'NUTS',
                    type: 'BLOCKFROST',
                },
            ],
        },
        result: '2',
    },
    {
        description: 'token',
        maxAmount: '2000000',
        maxOutput: {
            address:
                'addr1qrpxkw0m95e3slw9lu8ly4uf7ah6v75z0e5zcg5k56n7a45fsj4ymj5xysk9ycxa99gna6vk7u0df4dkm453d5gatp3spmhpt3',
            amount: undefined,
            setMax: true,
            assets: [
                {
                    unit: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652243484f43',
                    quantity: '',
                },
            ],
        },
        account: {
            symbol: 'ada',
            tokens: [
                {
                    contract: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652243484f43',
                    balance: '500000',
                    decimals: 5,
                    name: 'asset1pwhywk7x54g739z3dqs245q62yu47vjh8gapjv',
                    symbol: 'NUTS',
                    type: 'BLOCKFROST',
                },
            ],
        },
        result: '20',
    },
];

export const transformUtxos = [
    {
        description: 'basic',
        utxo: [
            {
                address:
                    'addr1qruhh37yvr86py46p8z23t2ca53pdng580tnju3vwyhuhtzr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeqc5gfcl',
                txid: '52e4557caec03a1678b2ad5490fbb6b100d41eec59e20d48d26718b8d4246534',
                confirmations: 47058,
                blockHeight: 3190801,
                amount: '2000000',
                vout: 0,
                path: "m/1852'/1815'/1'/0/2",
                cardanoSpecific: {
                    unit: 'lovelace',
                },
            },
        ],
        result: [
            {
                address:
                    'addr1qruhh37yvr86py46p8z23t2ca53pdng580tnju3vwyhuhtzr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeqc5gfcl',
                txHash: '52e4557caec03a1678b2ad5490fbb6b100d41eec59e20d48d26718b8d4246534',
                outputIndex: 0,
                amount: [
                    {
                        quantity: '2000000',
                        unit: 'lovelace',
                    },
                ],
            },
        ],
    },
    {
        description: 'multi asset utxo',
        utxo: [
            {
                address:
                    'addr1qry2nvhtcm79r7tleklteyqfcytg0xn6j77qcxvuf6ehhcjr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeq9d9x4h',
                txid: 'afa26bb01765a79ddc7fd02548702fb0012b77ef3f239e98a3e92dc4c0cfad1f',
                confirmations: 46756,
                blockHeight: 3191103,
                amount: '1661535',
                vout: 1,
                path: "m/1852'/1815'/1'/1/0",
                cardanoSpecific: {
                    unit: 'lovelace',
                },
            },
            {
                address:
                    'addr1qry2nvhtcm79r7tleklteyqfcytg0xn6j77qcxvuf6ehhcjr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeq9d9x4h',
                txid: 'afa26bb01765a79ddc7fd02548702fb0012b77ef3f239e98a3e92dc4c0cfad1f',
                confirmations: 46756,
                blockHeight: 3191103,
                amount: '1',
                vout: 1,
                path: "m/1852'/1815'/1'/1/0",
                cardanoSpecific: {
                    unit: '6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7',
                },
            },
            {
                address:
                    'addr1qry2nvhtcm79r7tleklteyqfcytg0xn6j77qcxvuf6ehhcjr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeq9d9x4h',
                txid: 'afa26bb01765a79ddc7fd02548702fb0012b77ef3f239e98a3e92dc4c0cfad1f',
                confirmations: 46756,
                blockHeight: 3191103,
                amount: '1000000',
                vout: 2, // different vout than previous utxo
                path: "m/1852'/1815'/1'/1/0",
                cardanoSpecific: {
                    unit: 'lovelace',
                },
            },
        ],
        result: [
            {
                address:
                    'addr1qry2nvhtcm79r7tleklteyqfcytg0xn6j77qcxvuf6ehhcjr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeq9d9x4h',
                txHash: 'afa26bb01765a79ddc7fd02548702fb0012b77ef3f239e98a3e92dc4c0cfad1f',
                outputIndex: 1,
                amount: [
                    {
                        quantity: '1661535',
                        unit: 'lovelace',
                    },
                    {
                        quantity: '1',
                        unit: '6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7',
                    },
                ],
            },
            {
                address:
                    'addr1qry2nvhtcm79r7tleklteyqfcytg0xn6j77qcxvuf6ehhcjr29tz874v5a6mz95tn6gxt5887lrvnfudhwttxkdexaeq9d9x4h',
                txHash: 'afa26bb01765a79ddc7fd02548702fb0012b77ef3f239e98a3e92dc4c0cfad1f',
                outputIndex: 2,
                amount: [
                    {
                        quantity: '1000000',
                        unit: 'lovelace',
                    },
                ],
            },
        ],
    },
];

export const prepareCertificates = [
    {
        description: 'stake registration + delegation',
        certificates: [
            {
                type: 0,
                path: "m/1852'/1815'/8'/2/0",
            },
            {
                type: 2,
                path: "m/1852'/1815'/8'/2/0",
                pool: '26b17b78de4f035dc0bfce60d1d3c3a8085c38dcce5fb8767e518bed',
            },
        ],
        result: [
            {
                type: 0,
            },
            {
                type: 2,
                pool: '26b17b78de4f035dc0bfce60d1d3c3a8085c38dcce5fb8767e518bed',
            },
        ],
    },
    {
        description: 'stake deregistration (not used, just for the coverage)',
        certificates: [
            {
                type: 1,
                path: "m/1852'/1815'/8'/2/0",
            },
        ],
        result: [
            {
                type: 1,
            },
        ],
    },
];

export const parseAsset = [
    {
        description: 'asset with name',
        hex: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652243484f43',
        result: {
            assetNameInHex: '43484f43', // CHOC
            policyId: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf3916522',
        },
    },
    {
        description: 'asset without name',
        hex: '6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7',
        result: {
            assetNameInHex: '',
            policyId: '6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7',
        },
    },
];

export const isPoolOverSaturated = [
    {
        description: 'missing data',
        pool: {
            hex: 'abc',
            bech32: 'pool1abc',
        },
        additionalStake: undefined,
        result: false,
    },
    {
        description: 'not saturated',
        pool: {
            hex: 'abc',
            bech32: 'pool1abc',
            live_stake: '0',
            saturation: '60000000',
        },
        additionalStake: undefined,
        result: false,
    },
    {
        description: 'not saturated',
        pool: {
            hex: 'abc',
            bech32: 'pool1abc',
            live_stake: '10000000',
            saturation: '60000000',
        },
        additionalStake: undefined,
        result: false,
    },
    {
        description: 'oversaturation',
        // 83 % saturation
        pool: {
            hex: 'abc',
            bech32: 'pool1abc',
            live_stake: '50000000',
            saturation: '60000000',
        },
        additionalStake: undefined,
        result: true,
    },
    {
        description: 'over the top oversaturation',
        pool: {
            hex: 'abc',
            bech32: 'pool1abc',
            live_stake: '70000000',
            saturation: '60000000',
        },
        additionalStake: undefined,
        result: true,
    },
    {
        description: "balance can't cause oversaturation",
        pool: {
            hex: 'abc',
            bech32: 'pool1abc',
            live_stake: '30000000',
            saturation: '60000000',
        },
        additionalStake: '10000000',
        // 66 % including balance
        result: false,
    },
    {
        description: 'balance would cause oversaturation',
        // 83 % saturation
        pool: {
            hex: 'abc',
            bech32: 'pool1abc',
            live_stake: '40000000',
            saturation: '60000000',
        },
        additionalStake: '10000000',
        result: true,
    },
];

export const getStakePoolForDelegation = [
    {
        description: 'should pick "next" pool',
        trezorPools: {
            next: {
                hex: 'a',
                bech32: 'pool1a',
                live_stake: '40000000',
                saturation: '60000000',
            },
            pools: [
                {
                    hex: 'abc',
                    bech32: 'pool1abc',
                    live_stake: '0',
                    saturation: '60000000',
                },
                {
                    hex: 'a',
                    bech32: 'pool1a',
                    live_stake: '40000000',
                    saturation: '60000000',
                },
                {
                    hex: 'b',
                    bech32: 'pool1a',
                    live_stake: '50000000',
                    saturation: '60000000',
                },
            ],
        },
        accountBalance: '0',
        result: {
            hex: 'a',
            bech32: 'pool1a',
            live_stake: '40000000',
            saturation: '60000000',
        },
    },
    {
        description: 'should pick pool a',
        trezorPools: {
            next: {
                hex: 'a',
                bech32: 'pool1a',
                live_stake: '40000000',
                saturation: '60000000',
            },
            pools: [
                {
                    hex: 'a',
                    bech32: 'pool1a',
                    live_stake: '40000000',
                    saturation: '60000000',
                },
                {
                    hex: 'abc',
                    bech32: 'pool1abc',
                    live_stake: '10000000',
                    saturation: '60000000',
                },
                {
                    hex: 'b',
                    bech32: 'pool1a',
                    live_stake: '50000000',
                    saturation: '60000000',
                },
            ],
        },
        accountBalance: '10000000',
        result: {
            hex: 'a',
            bech32: 'pool1a',
            live_stake: '40000000',
            saturation: '60000000',
        },
    },
];
export const getDelegationCertificates = [
    {
        description: 'without registration',
        stakingPath: 'path',
        poolHex: 'abc',
        shouldRegister: false,
        result: [
            {
                path: 'path',
                pool: 'abc',
                type: 2,
            },
        ],
    },
    {
        description: 'withowithut registration',
        stakingPath: 'path',
        poolHex: 'abc',
        shouldRegister: true,
        result: [
            {
                type: 0,
            },
            {
                path: 'path',
                pool: 'abc',
                type: 2,
            },
        ],
    },
];
