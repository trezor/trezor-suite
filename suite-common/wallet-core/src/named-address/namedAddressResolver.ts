import type { NetworkModuleRepository, NetworkSymbol } from '@suite-common/networks';
import type { NamedAddressResolver } from '@trezor/network-module-suite-common-types';

export type SymbolNamedAddressResolver = NamedAddressResolver<NetworkSymbol>;

export type NamedAddressSupport = {
    /** Whether names can be resolved for this symbol — ENS, for one, covers a few chains only. */
    isSupported: boolean;

    /** Shape check in the network's name syntax; answers even where names cannot be resolved. */
    isNameLike: (value: string) => boolean;

    /** The resolver, present only when `isSupported`. */
    resolver: SymbolNamedAddressResolver | undefined;
};

/**
 * What the network behind a symbol can do with names. Everything name-related in the app goes
 * through the owning network module, so no caller has to know which networks have a name system
 * or what a name looks like there.
 */
export const getNamedAddressSupport = (
    networkModuleRepository: NetworkModuleRepository,
    symbol: NetworkSymbol | null | undefined,
): NamedAddressSupport => {
    const resolver = symbol ? networkModuleRepository.get(symbol).namedAddressResolver : undefined;
    const isSupported = !!symbol && !!resolver?.supportsNamedAddress(symbol);

    return {
        isSupported,
        isNameLike: value => !!resolver?.isNameLike(value),
        resolver: isSupported ? resolver : undefined,
    };
};
