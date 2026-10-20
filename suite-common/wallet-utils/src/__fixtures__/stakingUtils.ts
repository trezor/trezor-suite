import { EVERSTAKE_CONTRACTS } from '@trezor/network-ethereum/staking';

const EVERSTAKE_POOL = {
    name: 'Everstake',
    contract: EVERSTAKE_CONTRACTS[1].accounting,
    autocompoundBalance: '1000000000000000000', // 1 Ether in wei
    claimableAmount: '500000000000000000', // 0.5 Ether in wei
    depositedBalance: '3000000000000000000', // 3 Ether in wei
    pendingBalance: '100000000000000000', // 0.1 Ether in wei
    pendingDepositedBalance: '200000000000000000', // 0.2 Ether in wei
    restakedReward: '150000000000000000', // 0.15 Ether in wei
    withdrawTotalAmount: '500000000000000000', // 0.5 Ether in wei
};

const UNKNOWN_POOL = {
    name: 'TrezorPool',
    contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
    autocompoundBalance: '1000000000000000000',
    claimableAmount: '0',
    depositedBalance: '0',
    pendingBalance: '0',
    pendingDepositedBalance: '0',
    restakedReward: '0',
    withdrawTotalAmount: '0',
};

export const getEthereumAccountStakingPoolsFixtures = [
    {
        description: 'Ethereum account with a pool of a known pooled provider',
        account: {
            symbol: 'eth',
            networkType: 'ethereum',
            misc: { stakingPools: [EVERSTAKE_POOL] },
        },
        expected: [EVERSTAKE_POOL],
    },
    {
        description: 'matches the pool contract regardless of address case',
        account: {
            symbol: 'eth',
            networkType: 'ethereum',
            misc: {
                stakingPools: [
                    { ...EVERSTAKE_POOL, contract: EVERSTAKE_CONTRACTS[1].pool.toLowerCase() },
                ],
            },
        },
        expected: [{ ...EVERSTAKE_POOL, contract: EVERSTAKE_CONTRACTS[1].pool.toLowerCase() }],
    },
    {
        description: 'ignores a pool of an unknown contract',
        account: {
            symbol: 'eth',
            networkType: 'ethereum',
            misc: { stakingPools: [UNKNOWN_POOL, EVERSTAKE_POOL] },
        },
        expected: [EVERSTAKE_POOL],
    },
    {
        description: 'ignores a mainnet pool reported on another network',
        account: {
            symbol: 'thod',
            networkType: 'ethereum',
            misc: { stakingPools: [EVERSTAKE_POOL] },
        },
        expected: [],
    },
    {
        description: 'Non-Ethereum network with a pool',
        account: {
            symbol: 'btc',
            networkType: 'bitcoin',
            misc: { stakingPools: [EVERSTAKE_POOL] },
        },
        expected: [],
    },
];

export const getEthAccountTotalStakingBalanceFixtures = [
    {
        description: 'Ethereum account with valid Everstake pool',
        account: {
            symbol: 'eth',
            networkType: 'ethereum',
            misc: {
                stakingPools: [
                    {
                        name: 'Everstake',
                        contract: EVERSTAKE_CONTRACTS[1].accounting,
                        autocompoundBalance: '1000000000000000000', // 1 Ether in wei
                        claimableAmount: '500000000000000000', // 0.5 Ether in wei
                        depositedBalance: '3000000000000000000', // 3 Ether in wei
                        pendingBalance: '100000000000000000', // 0.1 Ether in wei
                        pendingDepositedBalance: '200000000000000000', // 0.2 Ether in wei
                        restakedReward: '150000000000000000', // 0.15 Ether in wei
                        withdrawTotalAmount: '500000000000000000', // 0.5 Ether in wei
                    },
                ],
            },
        },
        expectedBalance: '1.8', // 1 + 0.1 + 0.2 + 0.5 Ether
    },
    {
        description: 'Ethereum account with zero balances',
        account: {
            symbol: 'eth',
            networkType: 'ethereum',
            misc: {
                stakingPools: [
                    {
                        name: 'Everstake',
                        contract: EVERSTAKE_CONTRACTS[1].accounting,
                        autocompoundBalance: '0',
                        claimableAmount: '0',
                        depositedBalance: '0',
                        pendingBalance: '0',
                        pendingDepositedBalance: '0',
                        restakedReward: '0',
                        withdrawTotalAmount: '0',
                    },
                ],
            },
        },
        expectedBalance: '0',
    },
    {
        description: 'Ethereum account without Everstake pool',
        account: {
            symbol: 'eth',
            networkType: 'ethereum',
            misc: {
                stakingPools: [],
            },
        },
        expectedBalance: '0',
    },
    {
        description: 'Non-Ethereum network with Everstake pool',
        account: {
            networkType: 'bitcoin',
            misc: {
                stakingPools: [
                    {
                        name: 'Everstake',
                        autocompoundBalance: '1000000000000000000',
                    },
                ],
            },
        },
        expectedBalance: '0',
    },
];
