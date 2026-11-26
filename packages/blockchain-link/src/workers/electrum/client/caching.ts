import {
    type ElectrumBlockHeader as BlockHeader,
    type ElectrumTypes,
    type ElectrumStatus as Status,
} from '@trezor/blockchain-link-types';
import { type IntervalId } from '@trezor/type-utils';

import { ElectrumClient } from './electrum';
import { blockheaderToBlockhash } from '../utils/transform';

type Statuses = {
    [scripthash: string]: Status;
};

type ConfirmedTransaction = {
    tx: ElectrumTypes.TransactionVerbose;
    blockHeight: number;
    fetchedAt: number;
};

// What was fetched from the servers of one network, so that the client of the next connection
// (e.g. after the server closed the previous one) reuses it. It is kept in memory only.
export type ElectrumCache = {
    // A response for a scripthash holds while its status is the same.
    results: Map<string, [Status, any]>;
    // A raw transaction holds always. They are kept apart, so that the transactions of a big
    // account don't push the results of its addresses out of the cache.
    rawTransactions: Map<string, [Status, any]>;
    // Confirmed transactions don't change with new blocks, only their confirmations do. Their
    // block heights hold only while the tip they were counted from stays in the chain.
    confirmedTransactions: Map<string, ConfirmedTransaction>;
    // Block headers by height, which hold only while the tip stays in the chain too.
    headers: Map<number, string>;
    tip?: BlockHeader;
};

export const createElectrumCache = (): ElectrumCache => ({
    results: new Map(),
    rawTransactions: new Map(),
    confirmedTransactions: new Map(),
    headers: new Map(),
});

const MAX_CACHED_ITEMS = 20000;

const setCached = <K, T>(cache: Map<K, T>, key: K, value: T) => {
    // Re-inserted, so that the least recently fetched item goes first when the cache is full.
    cache.delete(key);
    cache.set(key, value);
    if (cache.size > MAX_CACHED_ITEMS) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) cache.delete(oldestKey);
    }
};

// Raw transaction of given txid never changes.
const RAW_TRANSACTION_STATUS = 'raw';
// Confirmations of a verbose transaction are counted by the node of the server, which may already
// have a block the server hasn't announced yet. So a transaction fetched shortly before a new block
// is announced is not trusted to have the right block height and is fetched again.
const UNTRUSTED_BEFORE_BLOCK_MS = 60 * 1000;

const getPrevBlockhash = (header: string) =>
    Buffer.from(header, 'hex').subarray(4, 36).reverse().toString('hex');

const isFollowingBlock = (last: BlockHeader | undefined, next: BlockHeader) =>
    !last ||
    last.hex === next.hex ||
    (next.height === last.height + 1 &&
        getPrevBlockhash(next.hex) === blockheaderToBlockhash(last.hex));

export class CachingElectrumClient extends ElectrumClient {
    private readonly cache: ElectrumCache;
    private readonly statuses: Statuses = {};
    // Verbose transactions for the current tip. Their confirmations were counted by the node of
    // the server of this connection, which may have been ahead of the tip, so they aren't shared.
    private readonly tipTransactions = new Map<string, [Status, any]>();
    // Identical requests already waiting for a response, e.g. a transaction which is in several
    // accounts or which is reported by notifications of several addresses at once.
    private readonly pending: { [key: string]: Promise<any> } = {};
    private cached = 0;
    private total = 0;
    private logTimer: IntervalId;

    constructor(cache = createElectrumCache()) {
        super();
        this.cache = cache;
        this.logTimer = setInterval(() => {
            this.log(`Caching effectiveness: ${this.cached}/${this.total}`);
            this.log('Subscription count: ', Object.keys(this.statuses).length);
        }, 60000);
    }

    private requestOnce(key: string, request: () => Promise<any>) {
        if (!this.pending[key]) {
            this.pending[key] = request().finally(() => {
                delete this.pending[key];
            });
        }

        return this.pending[key];
    }

