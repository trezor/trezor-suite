import { EventEmitter } from 'events';

import { createTimeoutPromise } from '@trezor/utils';

import { TorControlPort } from './torControlPort';
import { TorConnectionOptions } from './types';

export class TorController extends EventEmitter {
    options: TorConnectionOptions;
    controlPort: TorControlPort;
    waitingTime = 1000;
    maxTriesWaiting = 60;

    constructor(options: TorConnectionOptions) {
        super();
        this.options = options;
        this.controlPort = new TorControlPort(options);
    }

    waitUntilAlive() {
        const waitUntilResponse = async (triesCount: number) => {
            if (triesCount >= this.maxTriesWaiting) {
                throw new Error('Timeout waiting for TOR control port');
            }
            const isAlive = await this.controlPort
                .connect()
                .then(() => this.controlPort.ping())
                .catch(() => false);
            if (isAlive) {
                // It is running so let's not wait anymore.
                return;
            }
            await createTimeoutPromise(this.waitingTime);
            await waitUntilResponse(triesCount + 1);
        };
        return waitUntilResponse(1);
    }

    status() {
        return this.controlPort.ping();
    }
}
