import type { TokenDtoV2 } from '@suite-common/earn-stablecoin-defs';
import type { SuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types';

import type { NetworkSymbol } from './NetworkModules';

/**
 * A specific blockchain network, such as Ethereum mainnet or Sepolia.
 * Mainnet and testnet are separate networks, each identified by its NetworkSymbol.
 *
 * @see https://github.com/trezor/trezor-suite/blob/develop/docs/ubiquitous-language.md
 */
export type Network = Omit<
    SuiteCommonNetworkConfig,
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
