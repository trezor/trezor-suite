export const outputDecomposition = [
    {
        description: 'maximum outputs from one input',
        outputAmounts: [10000, 6556, 5000, 8100],
        inputs: [
            [
                'account-A',
                'A00000000000000000000000000000000000000000000000000000000000000001000000',
                {
                    confirmedAmountCredentials: [{ value: 30000 }, { value: 0 }],
                    confirmedVsizeCredentials: [{ value: 197 }, { value: 0 }],
                },
            ],
        ],
        roundParameters: {
            miningFeeRate: 2000,
        },
        result: [
            {
                outputs: [
                    {
                        amount: 10086,
                        amountCredentials: [{ value: 10086 }, { value: 0 }],
                        vsizeCredentials: [{ value: 43 }, { value: 0 }],
                    },
                    {
                        amount: 8186,
                        amountCredentials: [{ value: 8186 }, { value: 0 }],
                        vsizeCredentials: [{ value: 43 }, { value: 0 }],
                    },
                    {
                        amount: 6642,
                        amountCredentials: [{ value: 6642 }, { value: 0 }],
                        vsizeCredentials: [{ value: 43 }, { value: 0 }],
                    },
                    {
                        amount: 5086,
                        amountCredentials: [{ value: 5086 }, { value: 0 }],
                        vsizeCredentials: [{ value: 43 }, { value: 0 }],
                    },
                ],
            },
        ],
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
                    confirmedAmountCredentials: [{ value: 5000 }, { value: 0 }],
                    confirmedVsizeCredentials: [{ value: 197 }, { value: 0 }],
                },
            ],
            [
                'account-A',
                'A00000000000000000000000000000000000000000000000000000000000000002000000',
                {
                    confirmedAmountCredentials: [{ value: 5000 }, { value: 0 }],
                    confirmedVsizeCredentials: [{ value: 197 }, { value: 0 }],
                },
            ],
            [
                'account-A',
                'A00000000000000000000000000000000000000000000000000000000000000003000000',
                {
                    confirmedAmountCredentials: [{ value: 5000 }, { value: 0 }],
                    confirmedVsizeCredentials: [{ value: 197 }, { value: 0 }],
                },
            ],
            [
                'account-A',
                'A00000000000000000000000000000000000000000000000000000000000000004000000',
                {
                    confirmedAmountCredentials: [{ value: 5000 }, { value: 0 }],
                    confirmedVsizeCredentials: [{ value: 197 }, { value: 0 }],
                },
            ],
        ],
        roundParameters: {
            miningFeeRate: 2000,
        },
        result: [
            {
                outputs: [
                    {
                        amount: 19086,
                        amountCredentials: [{ value: 19086 }, { value: 0 }],
                        vsizeCredentials: [{ value: 43 }, { value: 0 }],
                    },
                ],
            },
        ],
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
                    confirmedAmountCredentials: [{ value: 10000 }, { value: 0 }],
                    confirmedVsizeCredentials: [{ value: 197 }, { value: 0 }],
                },
            ],
            [
                'account-A',
                'A00000000000000000000000000000000000000000000000000000000000000002000000',
                {
                    confirmedAmountCredentials: [{ value: 10000 }, { value: 0 }],
                    confirmedVsizeCredentials: [{ value: 197 }, { value: 0 }],
                },
            ],
            [
                'account-B',
                'B00000000000000000000000000000000000000000000000000000000000000001000000',
                {
                    confirmedAmountCredentials: [{ value: 10000 }, { value: 0 }],
                    confirmedVsizeCredentials: [{ value: 197 }, { value: 0 }],
                },
            ],
        ],
        roundParameters: {
            miningFeeRate: 2000,
            maxAmountCredentialValue: 10000,
        },
        result: [
            {
                accountKey: 'account-A',
                outputs: [
                    {
                        amount: 5086,
                        amountCredentials: [{ value: 5086 }, { value: 0 }],
                        vsizeCredentials: [{ value: 43 }, { value: 0 }],
                    },
                ],
            },
            {
                accountKey: 'account-B',
                outputs: [
                    {
                        amount: 5086,
                        amountCredentials: [{ value: 5086 }, { value: 0 }],
                        vsizeCredentials: [{ value: 43 }, { value: 0 }],
                    },
                ],
            },
        ],
        credentialIssuanceCalls: 2, // called 2 times, once for each account
    },
];
