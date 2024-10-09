export const transformTxFixtures = [
    {
        description:
            'should transform transaction data, omit "from", and convert units correctly 1',
        tx: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            from: '0xCe66A9577F4e2589c1D1547B75B7A2b0807cE0ed',
            gasLimit: 416102,
            to: '0xAFA848357154a6a624686b348303EF9a13F63264',
            value: '122222000000000000',
        },
        gasPrice: '50',
        nonce: '26',
        chainId: 1,
        result: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            gasLimit: '0x65966',
            gasPrice: '0xba43b7400',
            nonce: '0x1a',
            chainId: 1,
            to: '0xAFA848357154a6a624686b348303EF9a13F63264',
            value: '0x1b23842edbce000',
        },
    },
    {
        description:
            'should transform transaction data, omit "from", and convert units correctly 2',
        tx: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            from: '0xCe66A9577F4e2589c1D1547B75B7A2b0807cE0ed',
            gasLimit: 300000,
            to: '0xAFA848357154a6a624686b348303EF9a13F63264',
            value: '10000',
        },
        gasPrice: '1',
        nonce: '1',
        chainId: 1,
        result: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            gasLimit: '0x493e0',
            gasPrice: '0x3b9aca00',
            nonce: '0x1',
            chainId: 1,
            to: '0xAFA848357154a6a624686b348303EF9a13F63264',
            value: '0x2710',
        },
    },
];

export const getUnstakingAmountFixtures = [
    {
        description: 'should correctly extract and convert the unstaking amount from ethereum data',
        ethereumData: '76ec871c0000000000000000000000000000000000000000000000000000000000000001', // without 0x
        expectedAmountWei: '1', // 0.000000000000000001 eth
    },
    {
        description: 'should correctly remove 0x prefix from ethereum data',
        ethereumData: '0x76ec871c0000000000000000000000000000000000000000000000000000000000000001', // with 0x
        expectedAmountWei: '1', // 0.000000000000000001 eth
    },
];

export const stakeFixture = [
    {
        description: 'should stake 0.1 eth, expect correct transaction object with correct values',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.1', // eth
            symbol: 'eth',
            identity: '0',
        },
        estimatedFee: {
            success: true,
            payload: {
                levels: [{ feeLimit: '21000' }],
            },
        },
        result: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            gasLimit: 241000, // 21000 + 220000 (reserve)
            to: '0xD523794C879D9eC028960a231F866758e405bE34',
            value: '100000000000000000', // wei
        },
    },
    {
        description: 'should return correct gasLimit when fee estimation is 0',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.1', // eth
            symbol: 'eth',
            identity: '0',
        },
        estimatedFee: {
            success: true,
            payload: {
                levels: [{ feeLimit: '0' }],
            },
        },
        result: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            gasLimit: 220000, // GAS_RESERVE = 220000
            to: '0xD523794C879D9eC028960a231F866758e405bE34',
            value: '100000000000000000', // wei
        },
    },
];

export const stakeFailedFixture = [
    {
        description: 'should throw an error when amount is less than minimum',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.000000000000000001', // less than minimum
            symbol: 'eth',
            identity: '0',
        },
        estimatedFee: {
            success: true,
            payload: {
                levels: [{ feeLimit: '21000' }],
            },
        },
        result: 'Min Amount 0.1 ETH',
    },
    {
        description: 'should throw an error when fee estimation is failed',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.1',
            symbol: 'eth',
            identity: '0',
        },
        estimatedFee: {
            success: false,
            payload: {
                error: 'Estimated fee error',
            },
        },
        result: 'Estimated fee error',
    },
];

export const unstakeFixture = [
    {
        description:
            'should unstake 0.1 eth, expect correct transaction object with correct values',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.1', // eth
            symbol: 'eth',
            identity: '0',
            interchanges: 0,
        },
        accountInfo: {
            success: true,
            payload: {
                misc: {
                    stakingPools: [
                        {
                            autocompoundBalance: 2000000000000000000, // balance greater than amount
                        },
                    ],
                },
            },
        },
        estimatedFee: {
            success: true,
            payload: {
                levels: [{ feeLimit: '21000' }],
            },
        },
        result: {
            data: '0x76ec871c000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            gasLimit: 241000, // 21000 + 220000
            to: '0xD523794C879D9eC028960a231F866758e405bE34',
            value: '0', // wei
        },
    },
];

