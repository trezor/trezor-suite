/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */

import type { Network } from '@trezor/utxo-lib';
import { arrayDistinct, createCooldown, promiseAllSequence } from '@trezor/utils';

import type { Logger } from '../types';
import type { BlockbookTransaction, MempoolClient, OnProgressInfo } from '../types/backend';
import type { AddressController } from './CoinjoinAddressController';
import { getAddressScript, getMultiFilter } from './filters';
import { getAllTxAddresses, isDoublespend } from './backendUtils';
import { MEMPOOL_PURGE_CYCLE, PROGRESS_INFO_COOLDOWN } from '../constants';

type MempoolStatus = 'stopped' | 'running';

export type MempoolController = Pick<
    CoinjoinMempoolController,
    'status' | 'start' | 'stop' | 'init' | 'update' | 'getTransactions' | 'removeTransactions'
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
            const collidingTxids = filteredAddresses
                .flatMap(address => this.addressTxids.get(address) ?? [])
                .filter(arrayDistinct)
                .map(txid => this.mempool.get(txid)!)
                .filter(t => isDoublespend(tx, t))
                .map(t => t.txid);

            collidingTxids.forEach(this.onTxRemove);

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

    async init(addressController?: AddressController, onProgressInfo?: OnProgressInfo) {
        onProgressInfo?.({ stage: 'mempool', activity: 'fetch' });

        const filters = await this.client
            .fetchMempoolFilters()
            .then(({ entries, P, M, zeroedKey }) =>
                Object.entries(entries).map(
                    ([txid, filter]) =>
                        [
                            txid,
                            getMultiFilter(filter, { P, M, key: zeroedKey ? undefined : txid }),
                        ] as const,
                ),
            );

        onProgressInfo?.({ stage: 'mempool', activity: 'scan' });

        const addTx = async (txid: string) => {
            if (!this.mempool.has(txid)) {
                await this.client
                    .fetchTransaction(txid)
                    .then(this.onTxAdd)
                    .catch(() => {});
            }
        };

        if (!addressController) {
            await promiseAllSequence(
                filters.map(
                    ([txid]) =>
                        () =>
                            addTx(txid),
                ),
            );
            this.lastPurge = new Date().getTime();
            return [...this.mempool.values()];
        }

        const findTxs = ({ address }: { address: string }) => this.addressTxids.get(address) ?? [];
        const set = new Set<string>();
        const onTxs = (txids: string[]) => txids.forEach(set.add, set);
        const progressCooldown = createCooldown(PROGRESS_INFO_COOLDOWN);

        let { receive, change } = addressController;
        let iteration = 0;
        while (receive.length || change.length) {
            const scripts = receive
                .concat(change)
                .map(({ address }) => getAddressScript(address, this.network));

            await promiseAllSequence(
                filters.map(([txid, matchAny], index) => async () => {
                    if (matchAny(scripts)) await addTx(txid);
                    if (progressCooldown())
                        onProgressInfo?.({
                            stage: 'mempool',
                            progress: { current: index, total: filters.length, iteration },
                        });
                }),
            );

            const newlyDerived = addressController.analyze(findTxs, onTxs);
            ({ receive, change } = newlyDerived);
            iteration++;
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
            .then(({ entries }) => Object.keys(entries));
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

    removeTransactions(txids: string[]) {
        txids.forEach(this.onTxRemove);
    }
}
