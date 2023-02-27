import { isNotUndefined, promiseAllSequence } from '@trezor/utils';

import type { BlockbookTransaction, MempoolClient } from '../types/backend';
import { doesTxContainAddress } from './backendUtils';

export type MempoolController = {
    update(): Promise<void>;
    getTransactions(addresses: string[]): BlockbookTransaction[];
};

export class CoinjoinMempoolController implements MempoolController {
    private readonly client;
    private mempool: { [txid: string]: BlockbookTransaction };

    constructor(client: MempoolClient) {
        this.client = client;
        this.mempool = {};
    }

    async update() {
        const txids = await this.client.fetchMempoolTxids();
        const entries = await promiseAllSequence(
            txids.map(
                txid => () =>
                    this.mempool[txid]
                        ? Promise.resolve(this.mempool[txid])
                        : this.client.fetchTransaction(txid).catch(() => undefined),
            ),
        )
            .then(txs => txs.filter(isNotUndefined)) // Failed fetchTransaction could be ignored
            .then(txs => txs.map(tx => [tx.txid, tx] as const));
        this.mempool = Object.fromEntries(entries);
    }

    getTransactions(addresses: string[]) {
        return Object.values(this.mempool).filter(tx =>
            addresses.some(address => doesTxContainAddress(address)(tx)),
        );
    }
}
