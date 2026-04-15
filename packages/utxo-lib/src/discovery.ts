import { deriveAddresses } from './derivation';
import type { Network } from './networks';

const DISCOVERY_LOOKOUT = 20;

export type AddressInfo = ReturnType<typeof deriveAddresses>[number];

export type AddressResult<T> = T & {
    empty: boolean;
};

export const countUnusedFromEnd = <T>(
    array: T[],
    isUnused: (t: T) => boolean,
    lookout: number,
): number => {
    const boundary = array.length > lookout ? array.length - lookout : 0;
    for (let i = array.length; i > boundary; --i) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const item: T = array[i - 1];
        if (!isUnused(item)) {
            return array.length - i;
        }
    }

    return array.length;
};

type AddressType = 'receive' | 'change';

export const createAddressCache = (network: Network | undefined) => {
    const cache: Record<`${string}/${AddressType}`, AddressInfo[]> = {};

    return (xpub: string, type: AddressType) => {
        const key = `${xpub}/${type}` as const;

        const getAllDerived = () => cache[key] ?? [];

        const getAddresses = (from: number, count: number) => {
            const derived = cache[key] ?? [];
            const needed = from + count - derived.length;
            if (needed > 0) {
                const newDerived = deriveAddresses(xpub, type, derived.length, needed, network);
                cache[key] = derived.concat(newDerived);
            }

            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const cached: AddressInfo[] = cache[key];

            return cached.slice(from, from + count);
        };

        return { getAllDerived, getAddresses };
    };
};

export type AddressCache = ReturnType<typeof createAddressCache>;
export type AddressProvider = ReturnType<AddressCache>;

export const discovery = async <T>(
    discover: (addr: AddressInfo) => Promise<AddressResult<T>>,
    addressProvider: AddressProvider,
    lookout: number = DISCOVERY_LOOKOUT,
) => {
    const discoverRecursive = async (
        from: number,
        prev: AddressResult<T>[],
    ): Promise<AddressResult<T>[]> => {
        const unused = countUnusedFromEnd(prev, a => a.empty, lookout);
        if (unused >= lookout) return prev;
        const count = lookout - unused;
        const addresses = addressProvider.getAddresses(from, count);
        const more = await Promise.all(addresses.map(discover));

        return discoverRecursive(from + count, prev.concat(more));
    };

    const known = await Promise.all(addressProvider.getAllDerived().map(discover));

    return discoverRecursive(known.length, known);
};