    private cacheRequest(
        status: Status,
        method: string,
        params: any[],
        results = this.cache.results,
    ) {
        const descriptor = [method, ...params].join(':');
        const cached = results.get(descriptor);
        if (cached) {
            const [cachedStatus, cachedResponse] = cached;
            if (cachedStatus === status) {
                this.cached++;

                return Promise.resolve(cachedResponse);
            }
        }

        return this.requestOnce(`${descriptor}@${status}`, async () => {
            const response = await super.request(method, ...params);
            setCached(results, descriptor, [status, response]);

            return response;
        });
    }

    private trySubscribe(scripthash: string): Promise<Status> {
        const status = this.statuses[scripthash];
        if (status !== undefined) {
            // Already subscribed, just return latest status
            return Promise.resolve(status);
        }

        // Subscribe to the new scripthash and store the status
        return this.requestOnce(`subscribe:${scripthash}`, async () => {
            const newStatus = await super.request('blockchain.scripthash.subscribe', scripthash);
            // A notification which arrived together with the response is newer than the response.
            const notifiedStatus = this.statuses[scripthash];
            const currentStatus = notifiedStatus === undefined ? newStatus : notifiedStatus;
            this.statuses[scripthash] = currentStatus;

            return currentStatus;
        });
    }

    private async getVerboseTransaction(txid: string) {
        const confirmed = this.cache.confirmedTransactions.get(txid);
        const currentTip = this.lastBlock;
        // The tip of the cache differs only while another client of the network has moved it.
        if (
            confirmed &&
            currentTip &&
            this.cache.tip === currentTip &&
            confirmed.blockHeight <= currentTip.height
        ) {
            this.cached++;

            return {
                ...confirmed.tx,
                confirmations: currentTip.height - confirmed.blockHeight + 1,
            };
        }

        const requestBlock = this.lastBlock;
        if (!requestBlock) return super.request('blockchain.transaction.get', txid, true);

        const tx: ElectrumTypes.TransactionVerbose = await this.cacheRequest(
            requestBlock.hex,
            'blockchain.transaction.get',
            [txid, true],
            this.tipTransactions,
        );
        // It can't be told from which tip the confirmations were counted when a block arrived
        // while waiting for the response, so such a transaction is fetched again the next time.
        const { confirmations = 0 } = tx;
        if (confirmations > 0 && this.cache.tip === requestBlock) {
            setCached(this.cache.confirmedTransactions, txid, {
                tx,
                blockHeight: requestBlock.height - confirmations + 1,
                fetchedAt: Date.now(),
            });
        }

        return tx;
    }

    private async getBlockHeader(height: number): Promise<string> {
        const cached = this.cache.headers.get(height);
        const currentTip = this.lastBlock;
        // Like a confirmed transaction, only a header below the tip of this chain is reused.
        if (
            cached !== undefined &&
            currentTip &&
            this.cache.tip === currentTip &&
            height <= currentTip.height
        ) {
            this.cached++;

            return cached;
        }

        const requestBlock = this.lastBlock;
        const header: string = await this.requestOnce(
            `blockchain.block.header:${height}@${requestBlock?.hex}`,
            () => super.request('blockchain.block.header', height),
        );
        // The header of a block the server hasn't announced yet may be replaced before it is, and
        // it can't be told which chain a header came from when a block arrived while waiting.
        if (requestBlock && height <= requestBlock.height && this.cache.tip === requestBlock) {
            setCached(this.cache.headers, height, header);
        }

        return header;
    }

    private forgetTransactionsFetchedShortlyBefore(blockTime: number) {
        const trustedSince = blockTime - UNTRUSTED_BEFORE_BLOCK_MS;
        const { confirmedTransactions } = this.cache;
        confirmedTransactions.forEach(({ fetchedAt }, txid) => {
            if (fetchedAt > trustedSince) confirmedTransactions.delete(txid);
        });
    }

