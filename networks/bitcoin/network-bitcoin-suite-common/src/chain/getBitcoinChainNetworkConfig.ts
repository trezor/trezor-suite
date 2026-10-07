import { isSupportedBitcoinNetwork } from '@trezor/network-bitcoin-types';
import { readChainNetworkConfig } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getAccountSyncInterval, getNetworkConfig } from '../networkConfig';

/** What every Bitcoin-like chain network needs to know about its symbol. */
export const getBitcoinChainNetworkConfig = (symbol: NetworkSymbol) =>
    readChainNetworkConfig(
        { isSupportedNetwork: isSupportedBitcoinNetwork, getNetworkConfig, getAccountSyncInterval },
        symbol,
    );
