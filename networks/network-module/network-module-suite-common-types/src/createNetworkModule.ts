import { type NetworkSymbol, asNetworkSymbols } from '@trezor/network-module/constants';
import { isArrayMember } from '@trezor/utils';

import type { AddressValidator } from './AddressValidator';
import type { NamedAddressResolver } from './NamedAddressResolver';
import type { SuiteCommonNetworkConfig } from './SuiteCommonNetworkConfig';
import type { SuiteCommonNetworkModule } from './SuiteCommonNetworkModule';

/**
 * A module's own capabilities, stated in terms of the symbols that module supports.
 *
 * Everything here takes the module's closed symbol type rather than the open `NetworkSymbol`:
 * `createNetworkModule` narrows once at the boundary, so a module never restates the check.
 */
export type NetworkModuleDefinition<TSymbol extends string> = {
    addressValidator: AddressValidator<TSymbol>;

    /** Only for networks with a name system; see `NamedAddressResolver`. */
    namedAddressResolver?: NamedAddressResolver<TSymbol>;

    getNetworkConfig: (symbol: TSymbol) => SuiteCommonNetworkConfig;
};

/**
 * Builds the module a shared layer sees from the capabilities a network actually implements.
 *
 * The module's closed symbol type is inferred from the list of networks it supports, which is
 * also the only check it needs: the open `NetworkSymbol` that shared layers pass is narrowed
 * against that list before any capability is reached. A symbol the module does not support is
 * therefore rejected at its edge, and the capabilities themselves are written against the closed
 * symbol type with no per-call conversion.
 */
export const createNetworkModule = <TSymbol extends string>(
    supportedNetworks: readonly TSymbol[],
    definition: NetworkModuleDefinition<TSymbol>,
): SuiteCommonNetworkModule => {
    const isSupportedNetwork = (symbol: string): symbol is TSymbol =>
        isArrayMember(symbol, supportedNetworks);

    const narrow = (symbol: NetworkSymbol): TSymbol => {
        if (!isSupportedNetwork(symbol)) {
            throw new Error(
                `Unsupported network symbol: ${symbol}. Supported: ${supportedNetworks.join(', ')}.`,
            );
        }

        return symbol;
    };

    const addressValidator: AddressValidator<NetworkSymbol> = {
        isAddressValid: (address, symbol) =>
            definition.addressValidator.isAddressValid(address, narrow(symbol)),
        getAddressType: (address, symbol) =>
            definition.addressValidator.getAddressType(address, narrow(symbol)),
    };

    const resolver = definition.namedAddressResolver;
    const namedAddressResolver: NamedAddressResolver<NetworkSymbol> | undefined = resolver && {
        supportsNamedAddress: symbol => resolver.supportsNamedAddress(narrow(symbol)),
        isNameLike: resolver.isNameLike,
        isAddressLike: resolver.isAddressLike,
        resolveNamedAddress: (value, symbol) => resolver.resolveNamedAddress(value, narrow(symbol)),
        reverseResolveAddress: (address, symbol) =>
            resolver.reverseResolveAddress(address, narrow(symbol)),
    };

    return {
        addressValidator,
        namedAddressResolver,
        getSupportedNetworks: () => asNetworkSymbols(supportedNetworks),
        isSupportedNetwork,
        getNetworkConfig: symbol => definition.getNetworkConfig(narrow(symbol)),
    };
};
