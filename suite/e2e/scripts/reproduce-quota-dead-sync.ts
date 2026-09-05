/* eslint-disable no-console */
// TEMPORARY reproduction script for: "a write rejected by the relay with a quota error is
// never re-sent, even after the quota is raised; only a relay re-subscription flushes it".
//
// It drives the bare Evolu client (same @evolu/common + createOwnerWebSocketTransport as Suite)
// against the local suite-sync docker stack, over a persistent local SQLite so that a client
// restart (dispose + recreate) keeps the locally written rows - mirroring an app restart.
// Every claim is verified by reading the relay back through an independent client in a separate
// process (same-process instances would share Node's BroadcastChannel and could pair up as
// leader/follower, reading each other's local DB instead of the relay).
//
// Prerequisites: yarn workspace @trezor/suite-e2e docker:suite-sync
// Run:           cd suite/e2e && yarn tsx scripts/reproduce-quota-dead-sync.ts

import {
    AppName,
    type Evolu,
    createBroadcastChannel,
    createConsole,
    createConsoleStoreOutput,
    createMessageChannel,
    createMessagePort,
    createOwnerWebSocketTransport,
    createRun,
    createSharedWorker,
    createWebSocket,
    createWorker,
    getOrThrow,
    testCreateLockManager,
} from '@evolu/common';
import {
    type CreateDbWorker,
    type DbWorkerInit,
    type EvoluPlatformDeps,
    type SharedWorkerInput,
    type SharedWorkerOutput,
    createEvolu,
    createEvoluDeps,
    initSharedWorker,
    startDbWorker,
} from '@evolu/common/local-first';
import { createBetterSqliteDriver } from '@evolu/nodejs';
import { execFile, execFileSync } from 'child_process';
import { rmSync } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { WebSocket } from 'ws';

const execFileAsync = promisify(execFile);

import {
    BaseEvoluClient,
    RELAY_URL,
    mnemonic12Fixtures,
    seedQuotaManagerData,
    setOwnerStorageLimit,
    wipeAndRestartEvoluRelayServer,
} from '@suite-common/e2e-evolu-client';
import { Schema, createEvoluAppOwnerFromTrezorData } from '@suite-common/suite-sync-evolu';

const { ownerSecret, ownerId, walletSeed, accountSeed, createAddressSeed } = mnemonic12Fixtures;

const REPO_ROOT = path.resolve(__dirname, '../../../');
const E2E_DIR = path.resolve(__dirname, '..');
// One synced wallet row is ~170 B, so the first write fits and the second one must exceed the limit
const TINY_LIMIT = 200;
const RAISED_LIMIT = 10486;
const READER_SETTLE_MS = 6_000;
const SPONTANEOUS_RETRY_WAIT_MS = 30_000;
const ADDRESS = 'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa';

type RelaySnapshot = { wallet: string[]; account: string[]; address: string[] };

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ---------- reader mode (separate process): sync from relay, print what it holds ----------

const runReaderMode = async () => {
    const reader = new BaseEvoluClient();
    await reader.init({ ownerSecret });
    await sleep(READER_SETTLE_MS);

    const labelsOf = async (table: 'wallet' | 'account' | 'address') =>
        (await reader.readFrom(table)).map(row => String(row.label));

    const snapshot: RelaySnapshot = {
        wallet: await labelsOf('wallet'),
        account: await labelsOf('account'),
        address: await labelsOf('address'),
    };
    console.log(`RESULT:${JSON.stringify(snapshot)}`);
    await reader.dispose();
};

// Must stay non-blocking: the writer's evolu runs on this same event loop, so a
// synchronous child process would freeze its send pipeline while we "wait".
const readRelay = async (): Promise<RelaySnapshot> => {
    const { stdout } = await execFileAsync('yarn', ['tsx', __filename, '--read'], {
        cwd: E2E_DIR,
        encoding: 'utf8',
        maxBuffer: 10_000_000,
    });
    const line = stdout.split('\n').find(candidate => candidate.startsWith('RESULT:'));
    if (!line) throw new Error(`Reader produced no RESULT line:\n${stdout}`);

    return JSON.parse(line.slice('RESULT:'.length)) as RelaySnapshot;
};

const readRelayUntil = async (
    predicate: (snapshot: RelaySnapshot) => boolean,
    attempts = 3,
): Promise<RelaySnapshot> => {
    let snapshot = await readRelay();
    for (let attempt = 1; attempt < attempts && !predicate(snapshot); attempt++) {
        snapshot = await readRelay();
    }

    return snapshot;
};

