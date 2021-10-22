import { deriveAddresses } from './derivation';
import { addressToScripthash } from './transform';
import type { ElectrumAPI, HistoryTx } from '../../../types/electrum';

const DISCOVERY_LOOKOUT = 20;

export type AddressHistory = {
    address: string;
    scripthash: string;
    path: string;
    history: HistoryTx[];
};

const countUnusedFromEnd = (array: AddressHistory[]): number => {
    const boundary = array.length > DISCOVERY_LOOKOUT ? array.length - DISCOVERY_LOOKOUT : 0;
    for (let i = array.length; i > boundary; --i) {
        if (array[i - 1].history.length) {
            return array.length - i;
        }
    }
    return array.length;
};

const discoverAddress =
    (client: ElectrumAPI) =>
    async ({
        address,
        path,
    }: ReturnType<typeof deriveAddresses>[number]): Promise<AddressHistory> => {
        const scripthash = addressToScripthash(address);
        const history = await client.request('blockchain.scripthash.get_history', scripthash);
        return {
            address,
            scripthash,
            path,
            history,
        };
    };

export const discovery = (client: ElectrumAPI, xpub: string, type: 'receive' | 'change') => {
    const discoverRecursive = async (
        from: number,
        prev: AddressHistory[]
    ): Promise<AddressHistory[]> => {
        const unused = countUnusedFromEnd(prev);
        if (unused >= DISCOVERY_LOOKOUT) return prev;
        const moreCount = DISCOVERY_LOOKOUT - unused;
        const addresses = deriveAddresses(xpub, type, from, moreCount);
        const more = await Promise.all(addresses.map(discoverAddress(client)));
        return discoverRecursive(from + moreCount, prev.concat(more));
    };
    return discoverRecursive(0, []);
};
