import { type TokenDtoV2 } from '@suite-common/earn-stablecoin-defs';
import type { NetworkSymbol } from '@suite-common/networks';
import type { SuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types';

export {
    TREZOR_CONNECT_BACKENDS,
    type AccountType,
    type BackendType,
    type Explorer,
    type NetworkAccount,
    type NetworkDisplaySymbol,
    type NetworkFeature,
    type NetworkType,
    type ServerType,
    type TrezorConnectBackendType,
} from '@trezor/network-module-suite-common-types';
export type { NetworkSymbol };

export const asNetworkSymbol = (symbol: string): NetworkSymbol => symbol as NetworkSymbol;
export const toNetworkSymbolNonTestnet = asNetworkSymbol;

/**
 * Used for some edge cases where extension of NetworkSymbol is necessary.
 * Autocomplete is working as expected but can be passed any string.
 */
export type NetworkSymbolExtended = NetworkSymbol | (string & {});

export type Network = Omit<SuiteCommonNetworkConfig, 'settlementLayer' | 'yieldXyzId'> & {
    readonly symbol: NetworkSymbol;
    readonly settlementLayer?: NetworkSymbol;
    readonly yieldXyzId: TokenDtoV2['network'] | null;
};

export type Networks = {
    readonly [key in NetworkSymbol]: Network;
};