export const unstakeFailedFixture = [
    {
        description: 'should throw an error when account info is failed',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.1', // eth
            symbol: 'eth',
            identity: '0',
            interchanges: 0,
        },
        accountInfo: {
            success: false,
            payload: {
                error: 'Account info error',
            },
        },
        estimatedFee: {
            success: true,
            payload: {
                levels: [{ feeLimit: '21000' }],
            },
        },
        result: 'Account info error',
    },
    {
        description: 'should throw an error when autocompoundBalance is not available',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.1', // eth
            symbol: 'eth',
            identity: '0',
            interchanges: 0,
        },
        accountInfo: {
            success: true,
            payload: {
                misc: {
                    stakingPools: [{}], // autocompoundBalance is not present
                },
            },
        },
        estimatedFee: {
            success: true,
            payload: {
                levels: [{ feeLimit: '21000' }],
            },
        },
        result: 'Failed to get the autocompound balance',
    },
    {
        description: 'should throw an error when fee estimation is failed',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.1', // eth
            symbol: 'eth',
            identity: '0',
            interchanges: 0,
        },
        accountInfo: {
            success: true,
            payload: {
                misc: {
                    stakingPools: [
                        {
                            autocompoundBalance: 2000000000000000000, // balance greater than amount
                        },
                    ],
                },
            },
        },
        estimatedFee: {
            success: false,
            payload: {
                error: 'Estimated fee error',
            },
        },
        result: 'Estimated fee error',
    },
    {
        description: 'should throw an error if balance is less than amount',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.1', // eth
            symbol: 'eth',
            identity: '0',
            interchanges: 0,
        },
        accountInfo: {
            success: true,
            payload: {
                misc: {
                    stakingPools: [
                        {
                            autocompoundBalance: 100000000000000, // balance (0.0001) less than amount (0.1)
                        },
                    ],
                },
            },
        },
        result: 'Max Amount For Unstake 0.0001',
    },
];

export const claimFixture = [
    {
        description: 'should claim, expect correct transaction object with correct values',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            symbol: 'eth',
            identity: '0',
        },
        accountInfo: {
            success: true,
            payload: {
                misc: {
                    stakingPools: [
                        {
                            withdrawTotalAmount: 100000000000000000, // 0.1
                            claimableAmount: 100000000000000000, // 0.1
                        },
                    ],
                },
            },
        },
        estimatedFee: {
            success: true,
            payload: {
                levels: [{ feeLimit: '21000' }],
            },
        },
        result: {
            data: '0x33986ffa', // claim signature
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            to: '0x7a7f0b3c23C23a31cFcb0c44709be70d4D545c6e', // contract accounting address
            value: '0', // wei
            gasLimit: 241000, // 21000 + 220000
        },
    },
];

export const claimFailedFixture = [
    {
        description: 'should throw an error when account info is failed',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            symbol: 'thol',
            identity: '0',
        },
        accountInfo: {
            success: false,
            payload: {
                error: 'Account info error',
            },
        },
        result: 'Account info error',
    },
    {
        description: 'should throw an error when fee estimation is failed',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            symbol: 'eth',
            identity: '0',
        },
        accountInfo: {
            success: true,
            payload: {
                misc: {
                    stakingPools: [
                        {
                            withdrawTotalAmount: 100000000000000000, // 0.1
                            claimableAmount: 100000000000000000, // 0.1
                        },
                    ],
                },
            },
        },
        estimatedFee: {
            success: false,
            payload: {
                error: 'Estimated fee error',
            },
        },
        result: 'Estimated fee error',
    },
    {
        description:
            'should throw an error if withdrawTotalAmount or claimableAmount is not present',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            symbol: 'eth',
            identity: '0',
        },
        accountInfo: {
            success: true,
            payload: {
                misc: {
                    stakingPools: [
                        {
                            withdrawTotalAmount: 100000000000000000, // 0.1
                            // no claimableAmount
                        },
                    ],
                },
            },
        },
        result: 'Failed to get the claimable or withdraw total amount',
    },
    {
        description: 'should throw an error if withdrawTotalAmount is not equal claimableAmount ',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            symbol: 'eth',
            identity: '0',
        },
        accountInfo: {
            success: true,
            payload: {
                misc: {
                    stakingPools: [
                        {
                            withdrawTotalAmount: 200000000000000000, // 0.2
                            claimableAmount: 100000000000000000, // 0.1
                        },
                    ],
                },
            },
        },
        result: 'Unstake request not filled yet',
    },
];

