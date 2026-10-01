/* eslint-disable no-console */
/**
 * wardd --port 21329 --data-dir ~/.trezor-ward [--token-file F] [--memory] [--relay URL] [--origin O]...
 *
 * With no --token-file, a token is generated into `<data-dir>/token` (mode 0600) and reused.
 *
 * wardd --service [--port 21324] [--state-file F]   (also accepted: --debug-port, --key-file, --verbose)
 *
 * SERVES A SERVICE BUILD over its WARD interface instead -- the command line of the Python daemon
 * it replaces, so `--port` here is the device's WIRE port and the interface is found at +7.
 */
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { DEFAULT_ORIGINS, DEFAULT_PORT, startServer } from './server';
import { Wardd } from './service';
import { runServiceDaemon } from './serviceMode/daemon';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => {
    const i = args.indexOf(`--${name}`);

    return i >= 0 ? args[i + 1] : undefined;
};
const values = (name: string) =>
    args.flatMap((a, i) => (a === `--${name}` && args[i + 1] ? [args[i + 1]!] : []));

const readOrCreateToken = async (dataDir: string, tokenFile?: string) => {
    if (tokenFile) return (await fs.readFile(tokenFile, 'utf8')).trim();
    const file = path.join(dataDir, 'token');
    try {
        return (await fs.readFile(file, 'utf8')).trim();
    } catch {
        const token = randomBytes(32).toString('hex');
        await fs.writeFile(file, token, { mode: 0o600 });

        return token;
    }
};

const service = async () => {
    const log = (line: string) => process.stdout.write(`${line}\n`);
    if (value('key-file')) {
        log('NOTE --key-file is unused: a codec service interface carries no identity to pin');
    }
    let stop: () => void = () => {};
    const stopped = new Promise<void>(resolve => {
        stop = resolve;
    });
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
    const code = await runServiceDaemon({
        port: Number(value('port') ?? 21324),
        stateFile: value('state-file') ?? null,
        log,
        stopped,
    });
    process.exit(code);
};

const main = async () => {
    if (flag('service')) return service();
    const memory = flag('memory');
    const dataDir = value('data-dir') ?? path.join(os.homedir(), '.trezor-ward');
    await fs.mkdir(dataDir, { recursive: true, mode: 0o700 });
    const wardd = await Wardd.create({
        dataDir: memory ? null : dataDir,
        memory,
        relayUrl: value('relay'),
    });
    const origins = values('origin');
    const server = await startServer({
        wardd,
        token: await readOrCreateToken(dataDir, value('token-file')),
        port: Number(value('port') ?? DEFAULT_PORT),
        allowedOrigins: origins.length ? origins : DEFAULT_ORIGINS,
    });
    console.log(
        `wardd listening on ws://127.0.0.1:${server.port} (data: ${memory ? 'memory' : dataDir})`,
    );
    const stop = async () => {
        await server.close();
        await wardd.close();
        process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
};

main().catch(e => {
    console.error(e);
    process.exit(1);
});
