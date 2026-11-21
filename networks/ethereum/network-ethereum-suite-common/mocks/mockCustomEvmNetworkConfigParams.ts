import { type CustomEvmNetworkConfigParams } from '../src/customEvmNetwork';

export const mockCustomEvmNetworkConfigParams = (
    overrides: Partial<CustomEvmNetworkConfigParams> = {},
): CustomEvmNetworkConfigParams => ({
    chainId: 4242,
    name: 'Custom Chain',
    displaySymbol: 'CST',
    explorerUrl: 'https://explorer.custom.example',
    testnet: false,
    ...overrides,
});