export const getStakeFormsDefaultValuesFixture = [
    {
        description: 'should return default values for stake forms',
        args: {
            address: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            ethereumStakeType: 'stake',
            amount: '0.1',
        },
        result: {
            fiatInput: '',
            cryptoInput: '0.1',
            outputs: [
                {
                    address: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
                    amount: '0.1',
                    type: 'payment',
                    fiat: '',
                    currency: { value: 'usd', label: 'USD' },
                    token: null,
                    label: '',
                },
            ],
            options: ['broadcast'],
            ethereumStakeType: 'stake',
            ethereumNonce: '',
            ethereumDataAscii: '',
            ethereumDataHex: '',
            estimatedFeeLimit: undefined,
            feeLimit: '',
            feePerUnit: '',
            selectedFee: undefined,
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
            selectedUtxos: [],
        },
    },
    {
        description:
            'should return default values for stake forms with empty amount when amount is invalid',
        args: {
            address: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            ethereumStakeType: 'stake',
            amount: undefined,
        },
        result: {
            fiatInput: '',
            cryptoInput: '', // empty amount
            outputs: [
                {
                    address: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
                    amount: '', // empty amount
                    type: 'payment',
                    fiat: '',
                    currency: { value: 'usd', label: 'USD' },
                    token: null,
                    label: '',
                },
            ],
            options: ['broadcast'],
            ethereumStakeType: 'stake',
            ethereumNonce: '',
            ethereumDataAscii: '',
            ethereumDataHex: '',
            estimatedFeeLimit: undefined,
            feeLimit: '',
            feePerUnit: '',
            selectedFee: undefined,
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
            selectedUtxos: [],
        },
    },
];

export const getStakeTxGasLimitFixture = [
    {
        description: 'should return correct gasLimit',
        args: {
            ethereumStakeType: 'stake',
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.1', // eth
            symbol: 'eth',
            identity: '0',
        },
        estimatedFee: {
            success: true,
            payload: {
                levels: [{ feeLimit: '21000' }],
            },
        },
        result: {
            gasLimit: '241000', // 21000 + 220000 (reserve)
            success: true,
        },
    },
    {
        description: 'should throw an error when stake type is empty',
        args: {
            ethereumStakeType: '',
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.1', // eth
            symbol: 'eth',
            identity: '0',
        },
        estimatedFee: {
            success: true,
            payload: {
                levels: [{ feeLimit: '21000' }],
            },
        },
        result: {
            error: {
                normal: {
                    error: 'INCORRECT-FEE-RATE',
                    errorMessage: {
                        id: 'TR_GENERIC_ERROR_TITLE',
                    },
                    type: 'error',
                },
            },
            success: false,
        },
    },
];

export const getUnstakingPeriodInDaysFixture = [
    {
        description: 'should return correct unstaking period in days',
        args: {
            validatorWithdrawTimeInSeconds: 604800, // 7 days
        },
        result: 7,
    },
    {
        description:
            'should return default unstaking period in days when validatorWithdrawTimeInSeconds is not valid',
        args: {
            validatorWithdrawTimeInSeconds: undefined, // invalid
        },
        result: 3, // default
    },
];

