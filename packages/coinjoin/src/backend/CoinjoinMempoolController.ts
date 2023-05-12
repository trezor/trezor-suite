/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */

import type { Network } from '@trezor/utxo-lib';
import { promiseAllSequence } from '@trezor/utils';

import type { Logger } from '../types';
import type { BlockbookTransaction, MempoolClient } from '../types/backend';
import { getMempoolAddressScript, getMempoolFilter } from './filters';
import { doesTxContainAddress } from './backendUtils';
import { MEMPOOL_PURGE_CYCLE } from '../constants';

type MempoolStatus = 'stopped' | 'running';

export type MempoolController = {
    get status(): MempoolStatus;
    start(): Promise<void>;
    init(addresses: string[]): Promise<void>;
    update(force?: boolean): Promise<void>;
    getTransactions(addresses: string[]): BlockbookTransaction[];
};

type CoinjoinMempoolControllerSettings = {
    client: MempoolClient;
    network: Network;
    filter?: (tx: BlockbookTransaction) => boolean;
    logger?: Logger;
};

export class CoinjoinMempoolController implements MempoolController {
    private readonly client;
    private readonly network;
    private readonly mempool;
    private readonly logger;
    private readonly filter;
    private readonly onTx;
    private lastPurge;
    private _status: MempoolStatus;

    get status() {
        return this._status;
    }

    constructor({ client, network, filter, logger }: CoinjoinMempoolControllerSettings) {
        this.client = client;
        this.network = network;
        this.mempool = new Map<string, BlockbookTransaction>();
        this.logger = logger;
        this.filter = filter;
        this.onTx = this.onMempoolTx.bind(this);
        this.lastPurge = new Date().getTime();
        this._status = 'stopped';
    }

    private onMempoolTx(tx: BlockbookTransaction) {
        if (this.filter?.(tx) ?? true) {
            this.logger?.debug(`WS mempool ${tx.txid}`);
            this.mempool.set(tx.txid, tx);
        }
    }

    async init(addresses: string[]) {
        const filters = await this.client.fetchMempoolFilters();
        const scripts = addresses.map(addr => getMempoolAddressScript(addr, this.network));
        this.logger?.info(`mempool filtering ${Object.keys(filters).length} txs START`);
        const txids = Object.entries(filters)
            .filter(([txid, filter]) => {
                const isMatch = getMempoolFilter(filter, txid);
                return scripts.some(isMatch);
            })
            .map(([txid]) => txid);
        this.logger?.info('mempool filtering END');
        this.logger?.info(`init fetching ${txids.length} txs START`);
        await promiseAllSequence(
            txids.map(txid => () => this.client.fetchTransaction(txid).then(this.onTx)),
        );
        this.logger?.info('init fetching txs END');
        this.lastPurge = new Date().getTime();
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

    async update(force?: boolean) {
        const now = new Date().getTime();
        if (now - this.lastPurge < MEMPOOL_PURGE_CYCLE && !force) return;
        this.lastPurge = now;

        const mempoolTxids = await this.client
            .fetchMempoolFilters()
            .then(filters => Object.keys(filters));
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
