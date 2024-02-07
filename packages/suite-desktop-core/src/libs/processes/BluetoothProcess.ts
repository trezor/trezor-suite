import { BaseProcess, Status } from './BaseProcess';

export class BluetoothProcess extends BaseProcess {
    private readonly port;

    constructor(port = 21327) {
        super('bluetooth', 'trezor-ble', {
            stdio:
                process.platform.indexOf('win') >= 0
                    ? undefined
                    : ['inherit', 'inherit', 'inherit'],
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
            const resp = await fetch(`http://127.0.0.1:21327/`, {
                method: 'POST',
                headers: {
                    Origin: 'https://electron.trezor.io',
                },
            });
            this.logger.debug(this.logTopic, `Checking status (${resp.status})`);
            if (resp.status === 200) {
                const data = await resp.json();
                if (data?.version) {
                    return {
                        service: true,
                        process: true,
                    };
                }
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
        process.env.RUST_LOG = 'debug';
        process.env.RUST_BACKTRACE = '1';

        return super.start();
    }
}
