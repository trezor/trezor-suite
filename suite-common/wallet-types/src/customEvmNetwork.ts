import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';

export type CustomEvmNetworkDefinition = {
    symbol: NetworkSymbol;
    chainId: number;
    name: string;
    displaySymbol: string;
    currencyName: string;
    rpcUrls: string[];
    explorerUrl: string;
    testnet: boolean;
    /** Measured from the RPC when the network is added; absent when the RPC could not serve it. */
    blockTimeSeconds?: number;
};

const CUSTOM_EVM_NETWORK_SYMBOL_PREFIX = 'evm';

// Namespaced by chain id so a user network can never collide with a predefined network symbol.
export const getCustomEvmNetworkSymbol = (chainId: number) =>
    asNetworkSymbol(`${CUSTOM_EVM_NETWORK_SYMBOL_PREFIX}${chainId}`);

const CUSTOM_EVM_NETWORK_SYMBOL_PATTERN = new RegExp(`^${CUSTOM_EVM_NETWORK_SYMBOL_PREFIX}\\d+$`);

export const isCustomEvmNetworkSymbol = (symbol: string) =>
    CUSTOM_EVM_NETWORK_SYMBOL_PATTERN.test(symbol);
