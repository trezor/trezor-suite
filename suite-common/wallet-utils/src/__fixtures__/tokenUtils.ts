import { NetworkSymbol } from '@suite-common/wallet-config';

export const getContractAddressForNetworkFixtures = [
    {
        testName: 'Converts to lowercase for non-sol networks',
        networkSymbol: 'eth' as NetworkSymbol,
        contractAddress: '0xABCD',
        expected: '0xabcd',
    },
    {
        testName: 'Preserves case for sol network',
        networkSymbol: 'sol' as NetworkSymbol,
        contractAddress: 'SolContractAddress',
        expected: 'SolContractAddress',
    },
    {
        testName: 'Converts to lowercase for eth network',
        networkSymbol: 'eth' as NetworkSymbol,
        contractAddress: '0XABCDE',
        expected: '0xabcde',
    },
    {
        testName: 'Handles empty contract address for non-sol network',
        networkSymbol: 'btc' as NetworkSymbol,
        contractAddress: '',
        expected: '',
    },
    {
        testName: 'Handles empty contract address for sol network',
        networkSymbol: 'sol' as NetworkSymbol,
        contractAddress: '',
        expected: '',
    },
    {
        testName: 'Returns policy id for cardano',
        networkSymbol: 'ada' as NetworkSymbol,
        contractAddress: 'f43a62fdc3965df486de8a0d32fe800963589c41b38946602a0dc53541474958',
        expected: 'f43a62fdc3965df486de8a0d32fe800963589c41b38946602a0dc535',
    },
];
