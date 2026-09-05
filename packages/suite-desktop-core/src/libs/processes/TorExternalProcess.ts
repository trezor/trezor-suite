import { TOR_CONTROLLER_STATUS, TorControllerExternal } from '@trezor/request-manager';

import { type Status } from './BaseProcess';

export type TorProcessStatus = Status;

export class TorExternalProcess {
    torController: TorControllerExternal;
    port: number;
    host: string;
    constructor({ port, host }: { port: number; host: string }) {
        this.port = port;
        this.host = host;
        this.torController = new TorControllerExternal({ host: this.host, port: this.port });
    }

    public updatePort(port: number) {
        this.port = port;
        this.torController.updatePort(port);
    }

    public getPort() {
        return this.port;
    }

    public async status(): Promise<TorProcessStatus> {
        const torControllerStatus = await this.torController.getStatus();

        return {
            service: torControllerStatus === TOR_CONTROLLER_STATUS.ExternalTorRunning,
            process: torControllerStatus === TOR_CONTROLLER_STATUS.ExternalTorRunning,
        };
    }

    public async start(): Promise<void> {
        await this.torController.waitUntilAlive();
    }

    public stop() {
        // We should not stop External Tor Process but ignore it.
    }
}
