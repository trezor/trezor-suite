import { TOR_CONTROLLER_STATUS, TorControllerExternal } from '@trezor/request-manager';

import { Status } from './BaseProcess';

export type TorProcessStatus = Status & { isBootstrapping?: boolean };

const DEFAULT_TOR_EXTERNAL_HOST = '127.0.0.1';
const DEFAULT_TOR_EXTERNAL_PORT = 9050;

export class TorExternalProcess {
    isStopped = true;
    torController: TorControllerExternal;
    port = DEFAULT_TOR_EXTERNAL_PORT;
    host = DEFAULT_TOR_EXTERNAL_HOST;
    constructor() {
        this.torController = new TorControllerExternal({ host: this.host, port: this.port });
    }

    public getPort() {
        return this.port;
    }

    public async status(): Promise<TorProcessStatus> {
        const torControllerStatus = await this.torController.getStatus();

        return {
            service: torControllerStatus === TOR_CONTROLLER_STATUS.ExternalTorRunning,
            process: torControllerStatus === TOR_CONTROLLER_STATUS.ExternalTorRunning,
            isBootstrapping: false, // For Tor external we fake bootstrap process.
        };
    }

    public async start(): Promise<void> {
        this.isStopped = false;
        await this.torController.waitUntilAlive();
    }

    public stop() {
        // We should not stop External Tor Process but ignore it.
        this.isStopped = true;
    }
}
