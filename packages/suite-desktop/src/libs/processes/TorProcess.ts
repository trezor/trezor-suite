import { TorController, TorIdentities } from '@trezor/request-manager';

import { BaseProcess, Status } from './BaseProcess';

interface TorConnectionOptions {
    host: string;
    port: number;
    controlPort: number;
    torDataDir: string;
}

export class TorProcess extends BaseProcess {
    torController: TorController;
    port: number;
    controlPort: number;
    torHost: string;
    torDataDir: string;

    constructor(options: TorConnectionOptions) {
        super('tor', 'tor');

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

    async status(): Promise<Status> {
        try {
            const isAlive = await this.torController.status();
            if (isAlive) {
                return {
                    service: true,
                    process: true,
                };
            }
        } catch {
            //
        }

        // process
        return {
            service: false,
            process: Boolean(this.process),
        };
    }

    async start(): Promise<void> {
        const electronProcessId = process.pid;
        const torConfiguration = this.torController.getTorConfiguration(electronProcessId);

        await super.start(torConfiguration);
        // Initialize TorIdentities with TorController so requests are intercepted to use Tor.
        // `TorIdentities` needs to be initialized with `TorController` because it needs to know the
        // `host` and `port` of the Tor process to create SocksProxyAgent.
        TorIdentities.init(this.torController);
        return this.torController.waitUntilAlive();
    }
}
