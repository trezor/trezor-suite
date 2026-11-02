import { REF_TXS } from 'virtual:ref-txs';

import type { RefTransaction } from '@trezor/connect-common';

// Referenced transactions required by `signTransaction` fixtures, stored in `./refTxs/[network]/[hash].json`
// (same structure as trezor-firmware `tests/txcache`). They are injected at build time by `refTxsPlugin`
// (vitest.config.ts) so no `fs` reaches the browser. Missing tx? Generate it with `./refTxs/gen-reftx.ts`.

/** Get referenced transactions by the first 6 characters of their hashes. */
export const getRefTxs = (shortHashes: string[]): RefTransaction[] =>
    shortHashes.map(shortHash => {
        const refTx = REF_TXS[shortHash];
        if (!refTx) {
            throw new Error(`refTx fixture ${shortHash} not found`);
        }

        return refTx;
    });
