import {
    changeAddress,
    utxo1,
    utxo2,
    utxo3,
    utxo4,
    utxo5,
    utxo6,
    utxo7,
} from '../../__fixtures__/constants';

const UTXO_REAL_SAME_POLICY = [
    {
        address:
            'addr_test1qr9jx7pnujcap2chn8zg8gag6nwu00xu6hdd7vv9jc03py0m2tfs2k368ger3n3pngluz0lympuh65rzarw5vux862dse9kvf2',
        txHash: '20fd6b27a14ae743a868a1d46f6b484dc8bd886b4644fc96fdcdcf500a52ae92',
        outputIndex: 0,
        amount: [
            {
                quantity: '1344798',
                unit: 'lovelace',
            },
            {
                quantity: '100',
                unit: '21c3e7f6f954e606fe90017628b048a0067b561a4f6e2aa0e1aa613156616375756d73',
            },
        ],
    },
    {
        address:
            'addr_test1qr7x37496r3nfc0zmrhc87mu5rtgtmm666ead6r2p840nchm2tfs2k368ger3n3pngluz0lympuh65rzarw5vux862ds9hrc73',
        txHash: 'aa2083985bdcc7dc3847703c400146a322881087ad4b1369992f4a74c0bdc098',
        outputIndex: 0,
        amount: [
            {
                quantity: '1758582',
                unit: 'lovelace',
            },
            {
                quantity: '5000',
                unit: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652243484f43',
            },
            {
                quantity: '10000',
                unit: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf39165224d494e54',
            },
            {
                quantity: '1000000',
                unit: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf3916522534245525259',
            },
            {
                quantity: '20000',
                unit: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652256414e494c',
            },
            {
                quantity: '100000',
                unit: '769c4c6e9bc3ba5406b9b89fb7beb6819e638ff2e2de63f008d5bcff744e45574d',
            },
        ],
    },
    {
        address:
            'addr_test1qq43pzxxgfdvffrw6jnrej9840nuylaykv7uzcy56t02xv8m2tfs2k368ger3n3pngluz0lympuh65rzarw5vux862dszv2e9w',
        txHash: 'e46395fe22896fae4627b21a0343a3d56c2a8a5ca470897ba66ffe675b7212d2',
        outputIndex: 1,
        amount: [
            {
                quantity: '699567638',
                unit: 'lovelace',
            },
            {
                quantity: '1',
                unit: '6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7',
            },
        ],
    },
];

const restrictedUtxoSet = [
    {
        address:
            'addr_test1qq7ajtmfdg0um0ha4e6wgqu33fddfxejxuvj2yfnyz2w3kgle6svh9nacvm632nmcy6fnw9sq85tqkvhagfrhkj9tf6s6jql6l',
        txHash: 'cb0cef9f464523a599f8355d2f241147f70dc2f5d559e670910a122053f1538a',
        outputIndex: 2,
        amount: [
            {
                quantity: '1500000',
                unit: 'lovelace',
            },
        ],
    },
    {
        address:
            'addr_test1qq7ajtmfdg0um0ha4e6wgqu33fddfxejxuvj2yfnyz2w3kgle6svh9nacvm632nmcy6fnw9sq85tqkvhagfrhkj9tf6s6jql6l',
        txHash: 'cb0cef9f464523a599f8355d2f241147f70dc2f5d559e670910a122053f1538a',
        outputIndex: 3,
        amount: [
            {
                quantity: '1300000',
                unit: 'lovelace',
            },
        ],
    },
];

export const nonFinalCompose = [
    {
        description: 'Non-final compose: amount not filled',
        utxos: [utxo1],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: undefined,
                assets: [],
                setMax: false,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            totalSpent: '168317',
            fee: '168317',
        },
    },
    {
        description: 'Non-final compose: address not filled',
        utxos: [utxo1],
        outputs: [
            {
                address: undefined,
                amount: '2000000',
                assets: [],
                setMax: false,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            totalSpent: '2168317',
            fee: '168317',
        },
    },
    {
        description: 'Non-final compose, 2 outputs, 1 amount not filled',
        utxos: [utxo1, utxo2],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '6000000',
                assets: [],
                setMax: false,
            },
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: undefined,
                assets: [],
                setMax: false,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            totalSpent: '6174565',
            fee: '174565',
        },
    },
];

