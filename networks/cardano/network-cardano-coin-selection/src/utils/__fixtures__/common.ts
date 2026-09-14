const utxo1 = {
    address: 'addr1',
    txHash: 'hash1',
    outputIndex: 0,
    amount: [
        {
            unit: 'lovelace',
            quantity: '1000000',
        },
    ],
};

const utxo2 = {
    address: 'addr1',
    txHash: 'hash1',
    outputIndex: 0,
    amount: [
        {
            unit: 'lovelace',
            quantity: '1000000',
        },
        {
            unit: 'token1',
            quantity: '1000000',
        },
    ],
};

const utxo3 = {
    address: 'addr1',
    txHash: 'hash1',
    outputIndex: 0,
    amount: [
        {
            unit: 'lovelace',
            quantity: '1000000',
        },
        {
            unit: 'token2',
            quantity: '1000000',
        },
    ],
};

export const filterUtxos = [
    {
        description: 'filter lovelace',
        utxos: [utxo1, utxo2, utxo3],
        asset: 'lovelace',
        result: [utxo1, utxo2, utxo3],
    },
    {
        description: 'filter token1',
        utxos: [utxo1, utxo2, utxo3],
        asset: 'token1',
        result: [utxo2],
    },
    {
        description: 'filter token2',
        utxos: [utxo1, utxo2, utxo3],
        asset: 'token2',
        result: [utxo3],
    },
    {
        description: 'filter non existent token',
        utxos: [utxo1, utxo2, utxo3],
        asset: 'token3',
        result: [],
    },
];

export const buildTxOutput = [
    {
        description: 'Byron address output',
        output: {
            address:
                '37btjrVyb4KDXBNC4haBVPCrro8AQPHwvCMp3RFhhSVWwfFmZ6wwzSK6JK1hY6wHNmtrpTf1kdbva8TCneM2YsiXT7mrzT21EacHnPpz5YyUdj64na',
            amount: '5000000',
            assets: [],
            setMax: false,
        },
        dummyAddress:
            'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
        asset: 'lovelace',
        result: {
            address:
                '37btjrVyb4KDXBNC4haBVPCrro8AQPHwvCMp3RFhhSVWwfFmZ6wwzSK6JK1hY6wHNmtrpTf1kdbva8TCneM2YsiXT7mrzT21EacHnPpz5YyUdj64na',
            amount: '5000000',
            assets: [],
        },
    },
    {
        description: 'Shelley address output with same policy assets',
        output: {
            address:
                'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
            amount: '5000000',
            assets: [
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
            ],
            setMax: false,
        },
        dummyAddress:
            'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
        asset: 'lovelace',
        result: {
            address:
                'addr1qya0nkzrf04gmcpu66vdt7sudwptnyg5df6475y7jhtt2wc44vzmgrfy6wwf69xlaszdslksw8evveyykw4c82eavq7sx29tlc',
            amount: '5000000',
            assets: [
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
            ],
        },
    },
];

export const orderInputs = [
    {
        description: 'reorder inputs to match order in txbody',
        inputsToOrder: [
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
        txBodyHex:
            'a4008282582006227a5ee5640d26224470ad195c82941bfa49386a85149c09c465c4edb0edc0008258209ed3ef581f545f2143eca490d7f20a511100add747bb3d651cc2aa5815f77b1d010182825839013af9d8434bea8de03cd698d5fa1c6b82b991146a755f509e95d6b53b15ab05b40d24d39c9d14dfec04d87ed071f2c66484b3ab83ab3d603d821a0012050ca1581c9a9693a9a37912a5097918f97918d15240c92ab729a0b7c4aa144d77a14653554e4441451b00000001524ba55882583901f8a4be8308c12b910252b6fd6ee4a98730300009382becc049a6e618476aacdafaf01e68c2f072270f078c9689da6139eba4b309e1d5615f1a009865cd021a0002b175031a03f7e7bf',
        result: [
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
    },
];
