import { EventEmitter } from 'events';

import { ScheduleActionParams, ScheduledAction, scheduleAction } from '@trezor/utils';
import { checkSocks5Proxy } from '@trezor/node-utils';

import { TOR_CONTROLLER_STATUS, TorControllerStatus, TorExternalConnectionOptions } from './types';

const WAITING_TIME = 1_000;
const MAX_TRIES_WAITING = 200;

export class TorControllerExternal extends EventEmitter {
    status: TorControllerStatus = TOR_CONTROLLER_STATUS.Stopped;
    options: TorExternalConnectionOptions;

    constructor(options: TorExternalConnectionOptions) {
        super();
        this.options = options;
    }

    private getIsStopped() {
        return this.status === TOR_CONTROLLER_STATUS.Stopped;
    }

    private async getIsExternalTorRunning() {
        let isSocks5ProxyPort = false;
        try {
            isSocks5ProxyPort = await checkSocks5Proxy(this.options.host, this.options.port);
        } catch {
            // Ignore errors.
        }

        return isSocks5ProxyPort;
    }

    private startBootstrap() {
        this.status = TOR_CONTROLLER_STATUS.Bootstrapping;
    }

    private successfullyBootstrapped() {
        this.status = TOR_CONTROLLER_STATUS.ExternalTorRunning;
    }

    public updatePort(port: number) {
        this.options.port = port;
    }

    public getTorConfiguration() {
        return '';
    }

    public async waitUntilAlive() {
        this.startBootstrap();

        const checkConnection: ScheduledAction<boolean> = async () => {
            if (this.getIsStopped()) return false;
            const isRunning = await this.getIsExternalTorRunning();
            if (isRunning) {
                this.successfullyBootstrapped();

                return true;
            }

            throw new Error('Tor external not alive');
        };

        const params: ScheduleActionParams = {
            attempts: MAX_TRIES_WAITING,
            timeout: WAITING_TIME,
            gap: WAITING_TIME,
        };

        await scheduleAction(checkConnection, params);
    }

    public async getStatus() {
        const isExternalTorRunning = await this.getIsExternalTorRunning();
        if (isExternalTorRunning) {
            return TOR_CONTROLLER_STATUS.ExternalTorRunning;
        }

        return TOR_CONTROLLER_STATUS.Stopped;
    }

    public closeActiveCircuits() {
        // Do nothing. Not possible in External Tor without ControlPort.
    }

    public stop() {
        this.status = TOR_CONTROLLER_STATUS.Stopped;
    }
}
