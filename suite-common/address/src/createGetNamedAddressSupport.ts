import type { NetworkModuleRepositoryDep, NetworkSymbol } from '@suite-common/networks';
import type { NamedAddressResolver } from '@trezor/network-module-suite-common-types';

export type SymbolNamedAddressResolver = NamedAddressResolver<NetworkSymbol>;

/**
 * The resolver arrives with `isSupported`, so support can never be claimed without one.
 * `isNameLike` answers either way: a name typed on a chain ENS does not cover still has to be
 * told apart from a malformed address.
 */
export type NamedAddressSupport = {
    /** Shape check in the network's name syntax; answers even where names cannot be resolved. */
    isNameLike: (value: string) => boolean;
} & ({ isSupported: true; resolver: SymbolNamedAddressResolver } | { isSupported: false });

export type GetNamedAddressSupportDeps = NetworkModuleRepositoryDep;

export type GetNamedAddressSupport = (
    symbol: NetworkSymbol | null | undefined,
) => NamedAddressSupport;

export type GetNamedAddressSupportDep = {
    getNamedAddressSupport: GetNamedAddressSupport;
};

export const selectGetNamedAddressSupportDep = (services: any): GetNamedAddressSupportDep => ({
    getNamedAddressSupport: services.getNamedAddressSupport,
});

/**
 * What the network behind a symbol can do with names. Everything name-related in the app goes
 * through the owning network module, so no caller has to know which networks have a name system
 * or what a name looks like there.
 */
export const createGetNamedAddressSupport =
    (deps: GetNamedAddressSupportDeps): GetNamedAddressSupport =>
    symbol => {
        const resolver = symbol
            ? deps.networkModuleRepository.get(symbol).namedAddressResolver
            : undefined;
        const isNameLike = (value: string) => !!resolver?.isNameLike(value);

        if (!symbol || !resolver?.supportsNamedAddress(symbol)) {
            return { isSupported: false, isNameLike };
        }

        return { isSupported: true, isNameLike, resolver };
    };
