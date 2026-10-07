import {
    type EthereumNetworkSymbol,
    isSupportedEthereumNetwork,
} from '@trezor/network-ethereum-types';
import { ChainNetworkError } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getAccountSyncInterval, getNetworkConfig } from '../networkConfig';

/** What every EVM chain network needs to know about its symbol. */
export const getEthereumChainNetworkConfig = (symbol: NetworkSymbol) => {
    if (!isSupportedEthereumNetwork(symbol)) {
        throw new ChainNetworkError('unsupported-network', symbol);
    }

    const ethereumSymbol: EthereumNetworkSymbol = symbol;
    const config = getNetworkConfig(ethereumSymbol);

    return {
        decimals: config.decimals,
        accountSyncIntervalMs: getAccountSyncInterval(ethereumSymbol),
        hasFiatRate: !config.testnet,
        hasBlockbookRates: config.backendOptions.some(option => option.type === 'blockbook'),
    };
};
