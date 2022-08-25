import BaseProcess, { Status } from './BaseProcess';

import { TorController, TorIdentities } from '@trezor/request-manager';

interface TorConnectionOptions {
    host: string;
    port: number;
    controlPort: number;
    authFilePath: string;
}

class TorProcess extends BaseProcess {
    torController: TorController;
    port: number;
    controlPort: number;
    torHost: string;
    authFilePath: string;

    constructor(options: TorConnectionOptions) {
        super('tor', 'tor');

        this.port = options.port;
        this.controlPort = options.controlPort;
        this.torHost = options.host;
        this.authFilePath = options.authFilePath;

        this.torController = new TorController({
            host: this.torHost,
            port: this.port,
            controlPort: this.controlPort,
            authFilePath: this.authFilePath,
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
        // Initlialize TorIdentities with TorController so requests are intercepted to use Tor.
        // `TorIdentities` needs to be initialized with `TorController` because it needs to know the
        // `host` and `port` of the Tor process to create SocksProxyAgent.
        TorIdentities.init(this.torController);
        return this.torController.waitUntilAlive();
    }
}

export default TorProcess;
