/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */

import type { Network } from '@trezor/utxo-lib';
import { promiseAllSequence, arrayDistinct } from '@trezor/utils';

import type { Logger } from '../types';
import type { BlockbookTransaction, MempoolClient } from '../types/backend';
import { getMempoolAddressScript, getMempoolFilter } from './filters';
import { getAllTxAddresses } from './backendUtils';
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
    filter?: (address: string) => boolean;
    logger?: Logger;
};

export class CoinjoinMempoolController implements MempoolController {
    private readonly client;
    private readonly network;
    private readonly mempool;
    private readonly addressTxids;
    private readonly logger;
    private readonly filter;
    private readonly onTxAdd;
    private readonly onTxRemove;
    private lastPurge;
    private _status: MempoolStatus;

    get status() {
        return this._status;
    }

    constructor({ client, network, filter, logger }: CoinjoinMempoolControllerSettings) {
        this.client = client;
        this.network = network;
        this.mempool = new Map<string, BlockbookTransaction>();
        this.addressTxids = new Map<string, string[]>();
        this.logger = logger;
        this.filter = filter;
        this.onTxAdd = this.onTransactionAdd.bind(this);
        this.onTxRemove = this.onTransactionRemove.bind(this);
        this.lastPurge = new Date().getTime();
        this._status = 'stopped';
    }

    private onTransactionAdd(tx: BlockbookTransaction) {
        const filteredAddresses = getAllTxAddresses(tx).filter(this.filter ?? (() => true));
        if (filteredAddresses.length) {
            this.logger?.debug(`WS mempool ${tx.txid}`);
            this.mempool.set(tx.txid, tx);
            filteredAddresses.forEach(address => {
                const record = this.addressTxids.get(address);
                if (record) record.push(tx.txid);
                else this.addressTxids.set(address, [tx.txid]);
            });
        }
    }

    private onTransactionRemove(txid: string) {
        const tx = this.mempool.get(txid);
        if (tx) {
            const addresses = getAllTxAddresses(tx);
            addresses.forEach(address => {
                const addressTxids = this.addressTxids.get(address);
                if (addressTxids) {
                    const newAddressTxids = addressTxids.filter(addrTxid => addrTxid !== tx.txid);
                    if (newAddressTxids.length) this.addressTxids.set(address, newAddressTxids);
                    else this.addressTxids.delete(address);
                }
            });
            this.mempool.delete(txid);
        }
    }

    async init(addresses: string[]) {
        const filters = await this.client.fetchMempoolFilters();
        const scripts = addresses.map(addr => getMempoolAddressScript(addr, this.network));
        const txids = Object.entries(filters)
            .filter(([txid, filter]) => {
                const isMatch = getMempoolFilter(filter, txid);
                return scripts.some(isMatch);
            })
            .map(([txid]) => txid);
        await promiseAllSequence(
            txids.map(
                txid => () =>
                    this.client
                        .fetchTransaction(txid)
                        .then(this.onTxAdd)
                        .catch(() => {}), // Missing txs can be ignored
            ),
        );
        this.lastPurge = new Date().getTime();
    }

    async start() {
        if (this._status === 'running') return;
        await this.client.subscribeMempoolTxs(this.onTxAdd);
        this._status = 'running';
    }

    async stop() {
        if (this._status === 'stopped') return;
        await this.client.unsubscribeMempoolTxs(this.onTxAdd);
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
        removeTxids.forEach(this.onTxRemove);
    }

    getTransactions(addresses?: string[]) {
        if (!addresses) return Array.from(this.mempool.values());
        return addresses
            .flatMap(address => this.addressTxids.get(address) ?? [])
            .filter(arrayDistinct)
            .map(txid => this.mempool.get(txid)!);
    }
}
