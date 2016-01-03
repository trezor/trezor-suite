/* @flow
 * Web worker utils
 */

type Deferred<T, U> = {
    resolve: (value: T) => void;
    reject: (reason: U) => void;
};

// requires an exclusive access to worker.
// requires worker to reply in a linear manner (strict FIFO).
export class WorkerChannel {
    worker: Worker;
    pending: Array<Deferred>;
    onMessage: (event: MessageEvent) => void;
    onError: (error: Error) => void;

    constructor(worker: Worker) {
        this.worker = worker;
        this.pending = [];
        this.onMessage = this.receiveMessage.bind(this);
        this.onError = this.receiveError.bind(this);
        this.open();
    }

    open() {
        this.worker.addEventListener('message', this.onMessage);
        this.worker.addEventListener('error', this.onError);
    }

    close() {
        this.worker.removeEventListener('message', this.onMessage);
        this.worker.removeEventListener('error', this.onError);
    }

    postMessage<T, U>(msg: T): Promise<U> {
        return new Promise((resolve, reject) => {
            this.pending.push({resolve, reject});
            this.worker.postMessage(msg);
        });
    }

    receiveMessage(event: MessageEvent) {
        let dfd = this.pending.shift();
        if (dfd) {
            dfd.resolve(event.data);
        }
    }

    receiveError(error: Error) {
        let dfd = this.pending.shift();
        if (dfd) {
            dfd.reject(error);
        }
    }
}
