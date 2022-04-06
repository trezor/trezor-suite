// original file https://github.com/trezor/connect/blob/develop/src/js/device/AbortController.js

// inspired by https://github.com/southpolesteve/node-abort-controller/
// nodejs AbortController is available since version 15, currently we are using 14.

/* eslint-disable max-classes-per-file */

import EventEmitter from 'events';

class AbortSignal {
    eventEmitter: EventEmitter;

    aborted = false;

    constructor() {
        this.eventEmitter = new EventEmitter();
    }

    toString() {
        return '[object AbortSignal]';
    }

    removeEventListener(name: string, handler: any) {
        this.eventEmitter.removeListener(name, handler);
    }

    addEventListener(name: string, handler: any) {
        this.eventEmitter.on(name, handler);
    }

    dispatchEvent(type: string) {
        this.eventEmitter.emit(type, { type, target: this });
    }
}

class AbortControllerFallback {
    signal: AbortSignal;

    constructor() {
        this.signal = new AbortSignal();
    }

    abort() {
        if (this.signal.aborted) return;

        this.signal.dispatchEvent('abort');
        this.signal.aborted = true;
    }

    toString() {
        return '[object AbortController]';
    }
}

export type Controller = AbortController | AbortControllerFallback;

// AbortController part of node since v15
export const getAbortController = () =>
    typeof AbortController !== 'undefined' ? new AbortController() : new AbortControllerFallback();
