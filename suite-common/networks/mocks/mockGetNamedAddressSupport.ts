import type {
    GetNamedAddressSupport,
    SymbolNamedAddressResolver,
} from '../src/createGetNamedAddressSupport';

export const mockGetNamedAddressSupport =
    (resolver?: SymbolNamedAddressResolver): GetNamedAddressSupport =>
    symbol => {
        const isSupported = !!symbol && !!resolver?.supportsNamedAddress(symbol);

        return {
            isSupported,
            isNameLike: value => !!resolver?.isNameLike(value),
            resolver: isSupported ? resolver : undefined,
        };
    };
