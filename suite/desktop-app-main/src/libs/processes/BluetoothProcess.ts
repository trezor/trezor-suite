import { randomBytes } from 'crypto';

import { isDevEnv } from '@suite-common/suite-utils';
import { isWindows } from '@trezor/env-utils';

import { BaseProcess, type Status } from './BaseProcess';
import type { ILogger } from '../logger';
import { getSwitchValue } from '../process-switches';

export class BluetoothProcess extends BaseProcess {
    private readonly port;
    private readonly debug;
    private readonly token;

    constructor({ port = 21327, logger }: { port?: number; logger: ILogger }) {
        const debug = isDevEnv || getSwitchValue('log-level') === 'debug';
        const token = randomBytes(32).toString('hex');

        super({
            resourceName: 'bluetooth',
            processName: 'trezor-bluetooth',
            options: {
                autoRestart: 0,
                env: {
                    TREZOR_BLUETOOTH_PORT: port.toString(),
                    TREZOR_BLUETOOTH_AUTH_TOKEN: token,
                },
                stdio: debug && !isWindows() ? 'inherit' : undefined,
            },
            logger,
        });

        this.port = port;
        this.debug = debug;
        this.token = token;
    }

    getUrl() {
        return `http://localhost:${this.port}/`;
    }

    getToken() {
        return this.token;
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
                    Authorization: `Bearer ${this.token}`,
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

    private async isServedWithoutToken(): Promise<boolean> {
        try {
            const resp = await fetch(this.getUrl(), {
                method: 'GET',
                headers: {
                    Origin: 'https://electron.trezor.io',
                },
            });

            return resp.ok;
        } catch {
            // A server that requires the token closes the connection instead of answering.
            return false;
        }
    }

    async start() {
        if (this.debug) {
            process.env.RUST_LOG = 'debug';
            process.env.RUST_BACKTRACE = '1';
        }

        await super.start();

        if (await this.isServedWithoutToken()) {
            await this.stop();
            throw new Error('Bluetooth server does not require the authorization token');
        }
    }
}
