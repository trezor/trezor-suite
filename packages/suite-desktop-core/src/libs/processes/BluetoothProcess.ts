import { isDevEnv } from '@suite-common/suite-utils';

import { BaseProcess, Status } from './BaseProcess';
import { getSwitchValue } from '../process-switches';

const debugEnabled = isDevEnv || getSwitchValue('log-level') === 'debug';

export class BluetoothProcess extends BaseProcess {
    private readonly port;

    constructor(port = 21327) {
        super('bluetooth', 'trezor-bluetooth', {
            autoRestart: 0,
            stdio: debugEnabled ? 'inherit' : undefined,
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

    start() {
        if (debugEnabled) {
            process.env.RUST_LOG = 'debug';
            process.env.RUST_BACKTRACE = '1';
        }

        // https://github.com/electron/electron/blob/ab2a4fd836d539194bc5cde5f0d665eddeb6a134/docs/api/environment-variables.md?plain=1#L190
        // Electron sometimes modifies the value of XDG_CURRENT_DESKTOP
        if (process.env.ORIGINAL_XDG_CURRENT_DESKTOP) {
            process.env.XDG_CURRENT_DESKTOP = process.env.ORIGINAL_XDG_CURRENT_DESKTOP;
        }

        return super.start(['-p', this.port.toString()]);
    }
}
