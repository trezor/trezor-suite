import { isDevEnv } from '@suite-common/suite-utils';
import { isMacOs, isWindows } from '@trezor/env-utils';

import { BaseProcess, Status } from './BaseProcess';
import { getSwitchValue } from '../process-switches';

export class BluetoothProcess extends BaseProcess {
    private readonly port;

    constructor(port = 21327) {
        super('bluetooth', 'trezor-bluetooth', {
            autoRestart: 0,
            stdio: isWindows() ? undefined : 'inherit',
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

    async start() {
        if (isDevEnv || getSwitchValue('log-level') === 'debug') {
            process.env.RUST_LOG = 'debug';
            process.env.RUST_BACKTRACE = '1';
        }

        if (isMacOs()) {
            const { trezorBluetoothRun } = await require('@trezor/transport-bluetooth/napi');
            trezorBluetoothRun(this.port);

            return;
        }

        return super.start(['-p', this.port.toString()]);
    }
}
