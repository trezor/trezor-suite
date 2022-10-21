import { EventEmitter } from 'events';

import { Status } from './Status';
import { Account } from './Account';
import { getNetwork } from '../utils/settingsUtils';
import type { CoinjoinClientSettings, RegisterAccountParams } from '../types';
import type { CoinjoinStatusEvent } from '../types/client';

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
    private network;
    private abortController: AbortController; // used for interruption
    private status: Status;
    private accounts: Account[] = [];

    constructor(settings: CoinjoinClientSettings) {
        super();
        this.settings = Object.freeze(settings);
        this.network = getNetwork(settings.network);
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

    registerAccount(account: RegisterAccountParams) {
        if (this.accounts.find(a => a.accountKey === account.accountKey)) {
            throw new Error('Trying to register account that already exists');
        }

        // iterate Status more frequently
        if (this.accounts.length === 0) {
            this.status.setMode('enabled');
        }

        this.accounts.push(new Account(account, this.network));

        // try to trigger registration immediately without waiting for Status change
        this.onStatusUpdate({
            rounds: this.status.rounds,
            changed: [],
        });
    }

    updateAccount(account: RegisterAccountParams) {
        const accountToUpdate = this.accounts.find(a => a.accountKey === account.accountKey);
        if (accountToUpdate) {
            accountToUpdate.update(account);
        }
    }

    unregisterAccount(accountKey: string) {
        this.accounts = this.accounts.filter(a => a.accountKey !== accountKey);

        // iterate Status less frequently
        if (this.accounts.length === 0) {
            this.status.setMode('idle');
        }
    }

    resolveRequest() {}

    private onStatusUpdate({ changed, rounds }: Pick<CoinjoinStatusEvent, 'changed' | 'rounds'>) {
        // To be implemented soon
        if (changed && rounds) return Promise.resolve();
    }
}
