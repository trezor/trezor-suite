import { TorController, TOR_CONTROLLER_STATUS } from '@trezor/request-manager';
import { TorConnectionOptions } from '@trezor/request-manager/src/types';

import { BaseProcess, Status } from './BaseProcess';

export type TorProcessStatus = Status & { isBootstrapping?: boolean };

export class TorProcess extends BaseProcess {
    torController: TorController;
    port: number;
    controlPort: number;
    torHost: string;
    torDataDir: string;
    snowflakeBinaryPath: string;

    constructor(options: TorConnectionOptions) {
        super('tor', 'tor');

        this.port = options.port;
        this.controlPort = options.controlPort;
        this.torHost = options.host;
        this.torDataDir = options.torDataDir;
        this.snowflakeBinaryPath = '';

        this.torController = new TorController({
            host: this.torHost,
            port: this.port,
            controlPort: this.controlPort,
            torDataDir: this.torDataDir,
            snowflakeBinaryPath: this.snowflakeBinaryPath,
        });
    }

    setTorConfig(torConfig: Pick<TorConnectionOptions, 'snowflakeBinaryPath'>) {
        this.snowflakeBinaryPath = torConfig.snowflakeBinaryPath;
    }

    async status(): Promise<TorProcessStatus> {
        console.log('status in tor process');
        const torControllerStatus = await this.torController.getStatus();
        console.log('torControllerStatus', torControllerStatus);

        return {
            service: torControllerStatus === TOR_CONTROLLER_STATUS.CircuitEstablished,
            process: Boolean(this.process),
            isBootstrapping: torControllerStatus === TOR_CONTROLLER_STATUS.Bootstrapping,
        };
    }

    async start(): Promise<void> {
        const electronProcessId = process.pid;
        const torConfiguration = await this.torController.getTorConfiguration(
            electronProcessId,
            this.snowflakeBinaryPath,
        );

        await super.start(torConfiguration);

        return this.torController.waitUntilAlive();
    }

    async startExternal(): Promise<void> {
        console.log('startExternal');
        this.torController = new TorController({
            host: '127.0.0.1',
            port: 9050,
            controlPort: 35095,
            torDataDir: '/home/karliatto/.tor',
            snowflakeBinaryPath: '',
        });

        return this.torController.waitUntilAliveExternal();
    }
}
