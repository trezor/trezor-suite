import { type TokenDtoV2 } from '@suite-common/earn-stablecoin-defs';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module';
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
export { asNetworkSymbol, type NetworkSymbol };

/**
 * Used for some edge cases where extension of NetworkSymbol is necessary.
 * Autocomplete is working as expected but can be passed any string.
 */
export type NetworkSymbolExtended = NetworkSymbol | (string & {});

export type Network = Omit<SuiteCommonNetworkConfig, 'yieldXyzId'> & {
    readonly symbol: NetworkSymbol;
    /**
     * Maps a Suite network to Yield.xyz's network identifier. This provider-specific field is
     * retained here to preserve existing behavior; the earn domain should eventually own both
     * the external DTO type and the mapping.
     */
    readonly yieldXyzId: TokenDtoV2['network'] | null;
};

export type Networks = Readonly<Record<NetworkSymbol, Network>>;
