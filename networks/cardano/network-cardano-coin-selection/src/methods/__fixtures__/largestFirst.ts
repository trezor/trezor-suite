import {
    changeAddress,
    setMaxAdaInputs,
    utxo1,
    utxo2,
    utxo3,
    utxo4,
    utxo5,
    utxo6,
    utxo7,
    utxo8,
} from '../../__fixtures__/constants';
import {
    CardanoDRepType,
    type Certificate,
    type CertificateVoteDelegation,
} from '../../types/types';

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
        utxos: [utxo1],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '2000000',
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
            totalSpent: '2171177',
            fee: '171177',
        },
    },
    {
        description: 'Non-final compose: token amount not filled',
        utxos: [utxo1],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: undefined,
                assets: [
                    {
                        unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                        quantity: '0',
                    },
                ],
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
            totalSpent: '1307873',
            fee: '170033',
        },
    },
];

export const coinSelection = [
    {
        description: 'send max ada only utxos',
        utxos: setMaxAdaInputs,
        outputs: [
            {
                address:
                    'addr_test1qr9tax9jxzt05y65m8xanngng36mh7hpf23jy53xwyd9y5qj922xhxkn6twlq2wn4q50q352annk3903tj00h45mgfms0kcepv',
                amount: undefined,
                assets: [],
                setMax: true,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'd507c8f866691bd96e131334c355188b1a1d0b2fa0ab11545075aab332d77d9eb19657ad13ee581b56b0f8d744d66ca356b93d42fe176b3de007d53e9c4c4e7a',
        ttl: 66578367,
        options: {},
        result: {
            totalSpent: '5222414726',
            fee: '176985',
            tx: {
                body: 'a400d9010288825820d6de3f33c3b421167eb1726c48129990ec16512dd829ad2239751ba49773b30c02825820d6de3f33c3b421167eb1726c48129990ec16512dd829ad2239751ba49773b30c05825820d6de3f33c3b421167eb1726c48129990ec16512dd829ad2239751ba49773b30c08825820d6de3f33c3b421167eb1726c48129990ec16512dd829ad2239751ba49773b30c0b825820d6de3f33c3b421167eb1726c48129990ec16512dd829ad2239751ba49773b30c0e825820d6de3f33c3b421167eb1726c48129990ec16512dd829ad2239751ba49773b30c11825820d6de3f33c3b421167eb1726c48129990ec16512dd829ad2239751ba49773b30c15825820d6de3f33c3b421167eb1726c48129990ec16512dd829ad2239751ba49773b30c16018182583900cabe98b23096fa1354d9cdd9cd134475bbfae14aa3225226711a5250122a946b9ad3d2ddf029d3a828f0468aece76895f15c9efbd69b42771b000000013745062d021a0002b359031a03f7e7bf',
                hash: '7ec409e0d2e14769547cf3911f6d9faf3f7411327926baa26154f39508e6956c',
                size: 487,
            },
            inputs: setMaxAdaInputs,
            outputs: [
                {
                    address:
                        'addr_test1qr9tax9jxzt05y65m8xanngng36mh7hpf23jy53xwyd9y5qj922xhxkn6twlq2wn4q50q352annk3903tj00h45mgfms0kcepv',
                    amount: '5222237741',
                    assets: [],
                },
            ],
        },
    },
    {
        description: 'send max sundae',
        utxos: [
            {
                address:
                    'addr1qy4xpnf4lk560dgrds5zsunh6xdssg94c5sc8dqdclcn2fdl85agr52j3ffkwzq2yasu59ccwvfj39kel85ng3u7lhlq4e4m4l',
                txHash: '9ed3ef581f545f2143eca490d7f20a511100add747bb3d651cc2aa5815f77b1d',
                outputIndex: 1,
                amount: [
                    {
                        quantity: '1344974',
                        unit: 'lovelace',
                    },
                    {
                        quantity: '5675656536',
                        unit: '9a9693a9a37912a5097918f97918d15240c92ab729a0b7c4aa144d7753554e444145',
                    },
                ],
            },
            {
                address:
                    'addr1q860vxljhadqxnrrsr2j6yxnwpdkyquq74lmghx502aj0r28d2kd47hsre5v9urjyu8s0ryk38dxzw0t5jesncw4v90sp0878u',
                txHash: '06227a5ee5640d26224470ad195c82941bfa49386a85149c09c465c4edb0edc0',
                outputIndex: 0,
                amount: [
                    {
                        quantity: '10000000',
                        unit: 'lovelace',
                    },
                ],
            },
        ],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '1344798',
                assets: [
                    {
                        unit: '9a9693a9a37912a5097918f97918d15240c92ab729a0b7c4aa144d7753554e444145',
                        quantity: '5675656536',
                    },
                ],
                setMax: true,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        ttl: 66578367,
        options: {},
        result: {
            totalSpent: '1357705',
            fee: '176765',
            tx: {
                body: 'a400d901028282582006227a5ee5640d26224470ad195c82941bfa49386a85149c09c465c4edb0edc0008258209ed3ef581f545f2143eca490d7f20a511100add747bb3d651cc2aa5815f77b1d010182825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d821a0012050ca1581c9a9693a9a37912a5097918f97918d15240c92ab729a0b7c4aa144d77a14653554e4441451b00000001524ba55882583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a009864c5021a0002b27d031a03f7e7bf',
                hash: 'ce3aa8b670058ac029ad30cb572598f4c35ae3e67199b94ec1cf1654127b0dcf',
                size: 482,
            },
            inputs: [
                {
                    address:
                        'addr1q860vxljhadqxnrrsr2j6yxnwpdkyquq74lmghx502aj0r28d2kd47hsre5v9urjyu8s0ryk38dxzw0t5jesncw4v90sp0878u',
                    txHash: '06227a5ee5640d26224470ad195c82941bfa49386a85149c09c465c4edb0edc0',
                    outputIndex: 0,
                    amount: [
                        {
                            quantity: '10000000',
                            unit: 'lovelace',
                        },
                    ],
                },
                {
                    address:
                        'addr1qy4xpnf4lk560dgrds5zsunh6xdssg94c5sc8dqdclcn2fdl85agr52j3ffkwzq2yasu59ccwvfj39kel85ng3u7lhlq4e4m4l',
                    txHash: '9ed3ef581f545f2143eca490d7f20a511100add747bb3d651cc2aa5815f77b1d',
                    outputIndex: 1,
                    amount: [
                        {
                            quantity: '1344974',
                            unit: 'lovelace',
                        },
                        {
                            quantity: '5675656536',
                            unit: '9a9693a9a37912a5097918f97918d15240c92ab729a0b7c4aa144d7753554e444145',
                        },
                    ],
                },
            ],
            outputs: [
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '1180940',
                    assets: [
                        {
                            quantity: '5675656536',
                            unit: '9a9693a9a37912a5097918f97918d15240c92ab729a0b7c4aa144d7753554e444145',
                        },
                    ],
                    setMax: true,
                },
                {
                    address: changeAddress,
                    amount: '9987269',
                    assets: [],
                },
            ],
        },
    },

    {
        description: '1 ADA only utxo, 1 output, no change (dust burned as fee)',
        utxos: [utxo1],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '4820000',
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
            totalSpent: '5000000',
            fee: '180000',
            inputs: [utxo1],
            outputs: [
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '4820000',
                    assets: [],
                    setMax: false,
                },
            ],
            ttl: 123456789,
            tx: {
                body: 'a400d90102818258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d000181825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d1a00498c20021a0002bf20031a075bcd15',
                hash: '055d468ab5f751e4a807372a92b2c82b7d6ed4508e3cc49f5550f1e28a904751',
                size: 231,
            },
        },
    },
    {
        description: 'Prefer utxo with largest asset (token) value',
        utxos: [utxo2, utxo6],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: undefined,
                assets: [
                    {
                        unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                        quantity: '50',
                    },
                ],
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
            totalSpent: '1315527',
            tx: {
                body: 'a300d90102818258209e63fddf20cb7b5472e2c9a1bb4bbe3112b8f2b22e45bc441206bcddde5c58a0070182825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d821a00116d86a1581c02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7aa14447524943183282583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f821a0028f639a2581c02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7aa1444752494319079e581cc6207cbbc916fa3bbb4b91cc7789c7d7ddfb84264fa76f7ee627a9d8a1401864021a0002a541',
                hash: 'fe7f5393044fbf142d10cc74ff7c630a76ca0d554c453f91ac9e933cb6be622d',
                size: 405,
            },
            fee: '173377',
            ttl: undefined,
            inputs: [utxo6],
            outputs: [
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '1142150',
                    assets: [
                        {
                            unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                            quantity: '50',
                        },
                    ],
                    setMax: false,
                },
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '2684473',
                    assets: [
                        {
                            unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                            quantity: '1950',
                        },
                        {
                            quantity: '100',
                            unit: 'c6207cbbc916fa3bbb4b91cc7789c7d7ddfb84264fa76f7ee627a9d8',
                        },
                    ],
                },
            ],
        },
    },
    {
        description: '_maxTokensPerOutput=1 creates 2 changes',
        utxos: [utxo2, utxo8],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: undefined,
                assets: [
                    {
                        unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                        quantity: '50',
                    },
                ],
                setMax: false,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: { _maxTokensPerOutput: 1 },
        result: {
            tx: {
                body: 'a300d90102828258209e63fddf20cb7b5472e2c9a1bb4bbe3112b8f2b22e45bc441206bcddde5c58a0018258209e63fddf20cb7b5472e2c9a1bb4bbe3112b8f2b22e45bc441206bcddde5c58a0070183825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d821a00116d86a1581c02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7aa14447524943183282583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f821a00117e5ca1581c02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7aa14447524943190b8682583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f821a00452ce9a1581cc6207cbbc916fa3bbb4b91cc7789c7d7ddfb84264fa76f7ee627a9d8a1401864021a0002b6f5',
                hash: 'f450b09570c608269a680d244b3c52821b6da3b6c45557a5cc718c403856b0dc',
                size: 508,
            },
            totalSpent: '1320059',
            fee: '177909',
            inputs: [utxo2, utxo8],
            outputs: [
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '1142150',
                    assets: [
                        {
                            unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                            quantity: '50',
                        },
                    ],
                    setMax: false,
                },
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '1146460',
                    assets: [
                        {
                            unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                            quantity: '2950',
                        },
                    ],
                },
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '4533481',
                    assets: [
                        {
                            quantity: '100',
                            unit: 'c6207cbbc916fa3bbb4b91cc7789c7d7ddfb84264fa76f7ee627a9d8',
                        },
                    ],
                },
            ],
        },
    },
    {
        description:
            '2 ADA utxos (2 ADA, 1 ADA), needs both in order to return change and not to burn it as unnecessarily high fee',
        utxos: [utxo4, utxo5],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '1000000',
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
            tx: {
                body: 'a300d90102828258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d038258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d040182825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d1a000f424082583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a001becd3021a000297ad',
                hash: '62f300ab828a6414c37ca91abdf661b1ffe88bbfd61603acf1b8874164286e8b',
                size: 326,
            },
            totalSpent: '1169901',
            fee: '169901',
            inputs: [utxo4, utxo5],
            outputs: [
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '1000000',
                    assets: [],
                    setMax: false,
                },
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '1830099',
                    assets: [],
                },
            ],
        },
    },
    {
        description: '1 ADA only utxo, 1 output + change (custom fee param A=0)',
        utxos: [utxo1],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '3000000',
                assets: [],
                setMax: false,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: { feeParams: { a: '0' } },
        result: {
            tx: {
                body: 'a300d90102818258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d000182825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d1a002dc6c082583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a001c258b021a00025ef5',
                hash: '66a743f7275683799070935d33932319f82467be2eb4bea5b33ab36aaa15c8d6',
                size: 290,
            },
            totalSpent: '3155381',
            fee: '155381', // since we set cost per byte to 0, the tx cost wll be equal to fee param B
            inputs: [utxo1],
            outputs: [
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '3000000',
                    assets: [],
                    setMax: false,
                },
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '1844619',
                    assets: [],
                },
            ],
        },
    },
    {
        description: 'set max on ADA output, no change',
        utxos: [utxo1, utxo3],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: undefined,
                assets: [],
                setMax: true,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            tx: {
                body: 'a300d90102828258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d008258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d020181825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d1a00e2553f021a00028c81',
                hash: 'c00afada3a077ccf79bc4cf3b9b3613f6b8cda19409fe984be696e38188c7cfa',
                size: 261,
            },
            max: '14832959',
            totalSpent: '15000000',
            fee: '167041',
            inputs: [utxo1, utxo3],
            outputs: [
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '14832959',
                    assets: [],
                    setMax: true,
                },
            ],
        },
    },
    {
        description: 'set max on ADA output, assets returned',
        utxos: [utxo1, utxo2],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: undefined,
                assets: [],
                setMax: true,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            tx: {
                body: 'a300d90102828258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d008258209e63fddf20cb7b5472e2c9a1bb4bbe3112b8f2b22e45bc441206bcddde5c58a0010182825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d1a0084796b82583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f821a00117e5ca1581c02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7aa144475249431903e8021a00029eb9',
                hash: '9f458c1293fec11c82addef7319e69816d90aeb5dd8aadc051109f929f498497',
                size: 367,
            },
            max: '8681835',
            totalSpent: '8853540', // plus 1344798 in change output = 10000000
            fee: '171705',
            inputs: [utxo1, utxo2],
            outputs: [
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '8681835',
                    assets: [],
                    setMax: true,
                },
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '1146460',
                    assets: [
                        {
                            quantity: '1000',
                            unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                        },
                    ],
                },
            ],
        },
    },
    {
        description: 'set max on ADA output, multiple outputs, assets returned',
        utxos: [utxo1, utxo2],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '1000000',
                assets: [],
                setMax: false,
            },
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: undefined,
                assets: [],
                setMax: true,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            tx: {
                body: 'a300d90102828258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d008258209e63fddf20cb7b5472e2c9a1bb4bbe3112b8f2b22e45bc441206bcddde5c58a0010183825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d1a000f4240825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d1a00752bff82583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f821a00117e5ca1581c02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7aa144475249431903e8021a0002a9e5',
                hash: 'c5a511df10142ce8c189164143bde1472f1df48a82f4818dd9f82786c2ce841f',
                size: 432,
            },
            max: '7678975',
            totalSpent: '8853540', // plus 1146460 in change output = 10000000
            fee: '174565',
            inputs: [utxo1, utxo2],
            outputs: [
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '1000000',
                    assets: [],
                    setMax: false,
                },
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '7678975',
                    assets: [],
                    setMax: true,
                },
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '1146460',
                    assets: [
                        {
                            quantity: '1000',
                            unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                        },
                    ],
                },
            ],
        },
    },
    {
        description: 'set max on token output',
        utxos: [utxo1, utxo7],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: undefined,
                assets: [
                    {
                        quantity: '',
                        unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                    },
                ],
                setMax: true,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            tx: {
                body: 'a300d90102828258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d008258209e63fddf20cb7b5472e2c9a1bb4bbe3112b8f2b22e45bc441206bcddde5c58a0080182825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d821a00117e5ca1581c02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7aa144475249431903e882583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a004db1fb021a00029eb9',
                hash: '9f1a8906f54674180707eef5d42bfcf9e0baea67b6ce730e974022175bb823bb',
                size: 367,
            },
            max: '1000',
            totalSpent: '1318165', // plus amount in change output = 6410000
            fee: '171705',
            inputs: [utxo1, utxo7],
            outputs: [
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '1146460',
                    assets: [
                        {
                            quantity: '1000',
                            unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                        },
                    ],
                    setMax: true,
                },
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '5091835',
                    assets: [],
                },
            ],
        },
    },
    {
        description: 'withdrawing rewards: 1 ADA only utxo, 1 change output',
        utxos: [utxo1],
        outputs: [],
        changeAddress,
        certificates: [],
        withdrawals: [
            {
                amount: '10000000',
                stakingPath: "m/1852'/1815'/0'/2/0",
                stakeAddress: 'stake1u8yk3dcuj8yylwvnzz953yups6mmuvt0vtjmxl2gmgceqjqz2yfd2',
            },
        ],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            tx: {
                body: 'a400d90102818258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d00018182583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a00e2438b021a00029e3505a1581de1c968b71c91c84fb993108b48938186b7be316f62e5b37d48da3190481a00989680',
                hash: '1b252c5dad4cdf492bec64c76936d0ac8e8c9c4b4a06c3fd908c2c3bf2797aef',
                size: 364,
            },
            totalSpent: '171573',
            fee: '171573',
            inputs: [utxo1],
            outputs: [
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '14828427',
                    assets: [],
                },
            ],
        },
    },
    {
        description: 'withdrawing rewards: 1 ADA only utxo, 1 change output, vote drep keyhash',
        utxos: [utxo1],
        outputs: [],
        changeAddress,
        certificates: [
            {
                type: 9,
                dRep: {
                    type: 0, // keyhash
                    keyHash: '4519f294d80b0fcc6697bde8f36629be8ebf9527be023fe73673f1a9',
                },
            } as CertificateVoteDelegation,
        ],
        withdrawals: [
            {
                amount: '10000000',
                stakingPath: "m/1852'/1815'/0'/2/0",
                stakeAddress: 'stake1u8yk3dcuj8yylwvnzz953yups6mmuvt0vtjmxl2gmgceqjqz2yfd2',
            },
        ],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            tx: {
                body: 'a500d90102818258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d00018182583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a00e225fb021a0002bbc504d901028183098200581cfb52d3055a3a3a3238ce219a3fc13fe4d8797d5062e8dd4670c7d29b8200581c4519f294d80b0fcc6697bde8f36629be8ebf9527be023fe73673f1a905a1581de1c968b71c91c84fb993108b48938186b7be316f62e5b37d48da3190481a00989680',
                hash: '8a3a95b836262421593b301c131edf9075adf4ec9d9aa4ef7b738f77da892ad3',
                size: 536,
            },
            totalSpent: '179141',
            fee: '179141',
            deposit: '0',
            inputs: [utxo1],
            outputs: [
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '14820859',
                    assets: [],
                },
            ],
        },
    },
    {
        description:
            'withdrawing rewards: 1 ADA only utxo, 1 change output, vote delegation abstain',
        utxos: [utxo1],
        outputs: [],
        changeAddress,
        certificates: [
            {
                type: 9,
                dRep: {
                    type: 2, // abstain
                },
            } as CertificateVoteDelegation,
        ],
        withdrawals: [
            {
                amount: '10000000',
                stakingPath: "m/1852'/1815'/0'/2/0",
                stakeAddress: 'stake1u8yk3dcuj8yylwvnzz953yups6mmuvt0vtjmxl2gmgceqjqz2yfd2',
            },
        ],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            tx: {
                body: 'a500d90102818258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d00018182583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a00e22b23021a0002b69d04d901028183098200581cfb52d3055a3a3a3238ce219a3fc13fe4d8797d5062e8dd4670c7d29b810205a1581de1c968b71c91c84fb993108b48938186b7be316f62e5b37d48da3190481a00989680',
                hash: '03e9fc7cf58569d36d5e3bd61a5d588121e2a13818ad29920b17dfe186a9bc5b',
                size: 506,
            },
            totalSpent: '177821',
            fee: '177821',
            deposit: '0',
            inputs: [utxo1],
            outputs: [
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '14822179',
                    assets: [],
                },
            ],
        },
    },
    {
        description:
            'withdrawing rewards: 1 ADA only utxo, 1 change output, vote delegation drep id',
        utxos: [utxo1],
        outputs: [],
        changeAddress,
        certificates: [
            {
                type: 9,
                dRep: {
                    type: CardanoDRepType.KEY_HASH,
                    keyHash: '3a7f09d3df4cf66a7399c2b05bfa234d5a29560c311fc5db4c490711',
                },
            } as CertificateVoteDelegation,
        ],
        withdrawals: [
            {
                amount: '10000000',
                stakingPath: "m/1852'/1815'/0'/2/0",
                stakeAddress: 'stake1u8yk3dcuj8yylwvnzz953yups6mmuvt0vtjmxl2gmgceqjqz2yfd2',
            },
        ],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            tx: {
                body: 'a500d90102818258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d00018182583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a00e225fb021a0002bbc504d901028183098200581cfb52d3055a3a3a3238ce219a3fc13fe4d8797d5062e8dd4670c7d29b8200581c3a7f09d3df4cf66a7399c2b05bfa234d5a29560c311fc5db4c49071105a1581de1c968b71c91c84fb993108b48938186b7be316f62e5b37d48da3190481a00989680',
                hash: '761e3e27851f05504dc58a792a47681fe97e6defaea637fddd485c0b468789b9',
                size: 536,
            },
            totalSpent: '179141',
            fee: '179141',
            deposit: '0',
            inputs: [utxo1],
            outputs: [
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '14820859',
                    assets: [],
                },
            ],
        },
    },
    {
        description: 'withdrawing rewards: multiple utxos, multiple withdrawals, 1 change output',
        utxos: [utxo1, utxo2],
        outputs: [],
        changeAddress,
        certificates: [],
        withdrawals: [
            {
                amount: '10000000',
                stakingPath: "m/1852'/1815'/0'/2/0",
                stakeAddress: 'stake1u8yk3dcuj8yylwvnzz953yups6mmuvt0vtjmxl2gmgceqjqz2yfd2',
            },
            {
                amount: '10000000',
                stakingPath: "m/1852'/1815'/1'/2/0",
                stakeAddress: 'stake1u8yk3dcuj8yylwvnzz953yups6mmuvt0vtjmxl2gmgceqjqz2yfd2',
            },
        ],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            tx: {
                body: 'a400d90102818258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d00018182583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a017ada0b021a00029e3505a1581de1c968b71c91c84fb993108b48938186b7be316f62e5b37d48da3190481a00989680',
                hash: '796c2a23b17593c090d2b6b343cdf14dedd1eb417c9a5b583567e44b52ed2888',
                size: 364,
            },
            totalSpent: '171573',
            fee: '171573',
            inputs: [utxo1],
            outputs: [
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '24828427',
                    assets: [],
                },
            ],
        },
    },
    {
        description: 'stake registration',
        utxos: [utxo1],
        outputs: [],
        changeAddress,
        certificates: [
            {
                type: 0,
            },
        ] as Certificate[],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            tx: {
                body: 'a400d90102818258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d00018182583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a002b39bb021a00028d0504d901028182008200581cfb52d3055a3a3a3238ce219a3fc13fe4d8797d5062e8dd4670c7d29b',
                hash: '981b99d39e65e2697ab277c8dabf39a779a862480e2e214d5d55251ba6d94f52',
                size: 264,
            },
            totalSpent: '2167173',
            fee: '167173',
            inputs: [utxo1],
            outputs: [
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '2832827',
                    assets: [],
                },
            ],
        },
    },
    {
        description: 'stake delegation',
        utxos: [utxo1],
        outputs: [],
        changeAddress,
        certificates: [
            {
                type: 2 as const,

                pool: '0f292fcaa02b8b2f9b3c8f9fd8e0bb21abedb692a6d5058df3ef2735',
            },
        ] as Certificate[],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            tx: {
                body: 'a400d90102818258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d00018182583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a0049a7b7021a0002a38904d901028183028200581cfb52d3055a3a3a3238ce219a3fc13fe4d8797d5062e8dd4670c7d29b581c0f292fcaa02b8b2f9b3c8f9fd8e0bb21abedb692a6d5058df3ef2735',
                hash: '37717824e17580f9a47b4753cedd8ae74d0ada1290087a4cca038faa2979a70e',
                size: 395,
            },
            totalSpent: '172937',
            fee: '172937',
            inputs: [utxo1],
            outputs: [
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '4827063',
                    assets: [],
                },
            ],
        },
    },
    {
        description: 'stake deregistration',
        utxos: [utxo1],
        outputs: [],
        changeAddress,
        certificates: [
            {
                type: 1,
            },
        ] as Certificate[],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            tx: {
                body: 'a400d90102818258203c388acb799a37a4f1cc99bec7626637b0b80626b9ef7c7a687282cab701178d00018182583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a0068315f021a00029e6104d901028182018200581cfb52d3055a3a3a3238ce219a3fc13fe4d8797d5062e8dd4670c7d29b',
                hash: 'bdfac46c16d64db6e5952cc9a579660394ff8cb2386678dd635fbf8243fa89c4',
                size: 365,
            },
            totalSpent: '171617',
            fee: '171617',
            inputs: [utxo1],
            outputs: [
                {
                    isChange: true,
                    address: changeAddress,
                    amount: '6828383',
                    assets: [],
                },
            ],
        },
    },
    {
        description:
            'multiple utxos (including multi asset), 2 user defined outputs (ADA only) + 1 change output (with an asset)',
        utxos: [
            {
                address:
                    'addr1q9vf2uqwv9cx23rsfeqqa4g9rv8s2ha464sycdwpzdhm7ana9nxu0t6xjurg0qqcwwdulh56uglsp8z2uw9wuzjtfuaqka2l2d',
                txHash: '1bfb8b1d06bd28fb33493afaa5b22dec02bb8e292bbd7a6965c9037b5964a808',
                outputIndex: 1,
                amount: [
                    {
                        quantity: '3831173306',
                        unit: 'lovelace',
                    },
                    {
                        quantity: '998900',
                        unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                    },
                ],
            },
            {
                address:
                    'addr1qydd8kf2vtzv05y703kvsq0tcrgnwynqemxkp7rw4nwnq2ma9nxu0t6xjurg0qqcwwdulh56uglsp8z2uw9wuzjtfuaqqdz40d',
                txHash: '064ebc7096680b94de4e1c014938ea44886829c08ec01025578104b7b60d6bcf',
                outputIndex: 1,
                amount: [
                    {
                        quantity: '848035104',
                        unit: 'lovelace',
                    },
                ],
            },
            {
                address:
                    'addr1q80vvrk4syazwl6w706ah9rgzvr5heq6hq2tjqxxu3x8wnma9nxu0t6xjurg0qqcwwdulh56uglsp8z2uw9wuzjtfuaqvmacgp',
                txHash: 'd49c08164d3f2abc1a2e1b16a2c81122240a99bb6bd2f8d33628048df7529adc',
                outputIndex: 1,
                amount: [
                    {
                        quantity: '1180285694',
                        unit: 'lovelace',
                    },
                ],
            },
            {
                address:
                    'addr1q984228shp7a6m0xrj39k7uuvcpsqt2dkjn8r6lvrpnmdfna9nxu0t6xjurg0qqcwwdulh56uglsp8z2uw9wuzjtfuaq77p62n',
                txHash: 'ca0bad48270c5345bbcce7a850f545be5582a780d5a0337385d1b7413dfc60e3',
                outputIndex: 0,
                amount: [
                    {
                        quantity: '2000000',
                        unit: 'lovelace',
                    },
                ],
            },
        ],
        outputs: [
            {
                address:
                    'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                amount: '1000000',
                assets: [],
                setMax: false,
            },
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
        options: {},
        result: {
            tx: {
                body: 'a300d90102818258201bfb8b1d06bd28fb33493afaa5b22dec02bb8e292bbd7a6965c9037b5964a808010183825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d1a000f4240825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d1a001e848082583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f821ae42aa5eda1581c02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7aa144475249431a000f3df4021a0002a40d',
                hash: '458c3316af1e157a1d5576f381bbff2dc26af3c6ea9c87b951b08777255699d3',
                size: 398,
            },
            totalSpent: '3173069',
            fee: '173069',
            inputs: [
                {
                    address:
                        'addr1q9vf2uqwv9cx23rsfeqqa4g9rv8s2ha464sycdwpzdhm7ana9nxu0t6xjurg0qqcwwdulh56uglsp8z2uw9wuzjtfuaqka2l2d',
                    txHash: '1bfb8b1d06bd28fb33493afaa5b22dec02bb8e292bbd7a6965c9037b5964a808',
                    outputIndex: 1,
                    amount: [
                        {
                            quantity: '3831173306',
                            unit: 'lovelace',
                        },
                        {
                            quantity: '998900',
                            unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                        },
                    ],
                },
            ],
            outputs: [
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '1000000',
                    assets: [],
                    setMax: false,
                },
                {
                    address:
                        'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
                    amount: '2000000',
                    assets: [],
                    setMax: false,
                },
                {
                    amount: '3828000237',
                    isChange: true,
                    address: changeAddress,
                    assets: [
                        {
                            unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                            quantity: '998900',
                        },
                    ],
                },
            ],
        },
    },
    {
        description: 'Correctly recalculate change output after set max on token',
        utxos: [
            {
                address:
                    'addr_test1qzhts48qcr2s76qcrh4rvwwah5xc52g7fr4xtzfzq9ffxme9j9xney949w6u957hfn5r7gmlh789208l4g9cal4m9p3qyt8vq9',
                txHash: 'd8ff7a39d1daf80ae2e99351c51fbb823f223e717cee09d23bc1b2691092632d',
                outputIndex: 0,
                amount: [
                    {
                        quantity: '1344798',
                        unit: 'lovelace',
                    },
                    {
                        quantity: '1',
                        unit: '3b746b6a5f8c43acc6bed9259ff7fc5f0b9e0be8adc3d63edfea98c77072657373757265',
                    },
                ],
            },
            {
                address:
                    'addr_test1qq6r7mgs3q42n8ja7sf9wkn747lnttke2zx7khdrc5a2e4p9j9xney949w6u957hfn5r7gmlh789208l4g9cal4m9p3q83lu76',
                txHash: '280c49a69c0fc24c3fdcdbcdd4030da3533a87e4378639bcd4a8841b3d2c6e21',
                outputIndex: 2,
                amount: [
                    {
                        quantity: '1344798',
                        unit: 'lovelace',
                    },
                ],
            },
            {
                address:
                    'addr_test1qzhts48qcr2s76qcrh4rvwwah5xc52g7fr4xtzfzq9ffxme9j9xney949w6u957hfn5r7gmlh789208l4g9cal4m9p3qyt8vq9',
                txHash: '05cf0d8c9824b6e1bf403329d159cc57d89b4c22d93835bbdee46687f7c69c69',
                outputIndex: 0,
                amount: [
                    {
                        quantity: '1344798',
                        unit: 'lovelace',
                    },
                    {
                        quantity: '1',
                        unit: '4f740e06506c0b8a1584760780ce3c61aea3b6061d5596d580e9aae66265726e617264',
                    },
                ],
            },
        ],
        outputs: [
            {
                address:
                    'addr_test1qztq45fff6e84v0qctnzpg86lny8zf7nx0lmn47p3msk5tvw8qpyux7tm435rjuk5dqr6kny4ks9w7vqjnfrsvtjk82quqe75s',
                assets: [
                    {
                        unit: '3b746b6a5f8c43acc6bed9259ff7fc5f0b9e0be8adc3d63edfea98c77072657373757265',
                        quantity: '1',
                    },
                ],
                setMax: false,
            },
            {
                address:
                    'addr_test1qztq45fff6e84v0qctnzpg86lny8zf7nx0lmn47p3msk5tvw8qpyux7tm435rjuk5dqr6kny4ks9w7vqjnfrsvtjk82quqe75s',
                assets: [
                    {
                        unit: '4f740e06506c0b8a1584760780ce3c61aea3b6061d5596d580e9aae66265726e617264',
                        quantity: '',
                    },
                ],
                setMax: true,
            },
        ],
        changeAddress,
        certificates: [],
        withdrawals: [],
        accountPubKey:
            'ec8fdf616242f430855ad7477acda53395eb30c295f5a7ef038712578877375b5a2f00353c9c5cc88c7ff18e71dc08724d90fc238213b789c0b02438e336be07',
        options: {},
        result: {
            tx: {
                body: 'a300d901028382582005cf0d8c9824b6e1bf403329d159cc57d89b4c22d93835bbdee46687f7c69c6900825820280c49a69c0fc24c3fdcdbcdd4030da3533a87e4378639bcd4a8841b3d2c6e2102825820d8ff7a39d1daf80ae2e99351c51fbb823f223e717cee09d23bc1b2691092632d00018382583900960ad1294eb27ab1e0c2e620a0fafcc87127d333ffb9d7c18ee16a2d8e38024e1bcbdd6341cb96a3403d5a64ada057798094d2383172b1d4821a0011a008a1581c3b746b6a5f8c43acc6bed9259ff7fc5f0b9e0be8adc3d63edfea98c7a14870726573737572650182583900960ad1294eb27ab1e0c2e620a0fafcc87127d333ffb9d7c18ee16a2d8e38024e1bcbdd6341cb96a3403d5a64ada057798094d2383172b1d4821a00118f32a1581c4f740e06506c0b8a1584760780ce3c61aea3b6061d5596d580e9aae6a1476265726e6172640182583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a0017971f021a0002c901',
                hash: '439134fd244df14ce5c2b0e17f5b6a73b51f850ed617e9b15439dbe917e37a97',
                size: 613,
            },
            totalSpent: '2488379',
            fee: '182529',
            inputs: [
                {
                    address:
                        'addr_test1qzhts48qcr2s76qcrh4rvwwah5xc52g7fr4xtzfzq9ffxme9j9xney949w6u957hfn5r7gmlh789208l4g9cal4m9p3qyt8vq9',
                    txHash: '05cf0d8c9824b6e1bf403329d159cc57d89b4c22d93835bbdee46687f7c69c69',
                    outputIndex: 0,
                    amount: [
                        {
                            quantity: '1344798',
                            unit: 'lovelace',
                        },
                        {
                            quantity: '1',
                            unit: '4f740e06506c0b8a1584760780ce3c61aea3b6061d5596d580e9aae66265726e617264',
                        },
                    ],
                },
                {
                    address:
                        'addr_test1qq6r7mgs3q42n8ja7sf9wkn747lnttke2zx7khdrc5a2e4p9j9xney949w6u957hfn5r7gmlh789208l4g9cal4m9p3q83lu76',
                    txHash: '280c49a69c0fc24c3fdcdbcdd4030da3533a87e4378639bcd4a8841b3d2c6e21',
                    outputIndex: 2,
                    amount: [
                        {
                            quantity: '1344798',
                            unit: 'lovelace',
                        },
                    ],
                },
                {
                    address:
                        'addr_test1qzhts48qcr2s76qcrh4rvwwah5xc52g7fr4xtzfzq9ffxme9j9xney949w6u957hfn5r7gmlh789208l4g9cal4m9p3qyt8vq9',
                    txHash: 'd8ff7a39d1daf80ae2e99351c51fbb823f223e717cee09d23bc1b2691092632d',
                    outputIndex: 0,
                    amount: [
                        {
                            quantity: '1344798',
                            unit: 'lovelace',
                        },
                        {
                            quantity: '1',
                            unit: '3b746b6a5f8c43acc6bed9259ff7fc5f0b9e0be8adc3d63edfea98c77072657373757265',
                        },
                    ],
                },
            ],
            outputs: [
                {
                    address:
                        'addr_test1qztq45fff6e84v0qctnzpg86lny8zf7nx0lmn47p3msk5tvw8qpyux7tm435rjuk5dqr6kny4ks9w7vqjnfrsvtjk82quqe75s',
                    amount: '1155080',
                    assets: [
                        {
                            quantity: '1',
                            unit: '3b746b6a5f8c43acc6bed9259ff7fc5f0b9e0be8adc3d63edfea98c77072657373757265',
                        },
                    ],
                    setMax: false,
                },
                {
                    address:
                        'addr_test1qztq45fff6e84v0qctnzpg86lny8zf7nx0lmn47p3msk5tvw8qpyux7tm435rjuk5dqr6kny4ks9w7vqjnfrsvtjk82quqe75s',
                    amount: '1150770',
                    assets: [
                        {
                            quantity: '1',
                            unit: '4f740e06506c0b8a1584760780ce3c61aea3b6061d5596d580e9aae66265726e617264',
                        },
                    ],
                    setMax: true,
                },
                {
                    address:
                        'addr1q8u2f05rprqjhygz22m06mhy4xrnqvqqpyuzhmxqfxnwvxz8d2kd47hsre5v9urjyu8s0ryk38dxzw0t5jesncw4v90s22tk0f',
                    amount: '1546015',
                    assets: [],
                    isChange: true,
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
    {
        description: 'Computed max output amount is lower than minUtxoVal',
        // utxos: 3.344443 ADA, outputs: 1 ADA + 1.443 ADA in change output + fee. This leaves less than 1 ADA which would be set as "max"
        utxos: [
            {
                address:
                    'addr1q860vxljhadqxnrrsr2j6yxnwpdkyquq74lmghx502aj0r28d2kd47hsre5v9urjyu8s0ryk38dxzw0t5jesncw4v90sp0878u',
                txHash: 'b5d1abd05c1eb0564a34c5daa4a71185aa11568c375ab7f946da889ebcb23a01',
                outputIndex: 1,
                amount: [
                    {
                        quantity: '1900000',
                        unit: 'lovelace',
                    },
                    {
                        quantity: '90',
                        unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                    },
                ],
            },
            {
                address:
                    'addr1q860vxljhadqxnrrsr2j6yxnwpdkyquq74lmghx502aj0r28d2kd47hsre5v9urjyu8s0ryk38dxzw0t5jesncw4v90sp0878u',
                txHash: 'b5d1abd05c1eb0564a34c5daa4a71185aa11568c375ab7f946da889ebcb23a01',
                outputIndex: 0,
                amount: [
                    {
                        quantity: '1344798',
                        unit: 'lovelace',
                    },
                    {
                        quantity: '10',
                        unit: '02477d7c23b4c2834b0be8ca8578dde47af0cc82a964688f6fc95a7a47524943',
                    },
                ],
            },
        ],
        outputs: [
            {
                address:
                    'addr1q860vxljhadqxnrrsr2j6yxnwpdkyquq74lmghx502aj0r28d2kd47hsre5v9urjyu8s0ryk38dxzw0t5jesncw4v90sp0878u',
                amount: undefined,
                assets: [],
                setMax: true,
            },
            {
                address:
                    'addr1q860vxljhadqxnrrsr2j6yxnwpdkyquq74lmghx502aj0r28d2kd47hsre5v9urjyu8s0ryk38dxzw0t5jesncw4v90sp0878u',
                amount: '1000000',
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
