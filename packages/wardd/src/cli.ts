/**
 * wardd [--port 21329] [--data-dir ~/.trezor-ward] [--memory] [--token-file F]
 *       [--wm-url URL] [--evolu-node HEX] [--relay URL] [--origin O]... [--verbose]
 *       [--label-freshness] [--service-channel usb|usb:SERIAL|udp:HOST:WALLET_PORT] [--wallet-relay]
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
import { type DeviceService, startDeviceService } from './deviceService';
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
    const serviceIndex = args.indexOf('--service-channel');
    const servicePath = value('service-channel');
    if (serviceIndex >= 0 && (!servicePath || servicePath.startsWith('--'))) {
        throw new Error('--service-channel requires usb, usb:SERIAL or udp:HOST:WALLET_PORT');
    }
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
    const server =
        servicePath === undefined || flag('wallet-relay')
            ? await startServer({
                  wardd,
                  token,
                  port: Number(value('port') ?? process.env.WARDD_PORT ?? DEFAULT_PORT),
                  allowedOrigins: origins.length ? origins : DEFAULT_ORIGINS,
                  delays,
                  log,
              })
            : undefined;
    const debug =
        debugPort === undefined
            ? undefined
            : await startDebugServer({ wardd, token, port: Number(debugPort) });
    let deviceService: DeviceService | undefined;
    let isStopping = false;
    const stop = async (exitCode = 0) => {
        if (isStopping) return;
        isStopping = true;
        try {
            await deviceService?.close();
        } catch {
            log('WARD service could not release its binding');
            exitCode = 1;
        } finally {
            await debug?.close();
            await server?.close();
            await wardd.dispose();
        }
        process.exit(exitCode);
    };
    process.once('SIGINT', () => void stop());
    process.once('SIGTERM', () => void stop());
    if (servicePath !== undefined) {
        try {
            deviceService = await startDeviceService({
                wardd,
                devicePath: servicePath,
                onError: () => {
                    log('WARD service connection failed');
                    void stop(1);
                },
            });
        } catch {
            log('Could not connect to the WARD service channel');
            await stop(1);

            return;
        }
    }
    log(
        (server
            ? `wardd listening on ws://127.0.0.1:${server.port} `
            : 'wardd service connected ') +
            `(storage: ${memory ? 'memory' : dataDir}, WM: ${wmUrl ?? 'debug mock'}` +
            `${deviceService ? ', WARD service connected' : ''})`,
    );
    if (debug) log(`wardd debug listening on 127.0.0.1:${debug.port}`);
};

main().catch(e => {
    console.error(e);
    process.exit(1);
});