export const getDaysToAddToPoolFixture = [
    {
        description:
            'should return undefined if validatorAddingDelay or validatorActivationTime is undefined',
        args: {
            stakeTxs: [{ blockTime: 1721393017 }],
            validatorsQueue: {}, // validatorAddingDelay and validatorActivationTime are undefined
        },
        result: undefined,
    },
    {
        description: 'should return 1 if blockTime is undefined',
        args: {
            stakeTxs: [{}], // blockTime is undefined
            validatorsQueue: { validatorAddingDelay: 86400, validatorActivationTime: 86400 },
        },
        result: 1,
    },
    {
        description: 'should return the number of days to wait',
        args: {
            stakeTxs: [{ blockTime: 1721393017 }], // 2024-07-19 (2024-07-10 + 9 days)
            validatorsQueue: { validatorAddingDelay: 86400, validatorActivationTime: 86400 }, // + 2 days
        },
        result: 11, // 9 + 2
    },
    {
        description: 'should return 1 if the number of days to wait is less than or equal to 0',
        args: {
            stakeTxs: [{ blockTime: 1720615417 }], // 2024-07-10
            validatorsQueue: { validatorAddingDelay: 0, validatorActivationTime: 0 },
        },
        result: 1,
    },
];

export const getDaysToUnstakeFixture = [
    {
        description: 'should return undefined if validatorWithdrawTime is undefined',
        args: {
            unstakeTxs: [{ blockTime: 1721393017 }],
            validatorsQueue: {}, // validatorWithdrawTime is undefined
        },
        result: undefined,
    },
    {
        description: 'should return 1 if blockTime is undefined',
        args: {
            unstakeTxs: [{}], // blockTime is undefined
            validatorsQueue: { validatorWithdrawTime: 86400 },
        },
        result: 1,
    },
    {
        description: 'should return the number of days to wait',
        args: {
            unstakeTxs: [{ blockTime: 1721393017 }], // 2024-07-19 (2024-07-10 + 9 days)
            validatorsQueue: { validatorWithdrawTime: 86400 }, // 1 day
        },
        result: 10,
    },
    {
        description: 'should return 1 if the number of days to wait is less than or equal to 0',
        args: {
            unstakeTxs: [{ blockTime: 1720615417 }], // 2024-07-10
            validatorsQueue: { validatorWithdrawTime: 0 },
        },
        result: 1,
    },
];

export const getDaysToAddToPoolInitialFixture = [
    {
        description:
            'should return undefined if validatorAddingDelay or validatorActivationTime is undefined',
        args: {
            validatorsQueue: {}, // validatorAddingDelay and validatorActivationTime are undefined
        },
        result: undefined,
    },
    {
        description: 'should return the number of days to wait',
        args: {
            validatorsQueue: { validatorAddingDelay: 86400, validatorActivationTime: 86400 }, // 2 days
        },
        result: 2, // replace with expected number of days
    },
    {
        description: 'should return 1 if the number of days to wait is less than or equal to 0',
        args: {
            validatorsQueue: { validatorAddingDelay: 0, validatorActivationTime: 0 },
        },
        result: 1,
    },
];

export const getAdjustedGasLimitConsumptionFixture = [
    {
        description:
            'should return the sum of the feeLimit and the gas limit reserve, rounded down',
        args: {
            estimatedFee: {
                payload: {
                    levels: [
                        {
                            feeLimit: '20000',
                        },
                    ],
                },
            },
        },
        result: 240000, // 220000 + 20000
    },
    {
        description: 'should return NaN if feeLimit is invalid',
        args: {
            estimatedFee: {
                payload: {
                    levels: [
                        {
                            feeLimit: undefined,
                        },
                    ],
                },
            },
        },
        result: NaN,
    },
];

export const getEthNetworkForWalletSdkFixture = [
    {
        description: 'should return "holesky" for "thol"',
        args: {
            symbol: 'thol',
        },
        result: 'holesky',
    },
    {
        description: 'should return "mainnet" for "eth"',
        args: {
            symbol: 'eth',
        },
        result: 'mainnet',
    },
    {
        description: 'should return "mainnet" for undefined',
        args: {
            symbol: undefined,
        },
        result: 'mainnet',
    },
    {
        description: 'should return "mainnet" for an unknown symbol',
        args: {
            symbol: 'unknown',
        },
        result: 'mainnet',
    },
];