const readRelayStoredBytes = () => {
    const ownerHex = Buffer.from(ownerId, 'base64url').toString('hex').toUpperCase();
    const output = execFileSync(
        'docker',
        [
            'compose',
            '-f',
            'docker/docker-compose.suite-ci-e2e.yml',
            'exec',
            '-T',
            'suite-sync',
            'node',
            '-e',
            `const db=require('better-sqlite3')('/app/data/evolu-relay.db');const row=db.prepare("SELECT storedBytes FROM evolu_usage WHERE hex(ownerId)='${ownerHex}'").get();console.log(row?row.storedBytes:0);`,
        ],
        { cwd: REPO_ROOT },
    );

    return Number(output.toString().trim());
};

// ---------- writer: bare evolu client over a PERSISTENT local SQLite ----------
// Persistence matters: "reconnect" below is dispose + recreate (an app restart), and the
// recreated instance must still hold the locally-written-but-rejected row to re-send it.

const WRITER_DB_NAME = 'quota-repro-writer';

const createNodeDepsWithFileDb = () => {
    const consoleStoreOutput = createConsoleStoreOutput();
    const console = createConsole({ output: consoleStoreOutput });
    const lockManager = testCreateLockManager();
    const nodeCreateWebSocket: typeof createWebSocket = (url, options) =>
        createWebSocket(url, {
            ...options,
            WebSocketConstructor: WebSocket as unknown as typeof globalThis.WebSocket,
        });
    const sharedWorkerRun = createRun({
        console,
        consoleStoreOutputEntry: consoleStoreOutput.entry,
        createBroadcastChannel,
        createMessageChannel,
        createMessagePort,
        createWebSocket: nodeCreateWebSocket,
        lockManager,
    });
    const dbWorkerRun = createRun({
        console,
        consoleStoreOutputEntry: consoleStoreOutput.entry,
        createBroadcastChannel,
        createMessagePort,
        lockManager,
        createSqliteDriver: () => createBetterSqliteDriver(WRITER_DB_NAME),
    });
    const createDbWorker: CreateDbWorker = () =>
        createWorker<DbWorkerInit>(self => {
            dbWorkerRun(startDbWorker(self));
        });
    const sharedWorker = createSharedWorker<SharedWorkerInput, SharedWorkerOutput>(self => {
        sharedWorkerRun(initSharedWorker(self));
    });
    const platformDeps: EvoluPlatformDeps = {
        console,
        createBroadcastChannel,
        createDbWorker,
        createMessageChannel,
        lockManager,
        reloadApp: () => {},
        sharedWorker,
    };
    const evoluDeps = createEvoluDeps(platformDeps);
    const run = createRun(evoluDeps);
    run.onAbort(() => evoluDeps[Symbol.dispose]());

    return run;
};

const deleteWriterDb = () => {
    for (const suffix of ['', '-shm', '-wal', '-journal']) {
        rmSync(path.join(E2E_DIR, `${WRITER_DB_NAME}.db${suffix}`), { force: true });
    }
};

const createWriter = async () => {
    const run = createNodeDepsWithFileDb();
    const owner = createEvoluAppOwnerFromTrezorData({ data: ownerSecret });
    if (!owner.ok) throw new Error(`Failed to parse owner: ${JSON.stringify(owner.error)}`);

    const appName = AppName.orThrow(`trezor-suite-e2e-${owner.value.id.replaceAll('_', '-')}`);
    const errors: string[] = [];
    run.deps.evoluError.subscribe(() => {
        const error = run.deps.evoluError.get();
        if (error) errors.push(error.type);
    });

    const evolu: Evolu<typeof Schema> = getOrThrow(
        await run(
            createEvolu(Schema, {
                appName,
                transports: [
                    createOwnerWebSocketTransport({ url: RELAY_URL, ownerId: owner.value.id }),
                ],
                appOwner: owner.value,
            }),
        ),
    );

    return {
        errors,
        write: <T extends keyof typeof Schema>(table: T, row: object) => {
            console.log(`   writer: upsert ${table}`);
            evolu.upsert(table, row as never);
        },
        dispose: () => evolu[Symbol.asyncDispose](),
    };
};

// ---------- verification bookkeeping ----------

type Check = { name: string; passed: boolean; detail: string };
const checks: Check[] = [];

const verify = (name: string, passed: boolean, detail: string) => {
    checks.push({ name, passed, detail });
    console.log(`   ${passed ? 'PASS' : 'FAIL'}  ${name}  (${detail})`);
};

const has = (rows: string[], label: string) => rows.includes(label);

