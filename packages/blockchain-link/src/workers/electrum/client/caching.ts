import { ElectrumClient } from './electrum';

type Cache = {
    [descriptor: string]: [string | null, any];
};

type Statuses = {
    [scripthash: string]: string;
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
        }, 60000);
    }

    private async cacheRequest(status: string | null, method: string, params: any[]) {
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

    async request(method: string, ...params: any[]) {
        this.total++;
        switch (method) {
            case 'blockchain.scripthash.get_history':
            case 'blockchain.scripthash.get_balance':
            case 'blockchain.scripthash.listunspent': {
                const [scripthash] = params;
                const status = this.statuses[scripthash];
                if (status === undefined) break;
                return this.cacheRequest(status, method, params);
            }
            case 'blockchain.transaction.get': {
                const curBlock = this.lastBlock?.hex;
                if (curBlock === undefined) break;
                return this.cacheRequest(curBlock, method, params);
            }
            case 'blockchain.scripthash.subscribe': {
                const [scripthash] = params;
                const status = await super.request(method, ...params);
                this.statuses[scripthash] = status;
                return status;
            }
            default:
                break;
        }
        return super.request(method, ...params);
    }

    protected response(response: any) {
        const { method, params } = response;
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
