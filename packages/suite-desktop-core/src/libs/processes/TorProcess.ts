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
    shouldUseSnowflake: boolean;

    constructor(options: TorConnectionOptions) {
        super('tor', 'tor');

        this.port = options.port;
        this.controlPort = options.controlPort;
        this.torHost = options.host;
        this.torDataDir = options.torDataDir;
        this.snowflakeBinaryPath = '';
        this.shouldUseSnowflake = false;

        this.torController = new TorController({
            host: this.torHost,
            port: this.port,
            controlPort: this.controlPort,
            torDataDir: this.torDataDir,
            snowflakeBinaryPath: this.snowflakeBinaryPath,
            shouldUseSnowflake: this.shouldUseSnowflake,
        });
    }

    setTorConfig(
        torConfig: Pick<TorConnectionOptions, 'snowflakeBinaryPath' | 'shouldUseSnowflake'>,
    ) {
        this.shouldUseSnowflake = torConfig.shouldUseSnowflake;
        this.snowflakeBinaryPath = torConfig.snowflakeBinaryPath;
    }

    async status(): Promise<TorProcessStatus> {
        const torControllerStatus = await this.torController.getStatus();

        return {
            service: torControllerStatus === TOR_CONTROLLER_STATUS.CircuitEstablished,
            process: Boolean(this.process),
            isBootstrapping: torControllerStatus === TOR_CONTROLLER_STATUS.Bootstrapping,
        };
    }

    async start(): Promise<void> {
        const electronProcessId = process.pid;
        const torConfiguration = this.torController.getTorConfiguration(
            electronProcessId,
            this.shouldUseSnowflake,
            this.snowflakeBinaryPath,
        );

        await super.start(torConfiguration);

        return this.torController.waitUntilAlive();
    }
}
