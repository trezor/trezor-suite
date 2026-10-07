import {
    type BitcoinNetworkSymbol,
    isSupportedBitcoinNetwork,
} from '@trezor/network-bitcoin-types';
import { ChainNetworkError } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getAccountSyncInterval, getNetworkConfig } from '../networkConfig';

/** What every Bitcoin-like chain network needs to know about its symbol. */
export const getBitcoinChainNetworkConfig = (symbol: NetworkSymbol) => {
    if (!isSupportedBitcoinNetwork(symbol)) {
        throw new ChainNetworkError('unsupported-network', symbol);
    }

    const bitcoinSymbol: BitcoinNetworkSymbol = symbol;
    const config = getNetworkConfig(bitcoinSymbol);

    return {
        nativeAsset: {
            symbol: config.displaySymbol,
            name: config.displaySymbolName ?? config.name,
        },
        decimals: config.decimals,
        accountSyncIntervalMs: getAccountSyncInterval(bitcoinSymbol),
        hasFiatRate: !config.testnet,
    };
};
