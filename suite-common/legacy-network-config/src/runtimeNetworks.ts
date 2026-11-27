import type { SuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types';

import { networks } from './networksConfig';
import type { Network, Networks } from './types';

// A runtime network also backs a network module, which needs the fields the legacy type omits.
export type RuntimeNetwork = Network & Pick<SuiteCommonNetworkConfig, 'color' | 'protocols'>;

const predefinedSymbols: ReadonlySet<string> = new Set(Object.keys(networks));

// The registry type is closed over the predefined symbols; runtime registration widens it, so it is
// written through this open view of the very same object, which existing references keep seeing.
const openNetworks: Networks = networks;

const runtimeNetworks = new Map<string, RuntimeNetwork>();

const assertNotPredefined = (symbol: string) => {
    if (predefinedSymbols.has(symbol)) {
        throw new Error(`Network ${symbol} is predefined and cannot be changed at runtime.`);
    }
};

export const registerLegacyNetwork = (symbol: string, config: RuntimeNetwork) => {
    assertNotPredefined(symbol);
    openNetworks[symbol] = config;
    runtimeNetworks.set(symbol, config);
};

export const unregisterLegacyNetwork = (symbol: string) => {
    assertNotPredefined(symbol);
    delete openNetworks[symbol];
    runtimeNetworks.delete(symbol);
};

export const getRuntimeLegacyNetworks = (): ReadonlyMap<string, RuntimeNetwork> => runtimeNetworks;