const main = async () => {
    console.log('1) Wiping relay + quota DB, seeding owner quota, shrinking it to', TINY_LIMIT, 'B');
    await wipeAndRestartEvoluRelayServer();
    seedQuotaManagerData({ ownerId });
    setOwnerStorageLimit({ ownerId, storageLimit: TINY_LIMIT });
    deleteWriterDb();

    let writer = await createWriter();

    console.log('\n2) Baseline write that fits the limit');
    writer.write('wallet', walletSeed);
    const afterBaseline = await readRelayUntil(snapshot => has(snapshot.wallet, walletSeed.label));
    const baselineOk = has(afterBaseline.wallet, walletSeed.label);
    verify('baseline row reached the relay', baselineOk, JSON.stringify(afterBaseline));
    if (!baselineOk) {
        throw new Error(
            `Environment problem: baseline write never synced. writer errors=${JSON.stringify(writer.errors)}, relay storedBytes=${readRelayStoredBytes()}`,
        );
    }
    const baselineBytes = readRelayStoredBytes();

    console.log('\n3) Write that exceeds the limit -> relay must reject it');
    writer.write('account', accountSeed);
    const afterReject = await readRelay();
    verify(
        'client received ProtocolQuotaError',
        writer.errors.includes('ProtocolQuotaError'),
        `errors=${JSON.stringify(writer.errors)}`,
    );
    verify(
        'rejected row is NOT on the relay',
        !has(afterReject.account, accountSeed.label),
        JSON.stringify(afterReject),
    );
    verify(
        'relay stored bytes unchanged',
        readRelayStoredBytes() === baselineBytes,
        `${readRelayStoredBytes()} B vs baseline ${baselineBytes} B`,
    );

    console.log(`\n4) Raise the limit to ${RAISED_LIMIT} B (what Suite's top-up does)`);
    setOwnerStorageLimit({ ownerId, storageLimit: RAISED_LIMIT });
    console.log(`   waiting ${SPONTANEOUS_RETRY_WAIT_MS / 1000} s for a spontaneous retry...`);
    await sleep(SPONTANEOUS_RETRY_WAIT_MS);
    const afterWait = await readRelay();
    verify(
        'no spontaneous retry: rejected row still absent',
        !has(afterWait.account, accountSeed.label),
        JSON.stringify(afterWait),
    );

    console.log('\n5) New write to a different row after the raise');
    writer.write('address', createAddressSeed(ADDRESS));
    const afterNudge = await readRelayUntil(snapshot => snapshot.address.length > 0);
    verify(
        'new write syncs normally',
        afterNudge.address.length > 0,
        JSON.stringify(afterNudge),
    );
    verify(
        'rejected row is still absent (not carried along by the new write)',
        !has(afterNudge.account, accountSeed.label),
        JSON.stringify(afterNudge),
    );

    console.log('\n6) Restart the client over the same local DB (fresh relay subscription)');
    await writer.dispose();
    writer = await createWriter();
    const afterReconnect = await readRelayUntil(snapshot => has(snapshot.account, accountSeed.label));
    verify(
        'rejected row is flushed by the fresh subscription',
        has(afterReconnect.account, accountSeed.label),
        JSON.stringify(afterReconnect),
    );

    await writer.dispose();
    deleteWriterDb();

    console.log('\n=== SUMMARY ===');
    for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'}  ${check.name}`);

    const rejectedRowStuck = checks
        .filter(check => check.name.startsWith('rejected row is still') || check.name.startsWith('no spontaneous'))
        .every(check => check.passed);
    const flushedByReconnect = checks.find(check => check.name.startsWith('rejected row is flushed'))?.passed;
    const newWritesSync = checks.find(check => check.name.startsWith('new write syncs'))?.passed;

    console.log('\n=== VERDICT ===');
    if (rejectedRowStuck && newWritesSync && flushedByReconnect) {
        console.log(
            'Confirmed: Evolu drops a quota-rejected write and never re-sends it on its own or with later\n' +
                'writes; only re-subscribing the owner (full re-sync) flushes it. New writes are unaffected.',
        );
    } else if (!rejectedRowStuck) {
        console.log('Bare client re-sent the rejected row without a reconnect - behavior differs from Suite.');
    } else {
        console.log('Unexpected pattern - inspect the FAIL lines above.');
    }

    process.exit(checks.every(check => check.passed) ? 0 : 1);
};

if (process.argv.includes('--read')) {
    runReaderMode()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
} else {
    main().catch(error => {
        console.error(error);
        process.exit(1);
    });
}
