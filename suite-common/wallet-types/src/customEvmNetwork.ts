import type { NetworkSymbol } from '@suite-common/wallet-config';

export type CustomEvmNetworkDefinition = {
    symbol: NetworkSymbol;
    chainId: number;
    name: string;
    displaySymbol: string;
    currencyName: string;
    rpcUrls: string[];
    explorerUrl: string;
    testnet: boolean;
};

const CUSTOM_EVM_NETWORK_SYMBOL_PREFIX = 'evm';

// Namespaced by chain id so a user network can never collide with a bundled network symbol.
export const getCustomEvmNetworkSymbol = (chainId: number) =>
    `${CUSTOM_EVM_NETWORK_SYMBOL_PREFIX}${chainId}` as NetworkSymbol;

export const isCustomEvmNetworkSymbol = (symbol: string) =>
    new RegExp(`^${CUSTOM_EVM_NETWORK_SYMBOL_PREFIX}\\d+$`).test(symbol);
