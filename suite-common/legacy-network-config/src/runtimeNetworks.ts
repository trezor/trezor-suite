import { networks } from './networksConfig';
import type { Network, Networks } from './types';

const predefinedSymbols: ReadonlySet<string> = new Set(Object.keys(networks));

// The registry type is closed over the predefined symbols; runtime registration widens it, so it is
// written through this open view of the very same object, which existing references keep seeing.
const openNetworks: Networks = networks;

const assertNotPredefined = (symbol: string) => {
    if (predefinedSymbols.has(symbol)) {
        throw new Error(`Network ${symbol} is predefined and cannot be changed at runtime.`);
    }
};

export const registerLegacyNetwork = (symbol: string, config: Network) => {
    assertNotPredefined(symbol);
    openNetworks[symbol] = config;
};

export const unregisterLegacyNetwork = (symbol: string) => {
    assertNotPredefined(symbol);
    delete openNetworks[symbol];
};
