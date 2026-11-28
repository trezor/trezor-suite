import type { NetworkAssetsModule } from '@trezor/network-assets-types';
import { asNetworkSymbols, createNarrow } from '@trezor/network-module-types';

import type { IsWrappedNativeToken } from './IsWrappedNativeToken';
import type { SuiteCommonNetworkConfig } from './SuiteCommonNetworkConfig';
import type { SuiteCommonNetworkModule } from './SuiteCommonNetworkModule';
import type { AddressValidator } from './addressValidator/AddressValidator';
import type { NamedAddressResolver } from './namedAddressResolver/NamedAddressResolver';
import { createNamedAddressResolver } from './namedAddressResolver/createNamedAddressResolver';

/**
 * A module's own capabilities, stated in terms of the symbols that module supports.
 *
 * Network behavior takes the module's closed symbol type rather than the open `NetworkSymbol`.
 * `createNetworkModule` narrows behavior calls at the boundary; the repository routes icon calls.
 */
export type NetworkModuleDefinition<TNetworkSymbol extends string> = {
    icon: NetworkAssetsModule<TNetworkSymbol>;
    addressValidator: AddressValidator<TNetworkSymbol>;
    isWrappedNativeToken?: IsWrappedNativeToken<TNetworkSymbol>;

    /** Only for networks with a name system; see `NamedAddressResolver`. */
    namedAddressResolver?: NamedAddressResolver<TNetworkSymbol>;

    getNetworkConfig: (networkSymbol: TNetworkSymbol) => SuiteCommonNetworkConfig;

    getAccountSyncInterval: (networkSymbol: TNetworkSymbol) => number;
};

/**
 * Builds the module a shared layer sees from the capabilities a network actually implements.
 *
 * The module's closed symbol type is inferred from the list of networks it supports, which is
 * also the only check it needs: the open `NetworkSymbol` that shared layers pass is narrowed
 * against that list before network behavior is reached. A symbol the module does not support is
 * therefore rejected at its edge, and the capabilities themselves are written against the closed
 * symbol type with no per-call conversion.
 */
export const createNetworkModule = <TNetworkSymbol extends string>(
    supportedNetworks: readonly TNetworkSymbol[],
    definition: NetworkModuleDefinition<TNetworkSymbol>,
): SuiteCommonNetworkModule => {
    const narrow = createNarrow(supportedNetworks);

    const { isWrappedNativeToken, namedAddressResolver } = definition;

    return {
        icon: definition.icon,
        isWrappedNativeToken: isWrappedNativeToken && narrow(isWrappedNativeToken),
        addressValidator: {
            isAddressValid: narrow(definition.addressValidator.isAddressValid),
            getAddressType: narrow(definition.addressValidator.getAddressType),
        },
        namedAddressResolver:
            namedAddressResolver &&
            createNamedAddressResolver(namedAddressResolver, supportedNetworks),
        getSupportedNetworks: () => asNetworkSymbols(supportedNetworks),
        getNetworkConfig: narrow(definition.getNetworkConfig),
        getAccountSyncInterval: narrow(definition.getAccountSyncInterval),
    };
};
