export const getContractAddressForNetworkSymbolFixtures = [
    {
        testName: 'Converts to lowercase for non-sol networks',
        networkSymbol: 'eth' as const,
        contractAddress: '0xABCD',
        expected: '0xabcd',
    },
    {
        testName: 'Preserves case for sol network',
        networkSymbol: 'sol' as const,
        contractAddress: 'SolContractAddress',
        expected: 'SolContractAddress',
    },
    {
        testName: 'Converts to lowercase for eth network',
        networkSymbol: 'eth' as const,
        contractAddress: '0XABCDE',
        expected: '0xabcde',
    },
    {
        testName: 'Handles empty contract address for non-sol network',
        networkSymbol: 'btc' as const,
        contractAddress: '',
        expected: '',
    },
    {
        testName: 'Handles empty contract address for sol network',
        networkSymbol: 'sol' as const,
        contractAddress: '',
        expected: '',
    },
    {
        testName: 'Returns policy id for cardano',
        networkSymbol: 'ada' as const,
        contractAddress: 'f43a62fdc3965df486de8a0d32fe800963589c41b38946602a0dc53541474958',
        expected: 'f43a62fdc3965df486de8a0d32fe800963589c41b38946602a0dc535',
    },
];
