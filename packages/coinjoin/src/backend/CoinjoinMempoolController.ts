import type { BlockbookTransaction, MempoolClient } from '../types/backend';
import { doesTxContainAddress } from './backendUtils';

export type MempoolController = {
    update(): Promise<void>;
    getTransactions(addresses: string[]): BlockbookTransaction[];
};

const isFulfilled = <T>(promise: PromiseSettledResult<T>): promise is PromiseFulfilledResult<T> =>
    promise.status === 'fulfilled';

export class CoinjoinMempoolController implements MempoolController {
    private readonly client;
    private mempool: { [txid: string]: BlockbookTransaction };

    constructor(client: MempoolClient) {
        this.client = client;
        this.mempool = {};
    }

    async update() {
        const txids = await this.client.fetchMempoolTxids();
        const entries = await Promise.allSettled(
            txids.map(async txid => {
                const tx = this.mempool[txid] ?? (await this.client.fetchTransaction(txid));
                return [txid, tx] as const;
            }),
        )
            .then(promises => promises.filter(isFulfilled)) // Failed fetchTransaction could be ignored
            .then(promises => promises.map(({ value }) => value));
        this.mempool = Object.fromEntries(entries);
    }

    getTransactions(addresses: string[]) {
        return Object.values(this.mempool).filter(tx =>
            addresses.some(address => doesTxContainAddress(address)(tx)),
        );
    }
}
