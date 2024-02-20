import { ElectrumClient } from './electrum';
import { Status } from '@trezor/blockchain-link-types/lib/electrum';

type Cache = {
    [descriptor: string]: [Status, any];
};

type Statuses = {
    [scripthash: string]: Status;
};

export class CachingElectrumClient extends ElectrumClient {
    private readonly cache: Cache = {};
    private readonly statuses: Statuses = {};
    private cached = 0;
    private total = 0;
    private logTimer: ReturnType<typeof setInterval>;

    constructor() {
        super();
        this.logTimer = setInterval(() => {
            this.log(`Caching effectiveness: ${this.cached}/${this.total}`);
            this.log('Subscription count: ', Object.keys(this.statuses).length);
        }, 60000);
    }

    private async cacheRequest(status: Status, method: string, params: any[]) {
        const descriptor = [method, ...params].join(':');
        const cached = this.cache[descriptor];
        if (cached) {
            const [cachedStatus, cachedResponse] = cached;
            if (cachedStatus === status) {
                this.cached++;

                return cachedResponse;
            }
        }
        const response = await super.request(method, ...params);
        this.cache[descriptor] = [status, response];

        return response;
    }

    private async trySubscribe(scripthash: string): Promise<Status> {
        const status = this.statuses[scripthash];
        if (status !== undefined) {
            // Already subscribed, just return latest status
            return status;
        }
        // Subscribe to the new scripthash and store the status
        const newStatus = await super.request('blockchain.scripthash.subscribe', scripthash);
        this.statuses[scripthash] = newStatus;

        return newStatus;
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
                const curBlock = this.lastBlock?.hex;
                if (curBlock === undefined) break;

                return this.cacheRequest(curBlock, method, params);
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
