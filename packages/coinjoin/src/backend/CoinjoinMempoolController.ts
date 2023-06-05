/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */

import type { Network } from '@trezor/utxo-lib';
import { promiseAllSequence } from '@trezor/utils';

import type { Logger } from '../types';
import type { BlockbookTransaction, MempoolClient } from '../types/backend';
import type { AddressController } from './CoinjoinAddressController';
import { getMempoolAddressScript, getMempoolFilter } from './filters';
import { getAllTxAddresses } from './backendUtils';
import { MEMPOOL_PURGE_CYCLE } from '../constants';

type MempoolStatus = 'stopped' | 'running';

export type MempoolController = {
    get status(): MempoolStatus;
    start(): Promise<void>;
    init(...addressControllers: AddressController[]): Promise<BlockbookTransaction[]>;
    update(force?: boolean): Promise<void>;
    getTransactions(...addressControllers: AddressController[]): BlockbookTransaction[];
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

    async init(...addressControllers: AddressController[]) {
        const filters = await this.client
            .fetchMempoolFilters()
            .then(res =>
                Object.entries(res).map(
                    ([txid, filter]) => [txid, getMempoolFilter(filter, txid)] as const,
                ),
            );

        const addTxs = (txids: string[]) =>
            promiseAllSequence(
                txids
                    .filter(txid => !this.mempool.has(txid))
                    .map(
                        txid => () =>
                            this.client
                                .fetchTransaction(txid)
                                .then(this.onTxAdd)
                                .catch(() => {}),
                    ),
            );

        if (!addressControllers.length) {
            await addTxs(filters.map(([txid]) => txid));
            this.lastPurge = new Date().getTime();
            return [...this.mempool.values()];
        }

        const findTxs = async ({ address }: { address: string }) => {
            const script = getMempoolAddressScript(address, this.network);
            const txids = filters.filter(([, isMatch]) => isMatch(script)).map(([txid]) => txid);
            await addTxs(txids);
            return this.addressTxids.get(address) ?? [];
        };

        const set = new Set<string>();
        const onTxs = (txids: string[]) => txids.forEach(set.add, set);
        await promiseAllSequence(
            addressControllers.map(controller => () => controller.analyze(findTxs, onTxs)),
        );
        this.lastPurge = new Date().getTime();
        return Array.from(set, txid => this.mempool.get(txid)!);
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

        const mempoolTxids = await this.client
            .fetchMempoolFilters()
            .then(filters => Object.keys(filters));
        const keepTxids = mempoolTxids.filter(txid => this.mempool.has(txid));
        const removeTxids = Array.from(this.mempool.keys()).filter(
            txid => !keepTxids.includes(txid),
        );
        removeTxids.forEach(this.onTxRemove);

        this.lastPurge = now;
    }

    getTransactions(...addressControllers: AddressController[]) {
        if (!addressControllers.length) return Array.from(this.mempool.values());

        const set = new Set<string>();
        const findTxs = ({ address }: { address: string }) => this.addressTxids.get(address) ?? [];
        const onTxs = (txids: string[]) => txids.forEach(set.add, set);

        addressControllers.forEach(controller => controller.analyze(findTxs, onTxs));

        return Array.from(set, txid => this.mempool.get(txid)!);
    }
}
