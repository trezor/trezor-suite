import path from 'path';

import { isDevEnv } from '@suite-common/suite-utils';
import { isMacOs, isWindows } from '@trezor/env-utils';

import { BaseProcess, Status } from './BaseProcess';
import { getSwitchValue } from '../process-switches';

export class BluetoothProcess extends BaseProcess {
    private readonly port;
    private readonly debug;

    constructor(port = 21327) {
        const debug = isDevEnv || getSwitchValue('log-level') === 'debug';

        super('bluetooth', 'trezor-bluetooth', {
            autoRestart: 0,
            env: {
                // https://github.com/electron/electron/blob/ab2a4fd836d539194bc5cde5f0d665eddeb6a134/docs/api/environment-variables.md?plain=1#L190
                // Electron sometimes modifies the value of XDG_CURRENT_DESKTOP
                XDG_CURRENT_DESKTOP:
                    process.env.ORIGINAL_XDG_CURRENT_DESKTOP || process.env.XDG_CURRENT_DESKTOP,
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

    // workaround for macos pairing issue
    async connectAndSubscribeInMainThread(
        id: string,
    ): Promise<{ success: true } | { success: false; error: string }> {
        if (!isMacOs()) {
            return Promise.resolve({ success: true });
        }

        try {
            const processPath = path.join(super.getProcessDir(), `index.js`);
            this.logger.info(this.logTopic, `Loading bluetooth native module from ${processPath}`);

            const { connectDevice } = await import(/*webpackIgnore: true */ processPath);
            await connectDevice(id, 30000, (...args: any[]) => {
                console.warn('callback', args);
            });

            return { success: true } as const;
        } catch (error) {
            return { success: false, error: error.message } as const;
        }
    }
}
