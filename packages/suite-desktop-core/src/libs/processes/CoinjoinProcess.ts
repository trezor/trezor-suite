import { BaseProcess, Status } from './BaseProcess';

export class CoinjoinProcess extends BaseProcess {
    private readonly port;

    constructor(port = 37128) {
        super('coinjoin', 'WalletWasabi.WabiSabiClientLibrary', {
            autoRestart: 0,
        });
        this.port = port;
    }

    getUrl() {
        return `http://localhost:${this.port}/`;
    }

    getPort() {
        return this.port;
    }

    async status(): Promise<Status> {
        if (!this.process) {
            return {
                service: false,
                process: false,
            };
        }

        // service
        try {
            const resp = await fetch(`${this.getUrl()}get-version`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            this.logger.debug(this.logTopic, `Checking status (${resp.status})`);
            if (resp.status === 200) {
                const { Version } = await resp.json();
                this.logger.debug(this.logTopic, `WabiSabiClientLibrary version: ${Version}`);
                return {
                    service: true,
                    process: true,
                };
            }
        } catch (err) {
            this.logger.debug(this.logTopic, `Status error: ${err.message}`);
        }

        // process
        return {
            service: false,
            process: Boolean(this.process),
        };
    }

    start() {
        // We add the port where the process is going to run
        // since there is no way to pass it as argument yet.
        process.env.WCL_BIND_PORT = `${this.port}`;
        return super.start();
    }
}
