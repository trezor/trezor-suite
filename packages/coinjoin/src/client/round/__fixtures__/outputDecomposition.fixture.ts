export const ACCOUNT = {
    accountKey: 'account-A',
    changeAddresses: new Array(50).fill({
        address: 'bc1pkeah0fx2ex3jc337twlqcm9lh2eusm94j5vw2eshvczku6n7sjwqrfyfj2',
    }),
} as any; // as Account

export const outputDecomposition = [
    {
        description: 'maximum outputs from one input',
        outputAmounts: [10000, 6556, 5000, 8100],
        inputs: [
            [
                'account-A',
                'A00000000000000000000000000000000000000000000000000000000000000001000000',
                {
                    confirmedAmountCredentials: [{ Value: 30000 }, { Value: 0 }],
                    confirmedVsizeCredentials: [{ Value: 197 }, { Value: 0 }],
                },
            ],
        ],
        accounts: [ACCOUNT],
        roundParameters: {
            MiningFeeRate: 2000,
        },
        result: [
            {
                outputs: [
                    {
                        amount: 10086,
                        amountCredentials: [{ Value: 10086 }, { Value: 0 }],
                        vsizeCredentials: [{ Value: 43 }, { Value: 0 }],
                    },
                    {
                        amount: 8186,
                        amountCredentials: [{ Value: 8186 }, { Value: 0 }],
                        vsizeCredentials: [{ Value: 43 }, { Value: 0 }],
                    },
                    {
                        amount: 6642,
                        amountCredentials: [{ Value: 6642 }, { Value: 0 }],
                        vsizeCredentials: [{ Value: 43 }, { Value: 0 }],
                    },
                    {
                        amount: 5086,
                        amountCredentials: [{ Value: 5086 }, { Value: 0 }],
                        vsizeCredentials: [{ Value: 43 }, { Value: 0 }],
                    },
                ],
            },
        ],
        availableVsize: [197],
        credentialIssuanceCalls: 4, // called 4 times to split outputs
    },
    {
        description: 'one output from multiple inputs',
        outputAmounts: [19000],
        inputs: [
            [
                'account-A',
                'A00000000000000000000000000000000000000000000000000000000000000001000000',
                {
                    confirmedAmountCredentials: [{ Value: 5000 }, { Value: 0 }],
                    confirmedVsizeCredentials: [{ Value: 197 }, { Value: 0 }],
                },
            ],
            [
                'account-A',
                'A00000000000000000000000000000000000000000000000000000000000000002000000',
                {
                    confirmedAmountCredentials: [{ Value: 5000 }, { Value: 0 }],
                    confirmedVsizeCredentials: [{ Value: 197 }, { Value: 0 }],
                },
            ],
            [
                'account-A',
                'A00000000000000000000000000000000000000000000000000000000000000003000000',
                {
                    confirmedAmountCredentials: [{ Value: 5000 }, { Value: 0 }],
                    confirmedVsizeCredentials: [{ Value: 197 }, { Value: 0 }],
                },
            ],
            [
                'account-A',
                'A00000000000000000000000000000000000000000000000000000000000000004000000',
                {
                    confirmedAmountCredentials: [{ Value: 5000 }, { Value: 0 }],
                    confirmedVsizeCredentials: [{ Value: 197 }, { Value: 0 }],
                },
            ],
        ],
        accounts: [ACCOUNT],
        roundParameters: {
            MiningFeeRate: 2000,
        },
        result: [
            {
                outputs: [
                    {
                        amount: 19086,
                        amountCredentials: [{ Value: 19086 }, { Value: 0 }],
                        vsizeCredentials: [{ Value: 43 }, { Value: 0 }],
                    },
                ],
            },
        ],
        availableVsize: [788], // 197 * 4
        credentialIssuanceCalls: 3, // called 3 times to join 4 inputs
    },
    {
        description: 'dropping dust on multiple accounts',
        outputAmounts: [5000],
        inputs: [
            [
                'account-A',
                'A00000000000000000000000000000000000000000000000000000000000000001000000',
                {
                    confirmedAmountCredentials: [{ Value: 10000 }, { Value: 0 }],
                    confirmedVsizeCredentials: [{ Value: 197 }, { Value: 0 }],
                },
            ],
            [
                'account-A',
                'A00000000000000000000000000000000000000000000000000000000000000002000000',
                {
                    confirmedAmountCredentials: [{ Value: 10000 }, { Value: 0 }],
                    confirmedVsizeCredentials: [{ Value: 197 }, { Value: 0 }],
                },
            ],
            [
                'account-B',
                'B00000000000000000000000000000000000000000000000000000000000000001000000',
                {
                    confirmedAmountCredentials: [{ Value: 10000 }, { Value: 0 }],
                    confirmedVsizeCredentials: [{ Value: 197 }, { Value: 0 }],
                },
            ],
        ],
        accounts: [ACCOUNT, { ...ACCOUNT, accountKey: 'account-B' }],
        roundParameters: {
            MiningFeeRate: 2000,
            MaxAmountCredentialValue: 10000,
        },
        result: [
            {
                accountKey: 'account-A',
                outputs: [
                    {
                        amount: 5086,
                        amountCredentials: [{ Value: 5086 }, { Value: 0 }],
                        vsizeCredentials: [{ Value: 43 }, { Value: 0 }],
                    },
                ],
            },
            {
                accountKey: 'account-B',
                outputs: [
                    {
                        amount: 5086,
                        amountCredentials: [{ Value: 5086 }, { Value: 0 }],
                        vsizeCredentials: [{ Value: 43 }, { Value: 0 }],
                    },
                ],
            },
        ],
        availableVsize: [394, 197], // 197 * 2 (account-A), 197 (account-B)
        credentialIssuanceCalls: 2, // called 2 times, once for each account
    },
    {
        description: 'availableVsize limited by changeAddresses',
        outputAmounts: [20000],
        inputs: [
            [
                'account-A',
                'A00000000000000000000000000000000000000000000000000000000000000001000000',
                {
                    confirmedAmountCredentials: [{ Value: 30000 }, { Value: 0 }],
                    confirmedVsizeCredentials: [{ Value: 197 }, { Value: 0 }],
                },
            ],
        ],
        accounts: [{ ...ACCOUNT, changeAddresses: [{ address: '1' }] }],
        roundParameters: {
            MiningFeeRate: 2000,
        },
        result: [
            {
                outputs: [
                    {
                        amount: 20086,
                        amountCredentials: [{ Value: 20086 }, { Value: 0 }],
                        vsizeCredentials: [{ Value: 43 }, { Value: 0 }],
                    },
                ],
            },
        ],
        availableVsize: [43], // availableVsize is limited because only 1 change address is available
        credentialIssuanceCalls: 1,
    },
];
