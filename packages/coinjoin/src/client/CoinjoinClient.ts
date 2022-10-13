import { EventEmitter } from 'events';

import { Status } from './Status';
import type { CoinjoinClientSettings } from '../types';
import type { CoinjoinStatusEvent, RegisterAccountParams } from '../types/client';

interface Events {
    status: CoinjoinStatusEvent;
    exception: string;
}

export declare interface CoinjoinClient {
    on<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    off<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    emit<K extends keyof Events>(type: K, ...args: Events[K][]): boolean;
    removeAllListeners<K extends keyof Events>(type?: K): this;
}

export class CoinjoinClient extends EventEmitter {
    readonly settings: CoinjoinClientSettings;
    private abortController: AbortController; // used for interruption
    private status: Status;

    constructor(settings: CoinjoinClientSettings) {
        super();
        this.settings = Object.freeze(settings);
        this.abortController = new AbortController();

        this.status = new Status(settings);
        this.status.on('update', event => {
            this.onStatusUpdate(event);
            if (event.changed.length > 0) {
                this.emit('status', event);
            }
        });
        this.status.on('exception', event => this.emit('exception', event));
    }

    enable() {
        if (this.abortController.signal.aborted) {
            this.abortController = new AbortController();
        }
        return this.status.start();
    }

    disable() {
        this.removeAllListeners();
        this.abortController.abort();
        this.status.stop();
    }

    registerAccount(_account: RegisterAccountParams) {
        this.status.setMode('enabled');
    }

    updateAccount(_account: RegisterAccountParams) {}

    unregisterAccount(_descriptor: string) {
        this.status.setMode('idle');
    }

    resolveRequest() {}

    private onStatusUpdate({ changed, rounds }: Pick<CoinjoinStatusEvent, 'changed' | 'rounds'>) {
        // To be implemented soon
        if (changed && rounds) return Promise.resolve();
    }
}
