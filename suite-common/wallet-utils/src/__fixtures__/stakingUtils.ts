export const getAccountEverstakeStakingPoolFixtures = [
    {
        description: 'Ethereum network with Everstake pool and small balances',
        account: {
            networkType: 'ethereum',
            misc: {
                stakingPools: [
                    {
                        name: 'Everstake',
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
        expected: {
            name: 'Everstake',
            autocompoundBalance: '1', // Ether
            claimableAmount: '0.5', // Ether
            depositedBalance: '3', // Ether
            pendingBalance: '0.1', // Ether
            pendingDepositedBalance: '0.2', // Ether
            restakedReward: '0.15', // Ether
            withdrawTotalAmount: '0.5', // Ether
            totalPendingStakeBalance: '0.3', // 0.1 + 0.2 Ether
            canClaim: true,
        },
    },
    {
        description: 'Ethereum network with Everstake pool and extremely large balances',
        account: {
            networkType: 'ethereum',
            misc: {
                stakingPools: [
                    {
                        name: 'Everstake',
                        autocompoundBalance: '1000000000000000000000', // 1000 Ether in wei
                        claimableAmount: '50000000000000000000000', // 50,000 Ether in wei
                        depositedBalance: '30000000000000000000000', // 30,000 Ether in wei
                        pendingBalance: '1000000000000000000000', // 1000 Ether in wei
                        pendingDepositedBalance: '2000000000000000000000', // 2000 Ether in wei
                        restakedReward: '150000000000000000000', // 150 Ether in wei
                        withdrawTotalAmount: '50000000000000000000000', // 50,000 Ether in wei
                    },
                ],
            },
        },
        expected: {
            name: 'Everstake',
            autocompoundBalance: '1000', // Ether
            claimableAmount: '50000', // Ether
            depositedBalance: '30000', // Ether
            pendingBalance: '1000', // Ether
            pendingDepositedBalance: '2000', // Ether
            restakedReward: '150', // Ether
            withdrawTotalAmount: '50000', // Ether
            totalPendingStakeBalance: '3000', // 1000 + 2000 Ether
            canClaim: true,
        },
    },
    {
        description: 'Ethereum network without Everstake pool',
        account: {
            networkType: 'ethereum',
            misc: {
                stakingPools: [
                    {
                        name: 'TrezorPool',
                        autocompoundBalance: '1000000000000000000',
                    },
                ],
            },
        },
        expected: undefined,
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
        expected: undefined,
    },
];

export const getAccountAutocompoundBalanceFixtures = [
    {
        description: 'Ethereum account with valid Everstake pool',
        account: {
            networkType: 'ethereum',
            misc: {
                stakingPools: [
                    {
                        name: 'Everstake',
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
        expectedBalance: '1', // Ether
    },
    {
        description: 'Ethereum account without Everstake pool',
        account: {
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

export const getAccountTotalStakingBalanceFixtures = [
    {
        description: 'Ethereum account with valid Everstake pool',
        account: {
            networkType: 'ethereum',
            misc: {
                stakingPools: [
                    {
                        name: 'Everstake',
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
            networkType: 'ethereum',
            misc: {
                stakingPools: [
                    {
                        name: 'Everstake',
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
