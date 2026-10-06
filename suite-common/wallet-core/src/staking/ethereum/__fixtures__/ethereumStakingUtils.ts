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

export const getUnstakeAmountByEthereumDataHexFixtures = [
    {
        description: 'should correctly extract and convert the unstaking amount from ethereum data',
        transactionData: '76ec871c0000000000000000000000000000000000000000000000000000000000000001', // without 0x
        expectedAmountWei: '1', // 0.000000000000000001 eth
    },
    {
        description: 'should correctly remove 0x prefix from ethereum data',
        transactionData:
            '0x76ec871c0000000000000000000000000000000000000000000000000000000000000001', // with 0x
        expectedAmountWei: '1', // 0.000000000000000001 eth
    },
    {
        description: 'should return null when the transaction is not an unstake transaction',
        transactionData: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        expectedAmountWei: null,
    },
    {
        description: 'should return null for invalid or unsupported ethereum data',
        transactionData: '1234',
        expectedAmountWei: null,
    },
];
