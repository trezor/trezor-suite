import { addressToScripthash } from './transform';
import type { ElectrumAPI, HistoryTx } from '@trezor/blockchain-link-types/lib/electrum';

export type AddressHistory = {
    address: string;
    scripthash: string;
    path: string;
    history: HistoryTx[];
    empty: boolean;
};

export const discoverAddress =
    (client: ElectrumAPI) =>
    async ({ address, path }: { address: string; path: string }): Promise<AddressHistory> => {
        const scripthash = addressToScripthash(address, client.getInfo()?.network);
        const history = await client.request('blockchain.scripthash.get_history', scripthash);

        return {
            address,
            scripthash,
            path,
            history,
            empty: !history.length,
        };
    };
