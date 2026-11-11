import { asDisplayOrderKey } from '../src/DisplayOrderKey';
import type { SuiteCommonNetworkConfig } from '../src/SuiteCommonNetworkConfig';

export const mockSuiteCommonNetworkConfig = (
    config: Partial<SuiteCommonNetworkConfig> = {},
): SuiteCommonNetworkConfig => ({
    displaySymbol: 'AAA',
    name: 'Test network',
    networkType: 'bitcoin',
    bip43Path: "m/84'/0'/i'",
    decimals: 8,
    testnet: false,
    explorer: {
        base: 'https://explorer',
        tx: 'https://explorer/tx/',
        address: 'https://explorer/a/',
    },
    accountTypes: {},
    features: [],
    backendOptions: [{ type: 'blockbook' }],
    yieldXyzId: null,
    color: '#000000',
    protocols: [],
    displayOrder: asDisplayOrderKey('a0'),
    ...config,
});
