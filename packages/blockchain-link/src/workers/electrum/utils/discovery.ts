import type { ElectrumAPI, ElectrumHistoryTx as HistoryTx } from '@trezor/blockchain-link-types';

import { addressToScripthash } from './transform';

export type AddressHistory = {
    address: string;
    scripthash: string;
    path: string;
    history: HistoryTx[];
    empty: boolean;
};

// The `blockchain.scripthash.get_history` response is raw JSON-RPC data from a user-selectable
// (and MITM-able) Electrum server and is not runtime-validated. A non-array response makes any
// downstream `.map`/`.filter`/`.length` deref (getTransactions, getAccountInfo, discoverAddress)
// throw, and a null record makes the `{ tx_hash }` destructure in getTransactions throw — either
// aborts the whole per-account request (history/balance DoS). Coerce to an array and drop malformed
// records at this untrusted-data boundary so the valid history still loads.
export const sanitizeHistory = (history: unknown): HistoryTx[] =>
    Array.isArray(history)
        ? history.filter(
              (h): h is HistoryTx =>
                  h != null && typeof h === 'object' && (h as HistoryTx).tx_hash != null,
          )
        : [];

export const discoverAddress =
    (client: ElectrumAPI) =>
    async ({ address, path }: { address: string; path: string }): Promise<AddressHistory> => {
        const scripthash = addressToScripthash(address, client.getInfo()?.network);
        const history = sanitizeHistory(
            await client.request('blockchain.scripthash.get_history', scripthash),
        );

        return {
            address,
            scripthash,
            path,
            history,
            empty: !history.length,
        };
    };