export const coinSelection = [
    {
        description:
            '2 ADA utxos (2 ADA, 1 ADA), needs both in order to return change and not to burn it as unnecessarily high fee',
        utxos: [utxo1, utxo2, utxo3, utxo4, utxo5, utxo6, utxo7],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '7000000',
                assets: [],
                setMax: false,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        ttl: 123456789,
        options: {},
        result: {
            ttl: 123456789,
            // non-deterministic, we rely on sanity check
        },
    },
    {
        description:
            'Use all utxos to cover outputs, 80000 will be burned as fee because utxos would not cover minUtxoValue for a change output',
        utxos: restrictedUtxoSet,
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '2000000',
                assets: [],
                setMax: false,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        ttl: undefined,
        options: {},
        result: {
            totalSpent: '2800000',
            fee: '800000',
            // inputs: restrictedUtxoSet, // order changes
            ttl: undefined,
            outputs: [
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '2000000',
                    assets: [],
                    setMax: false,
                },
            ],
        },
    },
    {
        description:
            'utxo with several assets, some of them with same policy, change consists of assets from both inputs',
        utxos: UTXO_REAL_SAME_POLICY,
        outputs: [
            {
                address:
                    'addr_test1qrv7wa7pj64zthr93ysq6vux5d0spwq0lhfm3wkql77nedxutyh2y8w6cyp6xkwy3fc4zn2p4ceffkc27wz562jx9vyqga7nl9',
                amount: '1344798',
                assets: [
                    {
                        unit: '21c3e7f6f954e606fe90017628b048a0067b561a4f6e2aa0e1aa613156616375756d73',
                        quantity: '2',
                    },
                ],
                setMax: false,
            },
            {
                address:
                    'addr_test1qrv7wa7pj64zthr93ysq6vux5d0spwq0lhfm3wkql77nedxutyh2y8w6cyp6xkwy3fc4zn2p4ceffkc27wz562jx9vyqga7nl9',
                amount: '1344798',
                assets: [
                    {
                        unit: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652243484f43',
                        quantity: '2',
                    },
                ],
                setMax: false,
            },
        ],
        changeAddress:
            'addr_test1qq43pzxxgfdvffrw6jnrej9840nuylaykv7uzcy56t02xv8m2tfs2k368ger3n3pngluz0lympuh65rzarw5vux862dszv2e9w',
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            totalSpent: '2884577',
            fee: '194981',
            inputs: UTXO_REAL_SAME_POLICY,
            outputs: [
                // external
                {
                    address:
                        'addr_test1qrv7wa7pj64zthr93ysq6vux5d0spwq0lhfm3wkql77nedxutyh2y8w6cyp6xkwy3fc4zn2p4ceffkc27wz562jx9vyqga7nl9',
                    amount: '1344798',
                    assets: [
                        {
                            unit: '21c3e7f6f954e606fe90017628b048a0067b561a4f6e2aa0e1aa613156616375756d73',
                            quantity: '2',
                        },
                    ],
                    setMax: false,
                },
                // external
                {
                    address:
                        'addr_test1qrv7wa7pj64zthr93ysq6vux5d0spwq0lhfm3wkql77nedxutyh2y8w6cyp6xkwy3fc4zn2p4ceffkc27wz562jx9vyqga7nl9',
                    amount: '1344798',
                    assets: [
                        {
                            unit: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652243484f43',
                            quantity: '2',
                        },
                    ],
                    setMax: false,
                },
                // change
                {
                    isChange: true,
                    amount: '699786441',
                    address:
                        'addr_test1qq43pzxxgfdvffrw6jnrej9840nuylaykv7uzcy56t02xv8m2tfs2k368ger3n3pngluz0lympuh65rzarw5vux862dszv2e9w',
                    assets: [
                        {
                            quantity: '98',
                            unit: '21c3e7f6f954e606fe90017628b048a0067b561a4f6e2aa0e1aa613156616375756d73',
                        },
                        {
                            quantity: '4998',
                            unit: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652243484f43',
                        },
                        {
                            quantity: '10000',
                            unit: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf39165224d494e54',
                        },
                        {
                            quantity: '20000',
                            unit: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf391652256414e494c',
                        },
                        {
                            quantity: '1000000',
                            unit: '57fca08abbaddee36da742a839f7d83a7e1d2419f1507fcbf3916522534245525259',
                        },
                        {
                            quantity: '1',
                            unit: '6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7',
                        },
                        {
                            quantity: '100000',
                            unit: '769c4c6e9bc3ba5406b9b89fb7beb6819e638ff2e2de63f008d5bcff744e45574d',
                        },
                    ],
                },
            ],
        },
    },
];

export const exceptions = [
    {
        description: 'Not enough utxos to cover an output amount',
        utxos: [utxo1],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '10000000',
                assets: [],
                setMax: false,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: 'UTXO_BALANCE_INSUFFICIENT',
    },
    {
        description: 'Number of utxos is less than the number of outputs',
        utxos: [utxo1],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '10000000',
                assets: [],
                setMax: false,
            },
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '20000000',
                assets: [],
                setMax: false,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: 'UTXO_NOT_FRAGMENTED_ENOUGH',
    },
    {
        description: 'Not enough utxos to cover mandatory change output (multi asset utxo)',
        utxos: [utxo2],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '4800000',
                assets: [],
                setMax: false,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: 'UTXO_BALANCE_INSUFFICIENT',
    },
];
