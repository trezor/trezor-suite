import { isDevEnv } from '@suite-common/suite-utils';
import { isWindows } from '@trezor/env-utils';

import { BaseProcess, type Status } from './BaseProcess';
import { getSwitchValue } from '../process-switches';

export class BluetoothProcess extends BaseProcess {
    private readonly port;
    private readonly debug;

    constructor(port = 21327) {
        const debug = isDevEnv || getSwitchValue('log-level') === 'debug';

        super('bluetooth', 'trezor-bluetooth', {
            autoRestart: 0,
            env: {
                TREZOR_BLUETOOTH_PORT: port.toString(),
            },
            stdio: debug && !isWindows() ? 'inherit' : undefined,
        });

        this.port = port;
        this.debug = debug;
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
            const resp = await fetch(this.getUrl(), {
                method: 'GET',
                headers: {
                    Origin: 'https://electron.trezor.io',
                },
            });
            this.logger.debug(this.logTopic, `Checking status (${resp.status})`);
            if (resp.status === 200) {
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
        if (this.debug) {
            process.env.RUST_LOG = 'debug';
            process.env.RUST_BACKTRACE = '1';
        }

        return super.start();
    }
}