export const getInstantStakeTypeFixture = [
    {
        description: 'should return "stake" for valid instant stake transfer (mainnet)',
        args: {
            internalTransfer: {
                from: '0xD523794C879D9eC028960a231F866758e405bE34',
                to: '0x19449f0f696703Aa3b1485DfA2d855F33659397a',
            },
            address: 'address',
            symbol: 'eth',
        },
        result: 'stake',
    },
    {
        description: 'should return "stake" for valid instant stake transfer (hokesky)',
        args: {
            internalTransfer: {
                from: '0xAFA848357154a6a624686b348303EF9a13F63264',
                to: '0x66cb3AeD024740164EBcF04e292dB09b5B63A2e1',
            },
            address: 'address',
            symbol: 'thol',
        },
        result: 'stake',
    },
    {
        description: 'should return "unstake" for valid instant unstake transfer (mainnet)',
        args: {
            internalTransfer: {
                from: '0xD523794C879D9eC028960a231F866758e405bE34',
                to: 'address',
            },
            address: 'address',
            symbol: 'eth',
        },
        result: 'unstake',
    },
    {
        description: 'should return "unstake" for valid instant unstake transfer (hokesky)',
        args: {
            internalTransfer: {
                from: '0xAFA848357154a6a624686b348303EF9a13F63264',
                to: 'address',
            },
            address: 'address',
            symbol: 'thol',
        },
        result: 'unstake',
    },
    {
        description: 'should return "claim" for valid claim transfer (mainnet)',
        args: {
            internalTransfer: {
                from: '0x19449f0f696703Aa3b1485DfA2d855F33659397a',
                to: 'address',
            },
            address: 'address',
            symbol: 'eth',
        },
        result: 'claim',
    },
    {
        description: 'should return "claim" for valid claim transfer (hokesky)',
        args: {
            internalTransfer: {
                from: '0x66cb3AeD024740164EBcF04e292dB09b5B63A2e1',
                to: 'address',
            },
            address: 'address',
            symbol: 'thol',
        },
        result: 'claim',
    },
    {
        description: 'should return null for invalid transaction',
        args: {
            internalTransfer: {
                from: 'unknown',
                to: 'unknown',
            },
            address: 'address',
            symbol: 'eth',
        },
        result: null,
    },
];

export const getChangedInternalTxFixture = [
    {
        description: 'should return null for no selectedAccountAddress or symbol',
        args: {
            prevTxs: [],
            currentTxs: [],
            selectedAccountAddress: undefined,
            symbol: undefined,
        },
        result: null,
    },
    {
        description: 'should return null for no changed transaction',
        args: {
            prevTxs: [
                { type: 'sent', txid: '1', internalTransfers: [] },
                { type: 'sent', txid: '2', internalTransfers: [] },
            ],
            currentTxs: [
                { type: 'sent', txid: '3', internalTransfers: [] },
                { type: 'sent', txid: '4', internalTransfers: [] },
            ],
            selectedAccountAddress: 'address',
            symbol: 'eth',
        },
        result: null,
    },
    {
        description: 'should return the changed internal transaction',
        args: {
            prevTxs: [
                { type: 'sent', txid: '1', internalTransfers: [] },
                { type: 'sent', txid: '2', internalTransfers: [] },
            ],
            currentTxs: [
                {
                    type: 'sent',
                    txid: '1',
                    internalTransfers: [
                        {
                            from: '0xD523794C879D9eC028960a231F866758e405bE34',
                            to: '0x19449f0f696703Aa3b1485DfA2d855F33659397a',
                            type: 'external',
                            amount: '1',
                        },
                    ],
                },
                { type: 'sent', txid: '2', internalTransfers: [] },
            ],
            selectedAccountAddress: 'address',
            symbol: 'eth',
        },
        result: {
            from: '0xD523794C879D9eC028960a231F866758e405bE34',
            to: '0x19449f0f696703Aa3b1485DfA2d855F33659397a',
            type: 'external',
            amount: '1',
        },
    },
];

export const simulateUnstakeFixture = [
    {
        description: 'should return null for no coin, from, or data',
        args: {
            amount: undefined,
            from: undefined,
            symbol: undefined,
        },
        blockchainEvmRpcCallResult: {},
        result: null,
    },
    {
        description: 'should return approximated amount for valid inputs',
        args: {
            amount: '0.1',
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            to: '0xAFA848357154a6a624686b348303EF9a13F63264',
            symbol: 'eth',
        },
        blockchainEvmRpcCallResult: {
            success: true,
            payload: { data: '0x000000000000000000000000000000000000000000000000016345785d8a0000' },
        },
        result: '0.1', // 0.1 eth
    },
];
