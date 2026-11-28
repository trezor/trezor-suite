import {
    type CustomEvmNetworkDefinition,
    getCustomEvmNetworkSymbol,
} from '../src/customEvmNetwork';

const MOCK_CUSTOM_EVM_CHAIN_ID = 4242;

/**
 * Builds a valid custom EVM network definition for tests. A different `chainId` also moves the
 * `symbol`, so two mocks never collide unless a test asks for it.
 */
export const mockCustomEvmNetworkDefinition = (
    overrides: Partial<CustomEvmNetworkDefinition> = {},
): CustomEvmNetworkDefinition => {
    const chainId = overrides.chainId ?? MOCK_CUSTOM_EVM_CHAIN_ID;

    return {
        symbol: getCustomEvmNetworkSymbol(chainId),
        chainId,
        name: 'Custom Chain',
        displaySymbol: 'CST',
        currencyName: 'Custom Token',
        rpcUrls: ['https://rpc.custom.example'],
        explorerUrl: 'https://explorer.custom.example',
        testnet: false,
        ...overrides,
    };
};
