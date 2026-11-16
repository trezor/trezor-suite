export const getContractAddressForNetworkSymbolFixtures = [
    {
        testName: 'Converts to lowercase for evm networks',
        symbol: 'eth' as const,
        contractAddress: '0xABCD',
        expected: '0xabcd',
    },
    {
        testName: 'Keeps case for Tron network',
        symbol: 'trx' as const,
        contractAddress: 'T1234',
        expected: 'T1234',
    },
    {
        testName: 'Preserves case for sol network',
        symbol: 'sol' as const,
        contractAddress: 'SolContractAddress',
        expected: 'SolContractAddress',
    },
    {
        testName: 'Converts to lowercase for eth network',
        symbol: 'eth' as const,
        contractAddress: '0XABCDE',
        expected: '0xabcde',
    },
    {
        testName: 'Handles empty contract address for non-sol network',
        symbol: 'btc' as const,
        contractAddress: '',
        expected: '',
    },
    {
        testName: 'Handles empty contract address for sol network',
        symbol: 'sol' as const,
        contractAddress: '',
        expected: '',
    },
    {
        testName: 'Keeps the asset name of a cardano asset unit',
        symbol: 'ada' as const,
        contractAddress: 'f43a62fdc3965df486de8a0d32fe800963589c41b38946602a0dc53541474958',
        expected: 'f43a62fdc3965df486de8a0d32fe800963589c41b38946602a0dc53541474958',
    },
    {
        testName: 'Converts a cardano asset unit to lowercase',
        symbol: 'ada' as const,
        contractAddress: 'F43A62FDC3965DF486DE8A0D32FE800963589C41B38946602A0DC53541474958',
        expected: 'f43a62fdc3965df486de8a0d32fe800963589c41b38946602a0dc53541474958',
    },
    {
        testName: 'Returns same case for random non-existing symbol in networks config',
        symbol: 'xyz' as const,
        contractAddress: 'abcDEF',
        expected: 'abcDEF',
    },
];
