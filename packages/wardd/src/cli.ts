/* eslint-disable no-console */
/**
 * wardd --port 21329 --data-dir ~/.trezor-ward [--token-file F] [--memory] [--relay URL] [--origin O]...
 *       [--suite-sync local|dev|prod]
 *                     replicate through Suite Sync: its relay, and its Quota Manager to fund the
 *                     WARD owner (the same endpoints Suite uses). Excludes --relay.
 *       [--quota-manager URL]
 *                     with --relay: the Quota Manager funding owners on that relay
 *       [--verbose]   log every call, its outcome and the device messages it exchanged
 *       [--adversarial-tests]
 *                     allow the ADVERSARIAL TEST methods: serving a device an older state on
 *                     purpose, which it must refuse. For test stacks only.
 *       [--wm URL]    the WARD Manager to use (`wm` process, see wmCli.ts); without it, an
 *                     in-process development WM persisted in the data dir
 *       [--without-wm]
 *                     NO WARD Manager at all, for firmware built `--ward-without-wm` (the MVP):
 *                     a sync is a catch-up the device persists, a write is stored without a WM's
 *                     say. Cannot be combined with --wm.
 *       [--no-roll-forward]
 *                     do not have the device sign accepted transitions again for a WM whose register
 *                     went back (a restored backup); models a host that does not hold them.
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

import { HttpWm, SUITE_SYNC_ENDPOINTS, type SuiteSyncEnvironment } from '@trezor/ward-core';

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
    const verbose = flag('verbose');
    const withoutWm = flag('without-wm');
    if (withoutWm && value('wm')) {
        console.error('--without-wm and --wm cannot be combined');
        process.exit(2);
    }
    // Suite Sync names its relay and Quota Manager together, so a production wardd never pairs
    // the production Quota Manager with a relay that admits any owner, or the other way round.
    const suiteSync = value('suite-sync');
    if (suiteSync !== undefined && !(suiteSync in SUITE_SYNC_ENDPOINTS)) {
        console.error(`--suite-sync takes ${Object.keys(SUITE_SYNC_ENDPOINTS).join(', ')}`);
        process.exit(2);
    }
    if (suiteSync !== undefined && (value('relay') || value('quota-manager'))) {
        console.error(
            '--suite-sync names the relay and Quota Manager; drop --relay/--quota-manager',
        );
        process.exit(2);
    }
    if (value('quota-manager') && !value('relay')) {
        console.error('--quota-manager needs the --relay it funds owners on');
        process.exit(2);
    }
    const endpoints =
        suiteSync !== undefined
            ? SUITE_SYNC_ENDPOINTS[suiteSync as SuiteSyncEnvironment]
            : { relayUrl: value('relay'), quotaManagerUrl: value('quota-manager') };
    const log = (line: string) => process.stdout.write(`${new Date().toISOString()} ${line}\n`);
    const wardd = await Wardd.create({
        dataDir: memory ? null : dataDir,
        memory,
        relayUrl: endpoints.relayUrl,
        quotaManagerUrl: endpoints.quotaManagerUrl,
        wm: value('wm') ? new HttpWm(value('wm')!) : undefined,
        withoutWm,
        log: verbose ? log : undefined,
        rollForward: !flag('no-roll-forward'),
    });
    const origins = values('origin');
    const server = await startServer({
        log: verbose ? log : undefined,
        wardd,
        token: await readOrCreateToken(dataDir, value('token-file')),
        port: Number(value('port') ?? DEFAULT_PORT),
        allowedOrigins: origins.length ? origins : DEFAULT_ORIGINS,
        adversarialTests: flag('adversarial-tests'),
    });
    if (flag('adversarial-tests')) {
        console.log('ADVERSARIAL TESTS ENABLED: this wardd will serve older states on request');
    }
    console.log(
        `wardd listening on ws://127.0.0.1:${server.port} (data: ${memory ? 'memory' : dataDir}` +
            `${endpoints.relayUrl ? `, relay: ${endpoints.relayUrl}` : ''}` +
            `${endpoints.quotaManagerUrl ? `, quota manager: ${endpoints.quotaManagerUrl}` : ''}` +
            `, WM: ${withoutWm ? 'none (MVP)' : (value('wm') ?? 'in-process')})`,
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
