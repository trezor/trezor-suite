import { randomBytes } from 'crypto';

import { isDevEnv } from '@suite-common/suite-utils';
import { isWindows } from '@trezor/env-utils';

import { BaseProcess, type Status } from './BaseProcess';
import { electronOrigin } from '../../config';
import type { ILogger } from '../logger';
import { getSwitchValue } from '../process-switches';

type BluetoothProcessParams = { port?: number; logger: ILogger };

export class BluetoothProcess extends BaseProcess {
    private readonly port;
    private readonly debug;
    private readonly token;

    constructor({ port = 21327, logger }: BluetoothProcessParams) {
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
                    Origin: electronOrigin,
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
