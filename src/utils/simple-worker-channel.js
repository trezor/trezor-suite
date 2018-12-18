/* @flow
 */

/* global Worker:false,Event:false */

// Super simple webworker interface.

// Used ONLY for the address generation;
// socket worker + discovery workers have more complicated protocols

// requires an exclusive access to worker.
// does NOT require worker to reply in a linear manner
export class WorkerChannel {
    lastI: number = 0;

    worker: Worker;

    pending: {[i: number]: ((f: any) => any)};

    onMessage: (event: Event) => void;

    constructor(worker: Worker) {
        this.worker = worker;
        this.pending = {};
        this.onMessage = this.receiveMessage.bind(this);
        // this.onError = this.receiveError.bind(this);
        this.open();
    }

    open() {
        this.worker.onmessage = this.onMessage;
    }

    // this is used only for testing
    destroy() {
        this.worker.onmessage = () => {};
    }

    postMessage(msg: Object): Promise<any> {
        return new Promise((resolve) => {
            this.pending[this.lastI] = resolve;
            this.worker.postMessage({ ...msg, i: this.lastI });
            this.lastI++;
        });
    }

    receiveMessage(oevent: any) {
        const event = oevent;
        const { i } = event.data;
        const dfd = this.pending[i];
        if (dfd) {
            delete event.data.i;
            dfd(event.data);
            delete this.pending[i];
        } else {
            console.warn(new Error('Strange incoming message'));
        }
    }
}
