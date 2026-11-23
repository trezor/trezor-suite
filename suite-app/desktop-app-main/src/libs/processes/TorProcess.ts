import {
    TOR_CONTROLLER_STATUS,
    type TorConnectionOptions,
    TorController,
} from '@trezor/request-manager';

import { BaseProcess, type Status } from './BaseProcess';
import type { ILogger } from '../logger';

export type TorProcessStatus = Status;

type TorProcessParams = { options: TorConnectionOptions; logger: ILogger };

export class TorProcess extends BaseProcess {
    torController: TorController;
    port: number;
    controlPort: number;
    torHost: string;
    torDataDir: string;

    constructor({ options, logger }: TorProcessParams) {
        super({
            resourceName: 'tor',
            processName: 'tor',
            options: {},
            logger,
        });

        this.port = options.port;
        this.controlPort = options.controlPort;
        this.torHost = options.host;
        this.torDataDir = options.torDataDir;

        this.torController = new TorController({
            host: this.torHost,
            port: this.port,
            controlPort: this.controlPort,
            torDataDir: this.torDataDir,
        });
    }

    public updatePort(port: number) {
        this.port = port;
    }

    public getPort() {
        return this.port;
    }

    public async status(): Promise<TorProcessStatus> {
        const torControllerStatus = await this.torController.getStatus();

        return {
            service: torControllerStatus === TOR_CONTROLLER_STATUS.CircuitEstablished,
            process: Boolean(this.process),
        };
    }

    public async start(): Promise<void> {
        const electronProcessId = process.pid;
        const torConfiguration = this.torController.getTorConfiguration(electronProcessId);

        await super.start(torConfiguration);

        return this.torController.waitUntilAlive();
    }
}
