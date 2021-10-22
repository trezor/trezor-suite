import { JsonRpcClient } from './json-rpc';

type Options = {
    timeoutMs?: number;
    maxQueueLength?: number;
};

const TIMEOUT_MS = 50;
const MAX_QUEUE_LENGTH = 15;

// TODO batching should in theory improve performance
export class BatchingJsonRpcClient extends JsonRpcClient {
    private queue: string[] = [];
    private batchTimer?: ReturnType<typeof setTimeout>;

    private timeoutMs: number;
    private maxQueueLength: number;

    constructor(options?: Options) {
        super();
        this.timeoutMs = options?.timeoutMs || TIMEOUT_MS;
        this.maxQueueLength = options?.maxQueueLength || MAX_QUEUE_LENGTH;
    }

    protected send(message: string) {
        const { queue } = this;
        queue.push(message);
        if (this.batchTimer) clearTimeout(this.batchTimer);
        this.batchTimer = setTimeout(() => {
            this.batchTimer = undefined;
            while (queue.length) {
                const q = queue.splice(0, this.maxQueueLength);
                const content = q.length > 1 ? `[${q.join(',')}]` : q[0];
                super.send(content);
            }
        }, this.timeoutMs);
    }

    protected onMessage(body: string) {
        const msg = JSON.parse(body);
        this.log('RECEIVED:', msg);
        if (Array.isArray(msg)) {
            msg.forEach(this.response, this);
        } else {
            this.response(msg);
        }
    }
}
