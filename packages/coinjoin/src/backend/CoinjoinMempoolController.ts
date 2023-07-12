/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */

import type { Network } from '@trezor/utxo-lib';
import { promiseAllSequence } from '@trezor/utils';

import type { Logger } from '../types';
import type { BlockbookTransaction, MempoolClient } from '../types/backend';
import type { AddressController } from './CoinjoinAddressController';
import { getMempoolAddressScript, getMempoolMultiFilter } from './filters';
import { getAllTxAddresses } from './backendUtils';
import { MEMPOOL_PURGE_CYCLE } from '../constants';

type MempoolStatus = 'stopped' | 'running';

export type MempoolController = Pick<
    CoinjoinMempoolController,
    'status' | 'start' | 'init' | 'update' | 'getTransactions'
>;

type CoinjoinMempoolControllerSettings = {
    client: MempoolClient;
    network: Network;
    filter?: (address: string) => boolean;
    logger?: Logger;
};

export class CoinjoinMempoolController {
    private readonly client;
    private readonly network;
    private readonly mempool;
    private readonly addressTxids;
    private readonly filter;
    private readonly onTxAdd;
    private readonly onTxRemove;
    private readonly onDisconnect;
    private lastPurge;
    private _status: MempoolStatus;

    get status() {
        return this._status;
    }

    constructor({ client, network, filter }: CoinjoinMempoolControllerSettings) {
        this.client = client;
        this.network = network;
        this.mempool = new Map<string, BlockbookTransaction>();
        this.addressTxids = new Map<string, string[]>();
        this.filter = filter;
        this.onTxAdd = this.onTransactionAdd.bind(this);
        this.onTxRemove = this.onTransactionRemove.bind(this);
        this.onDisconnect = () => {
            this._status = 'stopped';
        };
        this.lastPurge = new Date().getTime();
        this._status = 'stopped';
    }

    private onTransactionAdd(tx: BlockbookTransaction) {
        const filteredAddresses = getAllTxAddresses(tx).filter(this.filter ?? (() => true));
        if (filteredAddresses.length) {
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

    async init(addressController?: AddressController) {
        const filters = await this.client
            .fetchMempoolFilters()
            .then(res =>
                Object.entries(res).map(
                    ([txid, filter]) => [txid, getMempoolMultiFilter(filter, txid)] as const,
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

        if (!addressController) {
            await addTxs(filters.map(([txid]) => txid));
            this.lastPurge = new Date().getTime();
            return [...this.mempool.values()];
        }

        const findTxs = ({ address }: { address: string }) => this.addressTxids.get(address) ?? [];
        const set = new Set<string>();
        const onTxs = (txids: string[]) => txids.forEach(set.add, set);

        let { receive, change } = addressController;
        while (receive.length || change.length) {
            const scripts = receive
                .concat(change)
                .map(({ address }) => getMempoolAddressScript(address, this.network));
            const txids = filters.filter(([, matchAny]) => matchAny(scripts)).map(([txid]) => txid);
            // eslint-disable-next-line no-await-in-loop
            await addTxs(txids);
            const newlyDerived = addressController.analyze(findTxs, onTxs);
            ({ receive, change } = newlyDerived);
        }

        this.lastPurge = new Date().getTime();
        return Array.from(set, txid => this.mempool.get(txid)!);
    }

    async start() {
        if (this._status === 'running') return;
        await this.client.subscribeMempoolTxs(this.onTxAdd, this.onDisconnect);
        this._status = 'running';
    }

    async stop() {
        if (this._status === 'stopped') return;
        await this.client.unsubscribeMempoolTxs(this.onTxAdd, this.onDisconnect);
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

    getTransactions(addressController?: AddressController) {
        if (!addressController) return Array.from(this.mempool.values());

        const set = new Set<string>();

        addressController.analyze(
            ({ address }) => this.addressTxids.get(address) ?? [],
            txids => txids.forEach(set.add, set),
        );

        return Array.from(set, txid => this.mempool.get(txid)!);
    }
}
