import type { GetNetworkConfig } from '../src/createGetNetworkConfig';

export const mockGetNetworkConfig: GetNetworkConfig = () => ({
    color: '#000000',
    protocols: [],
    displaySymbol: 'BTC',
    name: 'Bitcoin',
    networkType: 'bitcoin',
    bip43Path: "m/84'/0'/i'",
    decimals: 8,
    testnet: false,
    explorer: {
        base: 'https://example.com',
        tx: 'https://example.com/tx/',
        address: 'https://example.com/address/',
    },
    accountTypes: {},
    features: [],
    backendOptions: [],
    yieldXyzId: null,
});
