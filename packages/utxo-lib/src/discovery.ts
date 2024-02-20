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
        if (!isUnused(array[i - 1])) {
            return array.length - i;
        }
    }

    return array.length;
};

export const discovery = <T>(
    discover: (addr: AddressInfo) => Promise<AddressResult<T>>,
    xpub: string,
    type: 'receive' | 'change',
    network?: Network,
    lookout: number = DISCOVERY_LOOKOUT,
) => {
    const discoverRecursive = async (
        from: number,
        prev: AddressResult<T>[],
    ): Promise<AddressResult<T>[]> => {
        const unused = countUnusedFromEnd(prev, a => a.empty, lookout);
        if (unused >= lookout) return prev;
        const moreCount = lookout - unused;
        const addresses = deriveAddresses(xpub, type, from, moreCount, network);
        const more = await Promise.all(addresses.map(discover));

        return discoverRecursive(from + moreCount, prev.concat(more));
    };

    return discoverRecursive(0, []);
};
