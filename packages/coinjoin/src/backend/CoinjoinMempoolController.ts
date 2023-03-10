/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */

import type { BlockbookTransaction, MempoolClient } from '../types/backend';
import { doesTxContainAddress } from './backendUtils';

type MempoolStatus = 'stopped' | 'running';

export type MempoolController = {
    get status(): MempoolStatus;
    start(): Promise<void>;
    update(): Promise<void>;
    getTransactions(addresses: string[]): BlockbookTransaction[];
};

export class CoinjoinMempoolController implements MempoolController {
    private readonly client;
    private readonly mempool;
    private readonly onTx;
    private _status: MempoolStatus;

    get status() {
        return this._status;
    }

    constructor(client: MempoolClient) {
        this.client = client;
        this.mempool = new Map<string, BlockbookTransaction>();
        this.onTx = (tx: BlockbookTransaction) => this.mempool.set(tx.txid, tx);
        this._status = 'stopped';
    }

    async start() {
        if (this._status === 'running') return;
        await this.client.subscribeMempoolTxs(this.onTx);
        this._status = 'running';
    }

    async stop() {
        if (this._status === 'stopped') return;
        await this.client.unsubscribeMempoolTxs(this.onTx);
        this._status = 'stopped';
    }

    async update() {
        const mempoolTxids = await this.client.fetchMempoolTxids();
        const keepTxids = mempoolTxids.filter(txid => this.mempool.has(txid));
        const removeTxids = Array.from(this.mempool.keys()).filter(
            txid => !keepTxids.includes(txid),
        );
        removeTxids.forEach(txid => this.mempool.delete(txid));
    }

    getTransactions(addresses?: string[]) {
        const txs = Array.from(this.mempool.values());
        return !addresses
            ? txs
            : txs.filter(tx => addresses.some(address => doesTxContainAddress(address)(tx)));
    }
}
