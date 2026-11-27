/* eslint-disable no-console */
/**
 * relay --port 4000 --data-dir DIR [--verbose]
 *       [--quota-manager-port 4001 [--device-allowance BYTES]]
 *
 * A LOCAL EVOLU RELAY: the database wardd replicates through (`wardd --relay ws://127.0.0.1:4000`),
 * as its own process so it can run, log and be stopped apart from wardd. The relay keeps its
 * SQLite file in DIR and sees only encrypted Evolu messages, keyed by owner. `--verbose` raises
 * the relay's console to debug, which logs every sync exchange.
 *
 * It always says WHAT IT STORES AND RETRIEVES: one line per message written, and one per stored
 * message it reads back to send to a client -- the owner, the message's Evolu timestamp and its
 * size -- plus one per owner it registers. The relay holds no keys, so the message itself is
 * ciphertext and its size is all there is to say about it.
 *
 * `--quota-manager-port`: RUN AS SUITE SYNC DOES. The relay admits an owner only while a Quota
 * Manager holds storage for it and refuses writes beyond that storage, and a local stand-in for the
 * Quota Manager listens on the port given (see suiteSyncDev.ts). Ports 4000 and 4001 are where Suite
 * looks for a local Suite Sync. `--device-allowance` gives every device that asks this much quota,
 * in place of a registration (default 1 MiB, as production registers).
 */

import { type CreateSqliteDriver, createConsole, createConsoleFormatter } from '@evolu/common';
import { type OwnerIdBytes, ownerIdBytesToOwnerId } from '@evolu/common/local-first';
import { createRelayDeps, createRun, startRelay } from '@evolu/nodejs';
import { promises as fs } from 'fs';
import path from 'path';

import { DevQuotaManager } from './suiteSyncDev';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const value = (name: string) => {
    const i = args.indexOf(`--${name}`);

    return i >= 0 ? args[i + 1] : undefined;
};

const stamp = () => new Date().toISOString();
const hex = (bytes: unknown) =>
    bytes instanceof Uint8Array ? Buffer.from(bytes).toString('hex') : String(bytes);

/** The relay's SQLite driver, reporting every message it writes or reads back, and every owner. */
const storing =
    (base: CreateSqliteDriver): CreateSqliteDriver =>
    (name, options) =>
    async run => {
        const opened = await base(name, options)(run);
        if (!opened.ok) return opened;
        const driver = opened.value;
        let stored = 0;
        let retrieved = 0;

        return {
            ...opened,
            value: {
                ...driver,
                exec: query => {
                    const result = driver.exec(query);
                    const text = String(query.sql);
                    const [owner, second, third] = query.parameters;
                    const ownerId = () => ownerIdBytesToOwnerId(owner as OwnerIdBytes);
                    if (/insert into evolu_message/i.test(text) && result.changes > 0) {
                        stored += 1;
                        const bytes = third instanceof Uint8Array ? third.length : 0;
                        console.log(
                            `${stamp()} [store] message #${stored} owner=${ownerId()}` +
                                ` timestamp=${hex(second)} ${bytes}B (encrypted)`,
                        );
                    } else if (/insert into evolu_writeKey/i.test(text) && result.changes > 0) {
                        console.log(`${stamp()} [store] new owner ${ownerId()}`);
                    } else if (/select\s+"change"\s+from evolu_message/i.test(text)) {
                        // a stored message read back, to be sent to a client that is behind
                        const change = (result.rows[0] as { change?: unknown } | undefined)?.change;
                        retrieved += 1;
                        console.log(
                            `${stamp()} [retrieve] message #${retrieved} owner=${ownerId()}` +
                                ` timestamp=${hex(second)}` +
                                ` ${change instanceof Uint8Array ? change.length : 0}B (encrypted)`,
                        );
                    } else if (/delete from evolu_message/i.test(text)) {
                        console.log(`${stamp()} [store] deleted owner ${ownerId()}'s messages`);
                    }

                    return result;
                },
            },
        };
    };

const main = async () => {
    const port = Number(value('port') ?? 4000);
    const dataDir = path.resolve(value('data-dir') ?? 'evolu-relay');
    await fs.mkdir(dataDir, { recursive: true, mode: 0o700 });
    // the relay opens its SQLite file in the working directory
    process.chdir(dataDir);

    const console = createConsole({
        level: flag('verbose') ? 'debug' : 'info',
        formatter: createConsoleFormatter()({ timestampFormat: 'absolute' }),
    });
    const deps = createRelayDeps();
    await using run = createRun({
        ...deps,
        createSqliteDriver: storing(deps.createSqliteDriver),
        console,
    });
    await using disposer = new AsyncDisposableStack();
    const qmPort = value('quota-manager-port');
    if (qmPort === undefined) {
        disposer.use(
            await run.orThrow(
                startRelay({
                    port,
                    // a development relay: 16 MiB per owner is far above any WARD replica
                    isOwnerWithinQuota: (_ownerId, requiredBytes) =>
                        requiredBytes <= 16 * 1024 * 1024,
                }),
            ),
        );
        globalThis.console.log(
            `evolu relay listening on ws://127.0.0.1:${port} (data: ${dataDir}; admits any owner)`,
        );
    } else {
        const log = (line: string) => globalThis.console.log(`${stamp()} ${line}`);
        const qm = await DevQuotaManager.create({
            deviceAllowance: Number(value('device-allowance') ?? 1024 * 1024),
            stateFile: path.join(dataDir, 'quota-manager.json'),
            log,
        });
        disposer.use(
            await run.orThrow(
                startRelay({
                    port,
                    isOwnerAllowed: ownerId => {
                        const allowed = qm.isOwnerAllowed(ownerId);
                        if (!allowed) log(`[relay] refused owner ${ownerId}: no storage`);

                        return allowed;
                    },
                    isOwnerWithinQuota: (ownerId, requiredBytes) => {
                        const within = qm.isOwnerWithinQuota(ownerId, requiredBytes);
                        if (!within) {
                            log(
                                `[relay] refused a write for owner ${ownerId}: needs` +
                                    ` ${requiredBytes} B, limit ${qm.ownerLimit(ownerId)} B`,
                            );
                        }

                        return within;
                    },
                }),
            ),
        );
        const served = await qm.listen(Number(qmPort));
        disposer.defer(() => served.close());
        globalThis.console.log(
            `evolu relay listening on ws://127.0.0.1:${port} (data: ${dataDir}); quota manager` +
                ` on http://127.0.0.1:${served.port}/ -- admits owners with storage only`,
        );
    }

    await run.deps.shutdown;
};

main().catch(e => {
    console.error(e);
    process.exit(1);
});
