// requires an exclusive access to worker.
// requires worker to reply in a linear manner (strict FIFO).
export class WorkerChannel {

    constructor(worker) {
        this.worker = worker;
        this.pending = [];
        this.receiveMessage = this.receiveMessage.bind(this);
        this.receiveError = this.receiveError.bind(this);
        this.open();
    }

    open() {
        this.worker.addEventListener('message', this.receiveMessage);
        this.worker.addEventListener('error', this.receiveError);
    }

    close() {
        this.worker.removeEventListener('message', this.receiveMessage);
        this.worker.removeEventListener('error', this.receiveError);
    }

    postMessage(msg) {
        return new Promise((resolve, reject) => {
            this.pending.push({resolve, reject});
            this.worker.postMessage(msg);
        });
    }

    receiveMessage(event) {
        let dfd = this.pending.shift();
        if (dfd) {
            dfd.resolve(event.data);
        }
    }

    receiveError(error) {
        let dfd = this.pending.shift();
        if (dfd) {
            dfd.reject(error);
        }
    }
}
