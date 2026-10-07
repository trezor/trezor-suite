import type { NetworkSymbol } from '@trezor/network-module-types';

import type { SuiteCommonNetworkConfig } from '../SuiteCommonNetworkConfig';
import type { ChainNativeAsset } from './ChainNetwork';
import { ChainNetworkError } from './ChainNetworkError';

export type ChainNetworkConfigSource<TSymbol extends string> = {
    isSupportedNetwork: (symbol: string) => symbol is TSymbol;
    getNetworkConfig: (symbol: TSymbol) => SuiteCommonNetworkConfig;
    getAccountSyncInterval: (symbol: TSymbol) => number;
};

export type ChainNetworkConfig = {
    nativeAsset: ChainNativeAsset;
    decimals: number;
    accountSyncIntervalMs: number;

    isTestnet: boolean;

    /** Testnet coins and tokens have no fiat value. */
    hasFiatRate: boolean;

    /** Blockbook quotes the network's coin and tokens. */
    hasBlockbookRates: boolean;
};

/**
 * What a chain network reads from its network module's config, for a symbol the module must
 * support: a symbol of another family is refused at the edge.
 */
export const readChainNetworkConfig = <TSymbol extends string>(
    source: ChainNetworkConfigSource<TSymbol>,
    symbol: NetworkSymbol,
): ChainNetworkConfig => {
    if (!source.isSupportedNetwork(symbol)) {
        throw new ChainNetworkError('unsupported-network', symbol);
    }

    const config = source.getNetworkConfig(symbol);

    return {
        nativeAsset: {
            symbol: config.displaySymbol,
            name: config.displaySymbolName ?? config.name,
        },
        decimals: config.decimals,
        accountSyncIntervalMs: source.getAccountSyncInterval(symbol),
        isTestnet: config.testnet,
        hasFiatRate: !config.testnet,
        hasBlockbookRates: config.backendOptions.some(option => option.type === 'blockbook'),
    };
};
