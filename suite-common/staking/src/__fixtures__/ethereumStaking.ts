import { type EthValidatorsQueue } from '@suite-common/earn-staking-api';
import { DAYS_TO_ADD_TO_POOL_DEFAULT } from '@suite-common/wallet-constants';

import { ETH_NETWORK_ADDRESSES } from '../constants/ethereumNetworkAddresses';

export const transformTxFixtures = [
    {
        description:
            'should transform transaction data, omit "from", and convert units correctly 1',
        tx: {
            data: '0x3a29dbae0000000000000000000000000000000000000000000000000000000000000001',
            from: '0xCe66A9577F4e2589c1D1547B75B7A2b0807cE0ed',
            gasLimit: 416102,
            to: ETH_NETWORK_ADDRESSES.hoodi.addressContractPool,
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
            to: ETH_NETWORK_ADDRESSES.hoodi.addressContractPool,
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
            to: ETH_NETWORK_ADDRESSES.hoodi.addressContractPool,
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
            to: ETH_NETWORK_ADDRESSES.hoodi.addressContractPool,
            value: '0x2710',
        },
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
            to: ETH_NETWORK_ADDRESSES.mainnet.addressContractPool,
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
            to: ETH_NETWORK_ADDRESSES.mainnet.addressContractPool,
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
        result: 'Min amount 0.1 ETH',
    },
    {
        description: 'should throw an error when fee estimation is errored',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.1',
            symbol: 'eth',
            identity: '0',
        },
        estimatedFee: {
            success: false,
            error: {
                message: 'Estimated fee error',
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
            interchanges: 5,
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
            data: '0x76ec871c000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000000050000000000000000000000000000000000000000000000000000000000000001',
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            gasLimit: 241000, // 21000 + 220000
            to: ETH_NETWORK_ADDRESSES.mainnet.addressContractPool,
            value: '0', // wei
        },
    },
];

