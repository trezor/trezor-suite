import { EventEmitter } from 'events';

import { createTimeoutPromise } from '@trezor/utils';

import { TorControlPort } from './torControlPort';
import type { TorConnectionOptions, BootstrapEvent } from './types';
import { BootstrapEventProgress, bootstrapParser } from './events/bootstrap';

export class TorController extends EventEmitter {
    options: TorConnectionOptions;
    controlPort: TorControlPort;
    waitingTime = 1000;
    maxTriesWaiting = 60;
    isCircuitEstablished = false;
    torIsDisabledWhileStarting: boolean;

    constructor(options: TorConnectionOptions) {
        super();
        this.options = options;
        this.torIsDisabledWhileStarting = false;
        this.controlPort = new TorControlPort(options, this.onMessageReceived.bind(this));
    }

    onMessageReceived(message: string) {
        const bootstrap: BootstrapEvent[] = bootstrapParser(message);
        bootstrap.forEach(event => {
            if (!event || !event.progress) return;
            this.isCircuitEstablished = event.progress === BootstrapEventProgress.Done;
            this.emit('bootstrap/event', event);
        });
    }

    waitUntilAlive(): Promise<void> {
        const errorMessages: string[] = [];
        this.torIsDisabledWhileStarting = false;
        const waitUntilResponse = async (triesCount: number): Promise<void> => {
            if (this.torIsDisabledWhileStarting) {
                // If TOR is starting and we want to cancel it.
                return;
            }
            if (triesCount >= this.maxTriesWaiting) {
                throw new Error(
                    `Timeout waiting for TOR control port: \n${errorMessages.join('\n')}`,
                );
            }
            try {
                const isConnected = await this.controlPort.connect();
                const isAlive = this.controlPort.ping();
                if (isConnected && isAlive && this.isCircuitEstablished) {
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

    stopWhileLoading() {
        this.torIsDisabledWhileStarting = true;
    }
}
