import { type EthValidatorsQueue } from '@suite-common/earn-staking-api';
import { type StakingPool } from '@trezor/blockchain-link-types';
import { EVERSTAKE_CONTRACTS, EVERSTAKE_STAKING_POOL_NAME } from '@trezor/network-ethereum/staking';

import { DAYS_TO_ADD_TO_POOL_DEFAULT } from '../everstakeConstants';

// The shape Blockbook and the evm-rpc worker report for the mainnet accounting contract.
export const everstakeStakingPool = (pool: Partial<StakingPool> = {}): StakingPool => ({
    name: EVERSTAKE_STAKING_POOL_NAME,
    contract: EVERSTAKE_CONTRACTS[1].accounting,
    autocompoundBalance: '0',
    claimableAmount: '0',
    depositedBalance: '0',
    pendingBalance: '0',
    pendingDepositedBalance: '0',
    restakedReward: '0',
    withdrawTotalAmount: '0',
    ...pool,
});

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

export const getInstantStakeTypeFixture = [
    {
        description: 'should return "stake" for valid instant stake transfer (mainnet)',
        args: {
            internalTransfer: {
                from: EVERSTAKE_CONTRACTS[1].pool,
                to: EVERSTAKE_CONTRACTS[1].withdrawTreasury,
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
                from: EVERSTAKE_CONTRACTS[560048].pool,
                to: EVERSTAKE_CONTRACTS[560048].withdrawTreasury,
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
                from: EVERSTAKE_CONTRACTS[1].pool,
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
                from: EVERSTAKE_CONTRACTS[560048].pool,
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
                from: EVERSTAKE_CONTRACTS[1].withdrawTreasury,
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
                from: EVERSTAKE_CONTRACTS[560048].withdrawTreasury,
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
                from: EVERSTAKE_CONTRACTS[1].pool,
                to: EVERSTAKE_CONTRACTS[1].withdrawTreasury,
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
                            from: EVERSTAKE_CONTRACTS[1].pool,
                            to: EVERSTAKE_CONTRACTS[1].withdrawTreasury,
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
            from: EVERSTAKE_CONTRACTS[1].pool,
            to: EVERSTAKE_CONTRACTS[1].withdrawTreasury,
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
            to: EVERSTAKE_CONTRACTS[560048].pool,
            symbol: 'eth',
        },
        blockchainEvmRpcCallResult: {
            success: true,
            payload: { data: '0x000000000000000000000000000000000000000000000000016345785d8a0000' },
        },
        result: '0.1', // 0.1 eth
    },
];
