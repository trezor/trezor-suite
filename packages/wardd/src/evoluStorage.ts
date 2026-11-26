/**
 * The WARD transition log over Evolu: wardd's OWN instance (`trezor-ward-*`), so WARD rows share
 * neither Suite's schema nor its owner. Node only (the better-sqlite3 driver).
 *
 * Two append-only tables, both keyed by (wardId, counter, targetRoot):
 *
 *   wardTransition  one self-contained row per transition, written before the WM sees it
 *   wardAcceptance  the WM's finalization (timestamp, signature) of a transition it accepted,
 *                   shown on the device when that transition has to be reverted
 *
 * The head is never stored; it comes from the WM attestation or the device's anchor, and
 * entries are replayed from the log.
 *
 * THE OWNER is the SLIP-21 child `WARD` of the wallet's Evolu node when one is given (so every
 * replica of the wallet shares it), else a random secret kept in the data directory: a local-only
 * replica until relay sync is wired.
 *
 * Ported from ward-draft's `evoluBackend.ts` (owner derivation, node run, settled writes).
 */
import {
    AppName,
    type AppOwner,
    type CreateSqliteDriver,
    type CreateWebSocket,
    type Evolu,
    String as EvoluString,
    NonNegativeInt,
    type Owner,
    OwnerEncryptionKey,
    OwnerIdBytes,
    OwnerSecret,
    OwnerWriteKey,
    createBroadcastChannel,
    createConsole,
    createConsoleStoreOutput,
    createIdFromString,
    createMessageChannel,
    createMessagePort,
    createOwnerWebSocketTransport,
    createQueryBuilder,
    createRun,
    createSharedWorker,
    createSlip21,
    createWebSocket,
    createWorker,
    getOrThrow,
    id,
    ownerIdBytesToOwnerId,
    ownerSecretToMnemonic,
    sqliteTrue,
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
import { installPolyfills } from '@evolu/common/polyfills';
import { createBetterSqliteDriver } from '@evolu/nodejs';
import { hmac } from '@noble/hashes/hmac.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, randomBytes } from '@noble/hashes/utils.js';
import { promises as fs } from 'fs';
import path from 'path';
import { WebSocket } from 'ws';

import type { WardAcceptance, WardTransition } from '@trezor/ward';
import { transitionFingerprint } from '@trezor/ward';

import { type Log, silentLog, startActivity } from './logging';
import type { WardTransitionStore } from './transitionStore';

/**
 * The WARD owner secret: the SLIP-21 child `WARD` of the node the device returns for
 * `['TREZOR', 'Evolu']`. A child is HMAC-SHA512 keyed by the parent's first half; its key is the
 * second half.
 */
export const wardOwnerSecret = (evoluNodeHex: string): Uint8Array => {
    const node = hexToBytes(evoluNodeHex);
    if (node.length !== 64) throw new Error('evoluNode must be the 64-byte SLIP-21 node');
    const label = new TextEncoder().encode('WARD');
    const data = new Uint8Array(1 + label.length);
    data.set(label, 1);

    return hmac(sha512, node.slice(0, 32), data).slice(32, 64);
};

/** The Evolu owner for a WARD secret, derived the way Suite derives its own from a Trezor node. */
export const wardOwner = (secretBytes: Uint8Array): AppOwner => {
    const secret = getOrThrow(OwnerSecret.fromUnknown(secretBytes));
    const owner: Owner = {
        id: ownerIdBytesToOwnerId(
            getOrThrow(
                OwnerIdBytes.fromUnknown(createSlip21(secret, ['OwnerIdBytes']).slice(0, 16)),
            ),
        ),
        encryptionKey: getOrThrow(
            OwnerEncryptionKey.fromUnknown(createSlip21(secret, ['OwnerEncryptionKey'])),
        ),
        writeKey: getOrThrow(
            OwnerWriteKey.fromUnknown(createSlip21(secret, ['OwnerWriteKey']).slice(0, 16)),
        ),
    };

    return { type: 'AppOwner', mnemonic: ownerSecretToMnemonic(secret), ...owner };
};

const WardTransitionId = id('WardTransitionId');
const WardAcceptanceId = id('WardAcceptanceId');

export const WardSchema = {
    wardTransition: {
        id: WardTransitionId,
        wardId: EvoluString,
        counter: NonNegativeInt,
        body: EvoluString,
    },
    wardAcceptance: {
        id: WardAcceptanceId,
        wardId: EvoluString,
        counter: NonNegativeInt,
        targetRoot: EvoluString,
        timestamp: NonNegativeInt,
        wmSignature: EvoluString,
    },
};

const createQuery = createQueryBuilder(WardSchema);

const createQueries = () => ({
    transitions: createQuery(db => db.selectFrom('wardTransition').selectAll()),
    acceptances: createQuery(db => db.selectFrom('wardAcceptance').selectAll()),
});

type StoredRow = { wardId: string | null; body: string | null; isDeleted: 0 | 1 | null };

/** Evolu's platform deps for Node, with the SQLite files under `dataDir` (null: in memory). */
const createNodeRun = (dataDir: string | null) => {
    // Evolu 8.10 calls Map.prototype.getOrInsertComputed, which Node 24 lacks.
    installPolyfills();

    const consoleStoreOutput = createConsoleStoreOutput();
    const console = createConsole({ output: consoleStoreOutput });
    const lockManager = testCreateLockManager();
    const nodeCreateWebSocket: CreateWebSocket = (url, options) =>
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
    const createSqliteDriver: CreateSqliteDriver = (name, options) =>
        dataDir === null
            ? createBetterSqliteDriver(name, { mode: 'memory' })
            : createBetterSqliteDriver(path.join(dataDir, name) as typeof name, options);
    const dbWorkerRun = createRun({
        console,
        consoleStoreOutputEntry: consoleStoreOutput.entry,
        createBroadcastChannel,
        createMessagePort,
        lockManager,
        createSqliteDriver,
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

    return { run, evoluError: evoluDeps.evoluError };
};

/** What `settled` listens to for failure: Evolu's shared error store, or a test's stand-in. */
export interface ErrorStore {
    get(): unknown;
    subscribe(listener: () => void): () => void;
}

/**
 * A write that SETTLES, whatever Evolu does. Evolu's db worker reports a failed mutation on its
 * shared error store, not to the mutation, so `onComplete` alone may never fire and a caller
 * waiting on it would hold the conversation lock forever. The error store catches the failure
 * Evolu reports; the timeout bounds the one it does not.
 */
export const settled = (
    start: (done: () => void) => void,
    opts: { errors: ErrorStore; timeoutMs: number },
): Promise<void> =>
    new Promise<void>((resolve, reject) => {
        const before = opts.errors.get();
        let finished = false;
        const held: { timer?: ReturnType<typeof setTimeout>; unsubscribe: () => void } = {
            unsubscribe: () => {},
        };
        const finish = (error?: Error) => {
            if (finished) return;
            finished = true;
            clearTimeout(held.timer);
            held.unsubscribe();
            if (error) reject(error);
            else resolve();
        };
        held.unsubscribe = opts.errors.subscribe(() => {
            const error = opts.errors.get();
            if (error && error !== before) {
                finish(new Error(`Evolu reported an error: ${JSON.stringify(error)}`));
            }
        });
        held.timer = setTimeout(
            () => finish(new Error(`the write did not settle within ${opts.timeoutMs} ms`)),
            opts.timeoutMs,
        );
        try {
            start(() => finish());
        } catch (e) {
            finish(e instanceof Error ? e : new Error(String(e)));
        }
    });

export type EvoluStorageOptions = {
    log?: Log;
    /** where the SQLite file and the local owner secret live; null keeps both in memory (tests) */
    dataDir: string | null;
    /** the wallet's 64-byte SLIP-21 Evolu node (hex); without it a local owner secret is used */
    evoluNode?: string;
    /** 32-byte WARD Evolu owner secret for an independent replica. */
    ownerSecret?: Uint8Array;
    /** an Evolu relay to replicate through; none keeps the replica local */
    relayUrl?: string;
    /** how long a write may take before it is failed; see `settled` */
    writeTimeoutMs?: number;
};

const DEFAULT_WRITE_TIMEOUT_MS = 30_000;

const readOrCreateSecret = async (dataDir: string | null): Promise<Uint8Array> => {
    if (dataDir === null) return randomBytes(32);
    const file = path.join(dataDir, 'owner-secret');
    try {
        return hexToBytes((await fs.readFile(file, 'utf8')).trim());
    } catch {
        const secret = randomBytes(32);
        await fs.writeFile(file, bytesToHex(secret), { mode: 0o600 });

        return secret;
    }
};

export class EvoluWardStorage implements WardTransitionStore {
    private transitionWrites: Promise<void> = Promise.resolve();
    private constructor(
        private readonly evolu: Evolu<typeof WardSchema>,
        private readonly queries: ReturnType<typeof createQueries>,
        private readonly unsubscribe: () => void,
        private readonly run: ReturnType<typeof createNodeRun>['run'],
        private readonly errors: ErrorStore,
        private readonly writeTimeoutMs: number,
        private readonly log: Log,
    ) {}

    static async open(opts: EvoluStorageOptions): Promise<EvoluWardStorage> {
        const secret =
            opts.ownerSecret ??
            (opts.evoluNode
                ? wardOwnerSecret(opts.evoluNode)
                : await readOrCreateSecret(opts.dataDir));
        const owner = wardOwner(secret);
        const { run, evoluError } = createNodeRun(opts.dataDir);
        const evolu = getOrThrow(
            await run(
                createEvolu(WardSchema, {
                    appName: AppName.orThrow(`trezor-ward-${owner.id.replaceAll('_', '-')}`),
                    transports: opts.relayUrl
                        ? [createOwnerWebSocketTransport({ url: opts.relayUrl, ownerId: owner.id })]
                        : [],
                    appOwner: owner,
                }),
            ),
        );
        const queries = createQueries();
        // SUBSCRIBED, so rows another replica sends are in `getQueryRows` without a reload, and a
        // local write's rows are there by the time its `onComplete` fires.
        const unsubscribes = [
            evolu.subscribeQuery(queries.transitions)(() => {}),
            evolu.subscribeQuery(queries.acceptances)(() => {}),
        ];
        await Promise.all([
            evolu.loadQuery(queries.transitions),
            evolu.loadQuery(queries.acceptances),
        ]);

        return new EvoluWardStorage(
            evolu,
            queries,
            () => unsubscribes.forEach(u => u()),
            run,
            evoluError,
            opts.writeTimeoutMs ?? DEFAULT_WRITE_TIMEOUT_MS,
            opts.log ?? silentLog,
        );
    }

    /** The live rows' bodies for one wallet: deleted rows and other wallets' rows dropped. */
    private static bodies(rows: readonly StoredRow[], wardId: string): string[] {
        return rows
            .filter(row => !row.isDeleted && row.wardId === wardId && typeof row.body === 'string')
            .map(row => row.body as string);
    }

    private write(start: (onComplete: () => void) => void) {
        return settled(start, { errors: this.errors, timeoutMs: this.writeTimeoutMs });
    }

    private read<T>(
        operation: string,
        table: string,
        read: () => T,
        summarize: (value: T) => Record<string, unknown>,
    ): T {
        const activity = startActivity(this.log, `evolu.${operation}`, { table });
        try {
            const value = read();
            activity.success(summarize(value));

            return value;
        } catch (error) {
            activity.failure(error);
            throw error;
        }
    }

    appendTransition(wardId: string, transition: WardTransition) {
        const append = async () => {
            const previous = this.getTransitions(wardId).find(
                record =>
                    record.counter === transition.counter &&
                    record.targetRoot === transition.targetRoot,
            );
            if (previous) {
                if (transitionFingerprint(previous) !== transitionFingerprint(transition))
                    throw new Error('cannot rewrite an existing WARD transition');

                return;
            }
            await this.write(onComplete =>
                this.evolu.upsert(
                    'wardTransition',
                    {
                        id: createIdFromString(
                            `${wardId} ${transition.counter} ${transition.targetRoot}`,
                        ),
                        wardId,
                        counter: getOrThrow(NonNegativeInt.fromUnknown(transition.counter)),
                        body: JSON.stringify(transition),
                    },
                    { onComplete },
                ),
            );
        };
        const run = this.transitionWrites.then(append, append);
        this.transitionWrites = run.catch(() => {});

        return run;
    }

    getTransitions(wardId: string): WardTransition[] {
        return this.read(
            'getTransitions',
            'wardTransition',
            () =>
                EvoluWardStorage.bodies(this.evolu.getQueryRows(this.queries.transitions), wardId)
                    .map(body => JSON.parse(body) as WardTransition)
                    .sort((a, b) => a.counter - b.counter),
            value => ({ rows: value.length }),
        );
    }

    appendAcceptance(wardId: string, acceptance: WardAcceptance) {
        const append = async () => {
            const previous = this.getAcceptances(wardId).find(
                record =>
                    record.counter === acceptance.counter &&
                    record.targetRoot === acceptance.targetRoot,
            );
            if (previous) {
                if (
                    previous.timestamp !== acceptance.timestamp ||
                    previous.wmSignature !== acceptance.wmSignature
                )
                    throw new Error('cannot rewrite an existing WARD acceptance');

                return;
            }
            await this.write(onComplete =>
                this.evolu.upsert(
                    'wardAcceptance',
                    {
                        id: createIdFromString(
                            `${wardId} ${acceptance.counter} ${acceptance.targetRoot}`,
                        ),
                        wardId,
                        counter: getOrThrow(NonNegativeInt.fromUnknown(acceptance.counter)),
                        targetRoot: acceptance.targetRoot,
                        timestamp: getOrThrow(NonNegativeInt.fromUnknown(acceptance.timestamp)),
                        wmSignature: acceptance.wmSignature,
                    },
                    { onComplete },
                ),
            );
        };
        const run = this.transitionWrites.then(append, append);
        this.transitionWrites = run.catch(() => {});

        return run;
    }

    getAcceptances(wardId: string): WardAcceptance[] {
        return this.read(
            'getAcceptances',
            'wardAcceptance',
            () =>
                this.evolu
                    .getQueryRows(this.queries.acceptances)
                    .filter(row => !row.isDeleted && row.wardId === wardId)
                    .flatMap(row =>
                        row.counter === null ||
                        row.targetRoot === null ||
                        row.timestamp === null ||
                        row.wmSignature === null
                            ? []
                            : [
                                  {
                                      counter: row.counter,
                                      targetRoot: row.targetRoot,
                                      timestamp: row.timestamp,
                                      wmSignature: row.wmSignature,
                                  },
                              ],
                    ),
            value => ({ rows: value.length }),
        );
    }

    /** Fault injection for the explicitly enabled debug channel. */
    async debugDropTransition(wardId: string, counter: number, root: string): Promise<void> {
        if (
            !this.getTransitions(wardId).some(
                record => record.counter === counter && record.targetRoot === root,
            )
        )
            throw new Error('debug transition not found');
        await this.write(onComplete =>
            this.evolu.update(
                'wardTransition',
                {
                    id: createIdFromString(`${wardId} ${counter} ${root}`),
                    isDeleted: sqliteTrue,
                },
                { onComplete },
            ),
        );
    }

    async dispose() {
        this.unsubscribe();
        await this.evolu[Symbol.asyncDispose]();
        await this.run[Symbol.asyncDispose]();
    }
}
