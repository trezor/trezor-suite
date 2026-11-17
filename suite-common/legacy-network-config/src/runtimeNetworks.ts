import { networks } from './networksConfig';
import type { Network, Networks } from './types';

const bundledSymbols: ReadonlySet<string> = new Set(Object.keys(networks));

// The registry type is closed over the bundled symbols; runtime registration widens it, so it is
// written through this open view of the very same object, which existing references keep seeing.
const openNetworks: Networks = networks;

const assertNotBundled = (symbol: string) => {
    if (bundledSymbols.has(symbol)) {
        throw new Error(`Network ${symbol} is bundled and cannot be changed at runtime.`);
    }
};

export const registerLegacyNetwork = (symbol: string, config: Network) => {
    assertNotBundled(symbol);
    openNetworks[symbol] = config;
};

export const unregisterLegacyNetwork = (symbol: string) => {
    assertNotBundled(symbol);
    delete openNetworks[symbol];
};
