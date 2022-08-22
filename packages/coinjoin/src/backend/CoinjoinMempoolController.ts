import type { BlockbookTransaction, MempoolClient } from './types';
import { doesTxContainAddress } from './utils';

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
        const entries = await Promise.all(
            txids.map(async txid => {
                const tx = this.mempool[txid] ?? (await this.client.fetchTransaction(txid));
                return [txid, tx] as const;
            }),
        );
        this.mempool = Object.fromEntries(entries);
    }

    getTransactions(addresses: string[]) {
        return Object.values(this.mempool).filter(tx =>
            addresses.some(address => doesTxContainAddress(address)(tx)),
        );
    }
}
