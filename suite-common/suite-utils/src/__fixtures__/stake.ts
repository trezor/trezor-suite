export const getUnstakeAmountByEthereumDataHexFixtures = [
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
    {
        description: 'should return null when the transaction is not an unstake transaction',
        ethereumData: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        expectedAmountWei: null,
    },
    {
        description: 'should return null for invalid or unsupported ethereum data',
        ethereumData: '1234',
        expectedAmountWei: null,
    },
];
