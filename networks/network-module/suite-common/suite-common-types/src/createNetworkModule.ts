import type { NetworkAssetsModule } from '@trezor/network-assets-types';
import { isArrayMember } from '@trezor/utils';

import type { IsWrappedNativeToken } from './IsWrappedNativeToken';
import type { SuiteCommonNetworkConfig } from './SuiteCommonNetworkConfig';
import type { AddressValidator } from './addressValidator/AddressValidator';
import type { NamedAddressResolver } from './namedAddressResolver/NamedAddressResolver';
import type { NetworkSignVerify } from './signVerify/NetworkSignVerify';

/**
 * A module's own capabilities, stated in terms of the symbols that module supports.
 *
 * Network behavior takes the module's closed symbol type rather than the open `NetworkSymbol`.
 * `openNetworkModule` narrows behavior calls at the boundary; the repository routes icon calls.
 */
export type NetworkModuleDefinition<TNetworkSymbol extends string> = {
    icon: NetworkAssetsModule<TNetworkSymbol>;
    addressValidator: AddressValidator<TNetworkSymbol>;
    isWrappedNativeToken?: IsWrappedNativeToken<TNetworkSymbol>;

    /** Only for networks with a name system; see `NamedAddressResolver`. */
    namedAddressResolver?: NamedAddressResolver<TNetworkSymbol>;

    getNetworkConfig: (symbol: TNetworkSymbol) => SuiteCommonNetworkConfig;

    getAccountSyncInterval: (symbol: TNetworkSymbol) => number;

    signVerify?: NetworkSignVerify<TNetworkSymbol>;
};

/**
 * A network module as its network package sees it: every capability keeps the closed symbol
 * type, so layers built on top of it (Suite, Suite Native) know exactly which symbols they serve.
 * Only an app root opens it to the open `NetworkSymbol`, with `openNetworkModule`.
 */
export type NetworkModule<TNetworkSymbol extends string> =
    NetworkModuleDefinition<TNetworkSymbol> & {
        getSupportedNetworks: () => readonly TNetworkSymbol[];
        isSupportedNetwork: (symbol: string) => symbol is TNetworkSymbol;
    };

/**
 * Builds a network module from the capabilities a network actually implements.
 *
 * The module's closed symbol type is inferred from the list of networks it supports, and the
 * capabilities are written against that closed type with no per-call conversion.
 */
export const createNetworkModule = <TNetworkSymbol extends string>(
    supportedNetworks: readonly TNetworkSymbol[],
    definition: NetworkModuleDefinition<TNetworkSymbol>,
): NetworkModule<TNetworkSymbol> => ({
    ...definition,
    getSupportedNetworks: () => supportedNetworks,
    isSupportedNetwork: (symbol: string): symbol is TNetworkSymbol =>
        isArrayMember(symbol, supportedNetworks),
});
