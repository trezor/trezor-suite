import { type Network as LegacyNetwork, networks } from '@suite-common/legacy-network-config';

import type { NetworkSymbol } from './NetworkModules';

export type LegacyNetworkConfigs = typeof networks;

// Preserve the existing wallet-config API during the transition to Redux selectors.
// This compatibility bridge disappears when all network configuration comes from modules.
export const getLegacyNetworkConfigs = (): LegacyNetworkConfigs => networks;

export type Network = Omit<LegacyNetwork, 'symbol' | 'settlementLayer'> & {
    symbol: NetworkSymbol;
    settlementLayer?: NetworkSymbol;
};

export type Networks = {
    [Symbol in NetworkSymbol]: Network & { symbol: Symbol };
};
