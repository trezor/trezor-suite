/* @flow
 */

// Super simple webworker interface.
// Used ONLY for the address generation;
// socket worker + discovery workers have more complicated protocols

type Deferred<T, U> = {
    resolve: (value: T) => void,
    reject: (reason: U) => void,
};

// requires an exclusive access to worker.
// requires worker to reply in a linear manner (strict FIFO).
export class WorkerChannel {
    worker: Worker;
    pending: Array<Deferred<any, any>>;
    onMessage: (event: Event) => void;

    constructor(worker: Worker) {
        this.worker = worker;
        this.pending = [];
        this.onMessage = this.receiveMessage.bind(this);
        // this.onError = this.receiveError.bind(this);
        this.open();
    }

    open() {
        this.worker.addEventListener('message', this.onMessage);
    }

    postMessage<T, U>(msg: T): Promise<U> {
        return new Promise((resolve, reject) => {
            this.pending.push({resolve, reject});
            this.worker.postMessage(msg);
        });
    }

    receiveMessage(event: any) {
        const dfd = this.pending.shift();
        if (dfd) {
            dfd.resolve(event.data);
        }
    }
}
