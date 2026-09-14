import type { TokenDtoV2 } from '@suite-common/earn-stablecoin-defs';
import type { SuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types';

import type { NetworkSymbol } from './NetworkModules';

export type Network = Omit<
    SuiteCommonNetworkConfig<NetworkSymbol>,
    // TODO: Remove these legacy omissions and the Yield API override once configs are modularized.
    // Tracked in https://github.com/trezor/trezor-suite/issues/30663.
    'yieldXyzId' | 'color' | 'protocols'
> & {
    symbol: NetworkSymbol;
    yieldXyzId: TokenDtoV2['network'] | null;
};

// TODO: Replace this legacy symbol refinement with module-owned config types after modularization.
// Tracked in https://github.com/trezor/trezor-suite/issues/30663.
export type Networks = { [Symbol in NetworkSymbol]: Network & { symbol: Symbol } };
