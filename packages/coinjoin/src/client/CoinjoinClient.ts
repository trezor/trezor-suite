import { EventEmitter } from 'events';

import type { CoinjoinClientSettings } from '../types';
import type { CoinjoinStatusEvent, CoinjoinStatus, RegisterAccountParams } from '../types/client';

interface Events {
    status: CoinjoinStatusEvent;
}

export declare interface CoinjoinClient {
    on<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    off<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    emit<K extends keyof Events>(type: K, ...args: Events[K][]): boolean;
    removeAllListeners<K extends keyof Events>(type?: K): this;
}

export class CoinjoinClient extends EventEmitter {
    readonly settings: CoinjoinClientSettings;

    constructor(settings: CoinjoinClientSettings) {
        super();
        this.settings = Object.freeze(settings);
    }

    enable() {
        return Promise.resolve<CoinjoinStatus>({ rounds: [{ id: '00' }] });
    }

    disable() {}

    registerAccount(_account: RegisterAccountParams) {}

    updateAccount(_account: RegisterAccountParams) {}

    unregisterAccount(_descriptor: string) {}

    resolveRequest() {}
}
