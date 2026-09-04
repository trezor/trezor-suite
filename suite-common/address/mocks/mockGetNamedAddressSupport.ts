import { type GetNamedAddressSupport, type SymbolNamedAddressResolver } from '../src';

/** No network resolves names until a resolver is passed in. */
export const mockGetNamedAddressSupport =
    (resolver?: SymbolNamedAddressResolver): GetNamedAddressSupport =>
    symbol => {
        const isNameLike = (value: string) => !!resolver?.isNameLike(value);

        if (!symbol || !resolver?.supportsNamedAddress(symbol)) {
            return { isSupported: false, isNameLike };
        }

        return { isSupported: true, isNameLike, resolver };
    };
