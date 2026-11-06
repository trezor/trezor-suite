/**
 * wardd [--port 21329] [--data-dir ~/.trezor-ward] [--memory] [--token-file F]
 *       [--wm-url URL] [--evolu-node HEX] [--relay URL] [--origin O]... [--verbose]
 *       [--label-freshness]
 *
 * Serves the relay over a WebSocket for host libraries in another process (HWI). With no
 * --token-file, a token is generated into `<data-dir>/token` (mode 0600) and reused. With no
 * --wm-url, the WM is the in-process mock that signs with the debug key (debug firmware only).
 * --label-freshness asks the WM once per label display, so the device can warn about a stale label.
 */
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { InMemoryWardDb } from '@trezor/ward';

import { startDebugServer } from './debug';
import { EvoluWardStorage } from './evoluStorage';
import { createConsoleLog } from './logging';
import { DEFAULT_ORIGINS, DEFAULT_PORT, startServer } from './server';
import { Wardd } from './service';
import { HttpWm, MockWm } from './wm';

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

const main = async () => {
    const log = createConsoleLog();
    const delays = flag('delays') || process.env.WARD_DELAYS === '1';
    const memory = flag('memory');
    const dataDir = value('data-dir') ?? path.join(os.homedir(), '.trezor-ward');
    await fs.mkdir(dataDir, { recursive: true, mode: 0o700 });
    // --memory keeps the replica out of Evolu entirely: a fresh, throwaway store for tests.
    const storage = memory
        ? new InMemoryWardDb()
        : await EvoluWardStorage.open({
              dataDir,
              evoluNode: value('evolu-node'),
              relayUrl: value('relay'),
              log,
          });
    const wmUrl =
        value('wm-url') ??
        process.env.WARD_MANAGER_URL ??
        (process.env.WARD_MANAGER_PORT
            ? `http://127.0.0.1:${process.env.WARD_MANAGER_PORT}`
            : undefined);
    const debugPort = value('debug-port') ?? process.env.WARDD_DEBUG_PORT;
    const wardd = new Wardd({
        debugDropTransition:
            debugPort !== undefined && storage instanceof EvoluWardStorage
                ? (wardId, counter, root) => storage.debugDropTransition(wardId, counter, root)
                : undefined,
        storage,
        wm: wmUrl ? new HttpWm(wmUrl, log, delays) : new MockWm(log, delays),
        log: flag('verbose') || delays ? log : undefined,
        delays,
        labelFreshness: flag('label-freshness') || process.env.WARD_LABEL_FRESHNESS === '1',
    });
    const origins = values('origin');
    const token = await readOrCreateToken(dataDir, value('token-file'));
    const server = await startServer({
        wardd,
        token,
        port: Number(value('port') ?? process.env.WARDD_PORT ?? DEFAULT_PORT),
        allowedOrigins: origins.length ? origins : DEFAULT_ORIGINS,
        delays,
        log,
    });
    log(
        `wardd listening on ws://127.0.0.1:${server.port} ` +
            `(storage: ${memory ? 'memory' : dataDir}, WM: ${wmUrl ?? 'debug mock'})`,
    );
    const debug =
        debugPort === undefined
            ? undefined
            : await startDebugServer({ wardd, token, port: Number(debugPort) });
    if (debug) log(`wardd debug listening on 127.0.0.1:${debug.port}`);
    const stop = async () => {
        await debug?.close();
        await server.close();
        await wardd.dispose();
        process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
};

main().catch(e => {
    console.error(e);
    process.exit(1);
});