    private async isInChain(block: BlockHeader) {
        if (!this.lastBlock || block.height > this.lastBlock.height) return false;
        const header = await super
            .request('blockchain.block.header', block.height)
            .catch(() => undefined);

        return header === block.hex;
    }

    // Blocks could have come or the chain could have been reorganized while there was no connection,
    // and the server of the new connection may be behind or follow another chain.
    private async checkCachedTip() {
        const { tip } = this.cache;
        const currentTip = this.lastBlock;
        if (tip && currentTip && tip.hex !== currentTip.hex) {
            const isTipInChain = isFollowingBlock(tip, currentTip) || (await this.isInChain(tip));
            // Nothing was learned about the chain, the cache is left for the next connection.
            if (!this.isConnected()) {
                throw new Error('Electrum server closed the connection while connecting');
            }
            const { confirmedTransactions } = this.cache;
            if (isTipInChain) {
                // The new blocks came at some time after the last transaction was fetched.
                const lastFetchedAt = Array.from(confirmedTransactions.values()).reduce(
                    (latest, { fetchedAt }) => Math.max(latest, fetchedAt),
                    0,
                );
                this.forgetTransactionsFetchedShortlyBefore(lastFetchedAt);
            } else {
                confirmedTransactions.clear();
                this.cache.headers.clear();
            }
        }
        this.cache.tip = this.lastBlock;
    }

    async connect(...params: Parameters<ElectrumClient['connect']>) {
        await super.connect(...params);
        await this.checkCachedTip();
    }

    async request(method: string, ...params: any[]) {
        this.total++;
        switch (method) {
            case 'blockchain.scripthash.get_history':
            case 'blockchain.scripthash.get_balance':
            case 'blockchain.scripthash.listunspent': {
                const [scripthash] = params;
                const status = await this.trySubscribe(scripthash);
                // The status of a scripthash without any history is null.
                if (status === null) {
                    this.cached++;

                    return method === 'blockchain.scripthash.get_balance'
                        ? { confirmed: 0, unconfirmed: 0 }
                        : [];
                }

                return this.cacheRequest(status, method, params);
            }
            case 'blockchain.transaction.get': {
                const [txid, verbose] = params;
                if (verbose) return this.getVerboseTransaction(txid);

                return this.cacheRequest(
                    RAW_TRANSACTION_STATUS,
                    method,
                    params,
                    this.cache.rawTransactions,
                );
            }
            case 'blockchain.block.header': {
                const [height, cpHeight] = params;
                // A header with a merkle proof to a checkpoint is not cached.
                if (cpHeight === undefined) return this.getBlockHeader(height);
                break;
            }
            case 'blockchain.scripthash.subscribe': {
                const [scripthash] = params;

                return this.trySubscribe(scripthash);
            }
            case 'blockchain.scripthash.unsubscribe': {
                const [scripthash] = params;
                delete this.statuses[scripthash];

                return super.request(method, ...params);
            }
            default:
                break;
        }

        return super.request(method, ...params);
    }

    protected response(response: any) {
        const { method, params } = response;
        // presence of 'method' field implies that it's a notification
        switch (method) {
            case 'blockchain.scripthash.subscribe': {
                const [scripthash, status] = params;
                this.statuses[scripthash] = status;
                break;
            }
            case 'blockchain.headers.subscribe': {
                const blocks: BlockHeader[] = params;
                this.tipTransactions.clear();
                // Blocks of cached transactions may not be in the chain anymore after a reorg.
                if (blocks.some(block => !isFollowingBlock(this.cache.tip, block))) {
                    this.cache.confirmedTransactions.clear();
                    this.cache.headers.clear();
                } else {
                    this.forgetTransactionsFetchedShortlyBefore(Date.now());
                }
                break;
            }
            default:
                break;
        }
        super.response(response);
        if (method === 'blockchain.headers.subscribe') this.cache.tip = this.lastBlock;
    }

    onClose() {
        super.onClose();
        clearInterval(this.logTimer);
    }
}
