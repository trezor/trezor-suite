import type { NetworkAssetsModule } from '@trezor/network-assets-types';
import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module-types';
import { isArrayMember } from '@trezor/utils';

import type { IsWrappedNativeToken } from './IsWrappedNativeToken';
import type { SuiteCommonNetworkConfig } from './SuiteCommonNetworkConfig';
import type { SuiteCommonNetworkModule } from './SuiteCommonNetworkModule';
import type { AddressValidator } from './addressValidator/AddressValidator';
import type { NamedAddressResolver } from './namedAddressResolver/NamedAddressResolver';
import { createNamedAddressResolver } from './namedAddressResolver/createNamedAddressResolver';
import type { NetworkSignVerify } from './signVerify/NetworkSignVerify';
import { createNetworkSignVerify } from './signVerify/createNetworkSignVerify';

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

    getNetworkConfig: (symbol: TNetworkSymbol) => SuiteCommonNetworkConfig;

    getAccountSyncInterval: (symbol: TNetworkSymbol) => number;

    signVerify?: NetworkSignVerify<TNetworkSymbol>;
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
    const isSupportedNetwork = (symbol: string): symbol is TNetworkSymbol =>
        isArrayMember(symbol, supportedNetworks);

    const narrow = (symbol: NetworkSymbol): TNetworkSymbol => {
        if (!isSupportedNetwork(symbol)) {
            throw new Error(
                `Unsupported network symbol: ${symbol}. Supported: ${supportedNetworks.join(', ')}.`,
            );
        }

        return symbol;
    };

    const { isWrappedNativeToken, namedAddressResolver, signVerify } = definition;

    return {
        icon: definition.icon,
        isWrappedNativeToken: isWrappedNativeToken
            ? (symbol, contract) => isWrappedNativeToken(narrow(symbol), contract)
            : undefined,
        addressValidator: {
            isAddressValid: (address, symbol) =>
                definition.addressValidator.isAddressValid(address, narrow(symbol)),
            getAddressType: (address, symbol) =>
                definition.addressValidator.getAddressType(address, narrow(symbol)),
        },
        namedAddressResolver:
            namedAddressResolver &&
            createNamedAddressResolver(namedAddressResolver, isSupportedNetwork, narrow),
        getSupportedNetworks: () => asNetworkSymbols(supportedNetworks),
        getNetworkConfig: symbol => definition.getNetworkConfig(narrow(symbol)),
        getAccountSyncInterval: symbol => definition.getAccountSyncInterval(narrow(symbol)),
        signVerify: signVerify && createNetworkSignVerify(signVerify, narrow),
    };
};
