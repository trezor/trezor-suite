const TICK_MS = 10;

import assert from 'assert';
export class MockWorker {

    addEventListener(something, listener) {
        this.onmessage = listener;
    }

    constructor(spec, doneError, serialize) {
        this.specLock = false;
        this.onmessage = () => {};
        this.errored = false;
        this.spec = spec;
        this.doneError = doneError;
        this.doneError = (f) => {
            if (!this.errored) {
                doneError(f);
            }
            this.errored = true;
        };
        this.sendOut();
        this.serialize = serialize;
    }

    sendOut() {
        if (this.spec.length > 0) {
            const sspec = this.spec[0];
            if (sspec.type === 'out') {
                this.specLock = true;
                const spec = sspec.spec;
                this.spec.shift();
                setTimeout(() => {
                    this.specLock = false;
                    if (this.serialize) {
                        this.onmessage({data: JSON.serialize(spec)});
                    } else {
                        this.onmessage({data: spec});
                    }
                    this.sendOut();
                }, TICK_MS);
            }
        }
    }

    postMessage(message) {
        let error = null;
        if (this.spec.length === 0) {
            error = new Error('In spec not defined');
            this.doneError(error);
            throw error;
        }
        if (this.specLock) {
            error = new Error('Got postMessage while waiting');
            this.doneError(error);
            throw error;
        }
        const sspec = this.spec[0];
        if (sspec.type !== 'in') {
            error = new Error('Got in while expecting out');
            this.doneError(error);
            throw error;
        }
        const {spec} = sspec;
        this.spec.shift();
        const omessage = this.serialize ? JSON.parse(message) : message;
        try {
            assert.deepStrictEqual(omessage, spec);
        } catch (e) {
            error = e;
            this.doneError(error);
            throw error;
        }
        this.sendOut();
    }

}
