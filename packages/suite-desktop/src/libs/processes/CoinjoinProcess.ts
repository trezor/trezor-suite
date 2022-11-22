import { BaseProcess, Status } from './BaseProcess';
import { getFreePort } from '../getFreePort';

export class CoinjoinProcess extends BaseProcess {
    port = 37128; // Default port, that is going to be updated when starting the process.

    constructor() {
        super('coinjoin', 'WalletWasabi.WabiSabiClientLibrary', {
            autoRestart: 0,
        });
    }

    getUrl() {
        return `http://localhost:${this.port}/Cryptography/`;
    }

    async getPort() {
        if (!(await this.status()).process) {
            this.port = await getFreePort();
        }
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
                const { version } = await resp.json();
                this.logger.debug(this.logTopic, `WabiSabiClientLibrary version: ${version}`);
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
