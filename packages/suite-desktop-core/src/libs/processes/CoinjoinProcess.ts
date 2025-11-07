import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

import { BaseProcess, Status } from './BaseProcess';
import { getInfo, read, remove, save } from '../user-data';

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

    protected getProcessDir() {
        const { dir } = getInfo();

        return path.join(dir, 'coinjoin');
    }

    protected async ensureCoinjoinBinary() {
        const { system, ext } = this.getPlatformInfo();
        const fileName = `WalletWasabi.WabiSabiClientLibrary${ext}`;
        const hashes: Record<string, string> = {
            'linux-x64': '085eec737383e4bd70f35994c8b94537bf4dd2a54e06dd28a8d5eb7f5fa7f881',
            'linux-arm64': 'fd9aa1af53422cc8a4c8e3afe815b21684660bd4e84bf9660d20ef98afecf057',
            'mac-x64': '1858bbb8e4a42a6fde2c8c864ad1bb77811f3f486eac467be2f940195aa4eda2',
            'mac-arm64': '1e4839529cd652e522f660ded203204f53efbed9e3f0011fa8b8e8009c67fa78',
            'win-x64': 'edb399b4278adfcb2675c6667f331eea8676ad07478864a9a5e47ea7574609c1',
        };

        const binaryCached = await read('coinjoin', fileName);
        if (binaryCached.success) {
            const hash = createHash('sha256').update(binaryCached.payload).digest('hex');
            if (hash === hashes[system]) {
                return;
            }
            await remove('coinjoin', fileName);
        }

        const transformed = system.replace('mac', 'osx');
        const url = `https://github.com/trezor/WalletWasabi/releases/download/release%2Fv15.0/WabiSabiClientLibrary-${transformed}${ext}`;
        const response = await fetch(url, { credentials: 'same-origin' });
        const binaryFetched = response.ok ? await response.arrayBuffer() : null;
        if (binaryFetched) {
            const hash = createHash('sha256').update(Buffer.from(binaryFetched)).digest('hex');
            if (hash === hashes[system]) {
                const result = await save('coinjoin', fileName, binaryFetched, 'binary');
                if (result.success) {
                    await fs.promises.chmod(
                        path.join(this.getProcessDir(), `${fileName}${ext}`),
                        0o755,
                    );

                    return;
                }
            }
        }

        throw new Error("Can't obtain Coinjoin binary.");
    }

    async start() {
        // We add the port where the process is going to run
        // since there is no way to pass it as argument yet.
        process.env.WCL_BIND_PORT = `${this.port}`;

        await this.ensureCoinjoinBinary();

        return super.start();
    }
}
