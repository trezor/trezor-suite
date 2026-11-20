/* eslint-disable no-console */
/**
 * wm --port 21330 --data-dir DIR | --memory
 *
 * THE DEVELOPMENT WARD MANAGER as its own process: wardd reaches it with `--wm http://127.0.0.1:21330`.
 * It signs with the debug WM key, which only emulator and debug firmware trust. Its state -- each
 * ward's head and every head nonce it ever issued -- is kept in DIR/wm.json, so a restart is not a
 * WM swap. It logs every enrolment, attestation and advance; stopping it shows what a device sees
 * when no WM can be reached.
 */
import { toHex } from '@trezor/ward-core';

import { DEFAULT_WM_PORT, startWmServer } from './wmServer';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => {
    const i = args.indexOf(`--${name}`);

    return i >= 0 ? args[i + 1] : undefined;
};

const main = async () => {
    const dataDir = flag('memory') ? null : value('data-dir');
    if (dataDir === undefined) throw new Error('--data-dir DIR or --memory is required');
    const log = (line: string) => console.log(`${new Date().toISOString()} ${line}`);
    const server = await startWmServer({
        port: Number(value('port') ?? DEFAULT_WM_PORT),
        dataDir,
        log,
    });
    log(
        `WARD Manager listening on http://127.0.0.1:${server.port}` +
            ` (state: ${dataDir ?? 'memory'}, debug key ${toHex(server.wm.pubkey).slice(0, 16)}…)`,
    );
    const stop = async () => {
        await server.close();
        process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
};

main().catch(e => {
    console.error(e);
    process.exit(1);
});
