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

    waitUntilAlive(): Promise<void> {
        const errorMessages: string[] = [];
        const waitUntilResponse = async (triesCount: number): Promise<void> => {
            if (triesCount >= this.maxTriesWaiting) {
                throw new Error(
                    `Timeout waiting for TOR control port: \n${errorMessages.join('\n')}`,
                );
            }
            try {
                const isConnected = await this.controlPort.connect();
                const isAlive = this.controlPort.ping();
                if (isConnected && isAlive) {
                    // It is running so let's not wait anymore.
                    return;
                }
            } catch (error) {
                // Some error here is expected when waiting but
                // we do not want to throw untill maxTriesWaiting is reach.
                // Instead we want to log it to know what causes the error.
                if (error && error.message) {
                    console.warn('request-manager:', error.message);
                    errorMessages.push(error.message);
                }
            }
            await createTimeoutPromise(this.waitingTime);
            return waitUntilResponse(triesCount + 1);
        };
        return waitUntilResponse(1);
    }

    status() {
        return this.controlPort.ping();
    }
}
