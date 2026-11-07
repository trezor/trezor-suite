import {
    type ElectrumBlockHeader as BlockHeader,
    type ElectrumTypes,
    type ElectrumStatus as Status,
} from '@trezor/blockchain-link-types';
import { type IntervalId } from '@trezor/type-utils';

import { ElectrumClient } from './electrum';
import { blockheaderToBlockhash } from '../utils/transform';

type Cache = {
    [descriptor: string]: [Status, any];
};

type Statuses = {
    [scripthash: string]: Status;
};

type ConfirmedTransactions = {
    [txid: string]: {
        tx: ElectrumTypes.TransactionVerbose;
        blockHeight: number;
        fetchedAt: number;
    };
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
    private readonly cache: Cache = {};
    private readonly statuses: Statuses = {};
    // Identical requests already waiting for a response, e.g. a transaction which is in several
    // accounts or which is reported by notifications of several addresses at once.
    private readonly pending: { [key: string]: Promise<any> } = {};
    // Confirmed transactions don't change with new blocks, only their confirmations do.
    private confirmedTransactions: ConfirmedTransactions = {};
    private cached = 0;
    private total = 0;
    private logTimer: IntervalId;

    constructor() {
        super();
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

    private cacheRequest(status: Status, method: string, params: any[]) {
        const descriptor = [method, ...params].join(':');
        const cached = this.cache[descriptor];
        if (cached) {
            const [cachedStatus, cachedResponse] = cached;
            if (cachedStatus === status) {
                this.cached++;

                return Promise.resolve(cachedResponse);
            }
        }

        return this.requestOnce(`${descriptor}@${status}`, async () => {
            const response = await super.request(method, ...params);
            this.cache[descriptor] = [status, response];

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
            this.statuses[scripthash] = newStatus;

            return newStatus;
        });
    }

    private async getVerboseTransaction(txid: string) {
        const confirmed = this.confirmedTransactions[txid];
        const currentHeight = this.lastBlock?.height;
        if (confirmed && currentHeight !== undefined) {
            this.cached++;

            return {
                ...confirmed.tx,
                confirmations: currentHeight - confirmed.blockHeight + 1,
            };
        }

        const requestBlock = this.lastBlock;
        if (!requestBlock) return super.request('blockchain.transaction.get', txid, true);

        const tx: ElectrumTypes.TransactionVerbose = await this.cacheRequest(
            requestBlock.hex,
            'blockchain.transaction.get',
            [txid, true],
        );
        // It can't be told from which tip the confirmations were counted when a block arrived
        // while waiting for the response, so such a transaction is fetched again the next time.
        const { confirmations = 0 } = tx;
        if (confirmations > 0 && this.lastBlock === requestBlock) {
            this.confirmedTransactions[txid] = {
                tx,
                blockHeight: requestBlock.height - confirmations + 1,
                fetchedAt: Date.now(),
            };
        }

        return tx;
    }

    private forgetRecentTransactions() {
        const trustedSince = Date.now() - UNTRUSTED_BEFORE_BLOCK_MS;
        Object.entries(this.confirmedTransactions).forEach(([txid, { fetchedAt }]) => {
            if (fetchedAt > trustedSince) delete this.confirmedTransactions[txid];
        });
    }

    async request(method: string, ...params: any[]) {
        this.total++;
        switch (method) {
            case 'blockchain.scripthash.get_history':
            case 'blockchain.scripthash.get_balance':
            case 'blockchain.scripthash.listunspent': {
                const [scripthash] = params;
                const status = await this.trySubscribe(scripthash);

                return this.cacheRequest(status, method, params);
            }
            case 'blockchain.transaction.get': {
                const [txid, verbose] = params;
                if (verbose) return this.getVerboseTransaction(txid);

                return this.cacheRequest(RAW_TRANSACTION_STATUS, method, params);
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
                // Blocks of cached transactions may not be in the chain anymore after a reorg.
                if (blocks.some(block => !isFollowingBlock(this.lastBlock, block))) {
                    this.confirmedTransactions = {};
                } else {
                    this.forgetRecentTransactions();
                }
                break;
            }
            default:
                break;
        }
        super.response(response);
    }

    onClose() {
        super.onClose();
        clearInterval(this.logTimer);
    }
}