export const unstakeFailedFixture = [
    {
        description: 'should throw an error when account info is errored',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.1', // eth
            symbol: 'eth',
            identity: '0',
            interchanges: 5,
        },
        accountInfo: {
            success: false,
            error: {
                message: 'Account info error',
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
            interchanges: 5,
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
        description: 'should throw an error when fee estimation is errored',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            amount: '0.1', // eth
            symbol: 'eth',
            identity: '0',
            interchanges: 5,
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
            error: {
                message: 'Estimated fee error',
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
            interchanges: 5,
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
            to: ETH_NETWORK_ADDRESSES.mainnet.addressContractAccounting, // contract accounting address
            value: '0', // wei
            gasLimit: 241000, // 21000 + 220000
        },
    },
];

export const claimFailedFixture = [
    {
        description: 'should throw an error when account info is errored',
        args: {
            from: '0xfB0bc552ab5Fa1971E8530852753c957e29eEEFC',
            symbol: 'thod',
            identity: '0',
        },
        accountInfo: {
            success: false,
            error: {
                message: 'Account info error',
            },
        },
        result: 'Account info error',
    },
    {
        description: 'should throw an error when fee estimation is errored',
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
            error: {
                message: 'Estimated fee error',
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
            stakeType: 'stake',
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
            stakeType: 'stake',
            ethereumNonce: '',
            ethereumDataAscii: '',
            transactionData: '',
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
            stakeType: 'stake',
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
            stakeType: 'stake',
            ethereumNonce: '',
            ethereumDataAscii: '',
            transactionData: '',
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
            stakeType: 'stake',
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
            stakeType: '',
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
        description: 'should return undefined if blockTime is undefined',
        args: {
            stakeTxs: [{}], // blockTime is undefined
            validatorsQueue: {
                addingDelay: 86400,
                activationTime: 86400,
            } satisfies EthValidatorsQueue,
        },
        result: undefined,
    },
    {
        description: 'should return the number of days to wait',
        args: {
            stakeTxs: [{ blockTime: 1721393017 }], // 2024-07-19 (2024-07-10 + 9 days)
            validatorsQueue: {
                addingDelay: 86400,
                activationTime: 86400,
            } satisfies EthValidatorsQueue, // + 2 days
        },
        result: 11, // 9 + 2
    },
    {
        description: 'should return 1 if the number of days to wait is less than or equal to 0',
        args: {
            stakeTxs: [{ blockTime: 1720615417 }], // 2024-07-10
            validatorsQueue: { addingDelay: 0, activationTime: 0 } satisfies EthValidatorsQueue,
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
            validatorsQueue: { withdrawTime: 86400 } satisfies EthValidatorsQueue,
        },
        result: 1,
    },
    {
        description: 'should return the number of days to wait',
        args: {
            unstakeTxs: [{ blockTime: 1721393017 }], // 2024-07-19 (2024-07-10 + 9 days)
            validatorsQueue: { withdrawTime: 86400 } satisfies EthValidatorsQueue, // 1 day
        },
        result: 10,
    },
    {
        description: 'should return 1 if the number of days to wait is less than or equal to 0',
        args: {
            unstakeTxs: [{ blockTime: 1720615417 }], // 2024-07-10
            validatorsQueue: { withdrawTime: 0 } satisfies EthValidatorsQueue,
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
        result: DAYS_TO_ADD_TO_POOL_DEFAULT,
    },
    {
        description: 'should return the number of days to wait',
        args: {
            validatorsQueue: {
                addingDelay: 86400,
                activationTime: 86400,
            } satisfies EthValidatorsQueue, // 2 days
        },
        result: 2, // replace with expected number of days
    },
    {
        description: 'should return 1 if the number of days to wait is less than or equal to 0',
        args: {
            validatorsQueue: { addingDelay: 0, activationTime: 0 } satisfies EthValidatorsQueue,
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
        description: 'should return "hoodi" for "thod"',
        args: {
            symbol: 'thod' as const,
        },
        result: 'hoodi',
    },
    {
        description: 'should return "mainnet" for "eth"',
        args: {
            symbol: 'eth' as const,
        },
        result: 'mainnet',
    },
    {
        description: 'should return null for undefined',
        args: {
            symbol: undefined,
        },
        result: null,
    },
    {
        description: 'should return null for an unknown symbol',
        args: {
            symbol: 'unknown' as const,
        },
        result: null,
    },
    {
        description: 'should return null for a non-staking network symbol',
        args: {
            symbol: 'btc' as const,
        },
        result: null,
    },
];

export const getInstantStakeTypeFixture = [
    {
        description: 'should return "stake" for valid instant stake transfer (mainnet)',
        args: {
            internalTransfer: {
                from: ETH_NETWORK_ADDRESSES.mainnet.addressContractPool,
                to: ETH_NETWORK_ADDRESSES.mainnet.addressContractWithdrawTreasury,
            },
            address: 'address',
            symbol: 'eth' as const,
        },
        result: 'stake',
    },
    {
        description: 'should return "stake" for valid instant stake transfer (hoodi)',
        args: {
            internalTransfer: {
                from: ETH_NETWORK_ADDRESSES.hoodi.addressContractPool,
                to: ETH_NETWORK_ADDRESSES.hoodi.addressContractWithdrawTreasury,
            },
            address: 'address',
            symbol: 'thod' as const,
        },
        result: 'stake',
    },
    {
        description: 'should return "unstake" for valid instant unstake transfer (mainnet)',
        args: {
            internalTransfer: {
                from: ETH_NETWORK_ADDRESSES.mainnet.addressContractPool,
                to: 'address',
            },
            address: 'address',
            symbol: 'eth' as const,
        },
        result: 'unstake',
    },
    {
        description: 'should return "unstake" for valid instant unstake transfer (hoodi)',
        args: {
            internalTransfer: {
                from: ETH_NETWORK_ADDRESSES.hoodi.addressContractPool,
                to: 'address',
            },
            address: 'address',
            symbol: 'thod' as const,
        },
        result: 'unstake',
    },
    {
        description: 'should return "claim" for valid claim transfer (mainnet)',
        args: {
            internalTransfer: {
                from: ETH_NETWORK_ADDRESSES.mainnet.addressContractWithdrawTreasury,
                to: 'address',
            },
            address: 'address',
            symbol: 'eth' as const,
        },
        result: 'claim',
    },
    {
        description: 'should return "claim" for valid claim transfer (hoodi)',
        args: {
            internalTransfer: {
                from: ETH_NETWORK_ADDRESSES.hoodi.addressContractWithdrawTreasury,
                to: 'address',
            },
            address: 'address',
            symbol: 'thod' as const,
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
            symbol: 'eth' as const,
        },
        result: null,
    },
    {
        description:
            'should return null for an unsupported network symbol even if addresses match mainnet contracts',
        args: {
            internalTransfer: {
                from: ETH_NETWORK_ADDRESSES.mainnet.addressContractPool,
                to: ETH_NETWORK_ADDRESSES.mainnet.addressContractWithdrawTreasury,
            },
            address: 'address',
            symbol: 'pol' as const,
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
            symbol: 'eth' as const,
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
                            from: ETH_NETWORK_ADDRESSES.mainnet.addressContractPool,
                            to: ETH_NETWORK_ADDRESSES.mainnet.addressContractWithdrawTreasury,
                            type: 'external',
                            amount: '1',
                        },
                    ],
                },
                { type: 'sent', txid: '2', internalTransfers: [] },
            ],
            selectedAccountAddress: 'address',
            symbol: 'eth' as const,
        },
        result: {
            from: ETH_NETWORK_ADDRESSES.mainnet.addressContractPool,
            to: ETH_NETWORK_ADDRESSES.mainnet.addressContractWithdrawTreasury,
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
            to: ETH_NETWORK_ADDRESSES.hoodi.addressContractPool,
            symbol: 'eth',
        },
        blockchainEvmRpcCallResult: {
            success: true,
            payload: { data: '0x000000000000000000000000000000000000000000000000016345785d8a0000' },
        },
        result: '0.1', // 0.1 eth
    },
];
