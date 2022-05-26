import { EventEmitter } from 'events';

import type { CoinjoinBackendSettings } from '../types';
import type {
    ScanAddressParams,
    ScanAccountParams,
    ScanAccountCheckpoint,
    ScanAccountProgress,
    Transaction,
} from '../types/backend';

interface Events {
    progress: ScanAccountProgress;
}

export declare interface CoinjoinBackend {
    on<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    off<K extends keyof Events>(type: K, listener: (event: Events[K]) => void): this;
    emit<K extends keyof Events>(type: K, ...args: Events[K][]): boolean;
    removeAllListeners<K extends keyof Events>(type?: K): this;
}

export class CoinjoinBackend extends EventEmitter {
    readonly settings: CoinjoinBackendSettings;

    private abortController: AbortController | undefined;

    constructor(settings: CoinjoinBackendSettings) {
        super();
        this.settings = Object.freeze(settings);
    }

    scanAccount({ descriptor, checkpoint }: ScanAccountParams) {
        this.abortController = new AbortController();
        console.warn(descriptor, checkpoint);
        throw new Error('scanAccount not implemented');
    }

    scanAddress({ descriptor, checkpoint }: ScanAddressParams) {
        this.abortController = new AbortController();
        console.warn(descriptor, checkpoint);
        throw new Error('scanAddress not implemented');
    }

    getAccountInfo(
        descriptor: string,
        transactions: Transaction[],
        checkpoint?: ScanAccountCheckpoint,
    ) {
        console.warn(descriptor, transactions, checkpoint);
        throw new Error('getAccountInfo not implemented');
    }

    cancel() {
        this.abortController?.abort();
    }
}
