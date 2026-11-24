/**
 * The link log in Evolu: wardd's OWN instance (`trezor-ward-*`), owned by a SLIP-21 child of the
 * wallet's Evolu node, so WARD rows neither share Suite's schema nor its owner.
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
import path from 'path';
import { WebSocket } from 'ws';

import { toBytes, toHex } from '@trezor/ward-core';

import {
    type StoredAttestation,
    type StoredLink,
    type WardBackend,
    attestationId,
    linkId,
} from './backend';

/** The Evolu owner for a WARD secret, derived the way Suite derives its own from a Trezor node. */
export const wardOwner = (secretBytes: Uint8Array): AppOwner => {
    const secret = getOrThrow(OwnerSecret.from(secretBytes));
    const owner: Owner = {
        id: ownerIdBytesToOwnerId(
            getOrThrow(OwnerIdBytes.from(createSlip21(secret, ['OwnerIdBytes']).slice(0, 16))),
        ),
        encryptionKey: getOrThrow(
            OwnerEncryptionKey.from(createSlip21(secret, ['OwnerEncryptionKey'])),
        ),
        writeKey: getOrThrow(
            OwnerWriteKey.from(createSlip21(secret, ['OwnerWriteKey']).slice(0, 16)),
        ),
    };

    return { type: 'AppOwner', mnemonic: ownerSecretToMnemonic(secret), ...owner };
};

const WardLinkId = id('WardLinkId');
const WardAttestationId = id('WardAttestationId');

/**
 * One row per transition and one cached proof per WM head occurrence. Each body is written whole.
 */
export const WardSchema = {
    wardLink: {
        id: WardLinkId,
        wardId: EvoluString,
        toCounter: NonNegativeInt,
        body: EvoluString,
    },
    wardAttestation: {
        id: WardAttestationId,
        wardId: EvoluString,
        toCounter: NonNegativeInt,
        body: EvoluString,
    },
};

const createQuery = createQueryBuilder(WardSchema);

/** Evolu's platform deps for Node, with the SQLite files under `dataDir` (null: in memory). */
const createNodeRun = (dataDir: string | null) => {
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

export class AppendFailed extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AppendFailed';
    }
}

/**
 * A write that SETTLES, whatever Evolu does. `start` begins it and calls `done` on success; the
 * promise rejects instead if Evolu reports an error while it is pending, or if it has not settled
 * within `timeoutMs`.
 *
 * WHY BOTH. Evolu's db worker reports a failed mutation on its shared error store rather than to the
 * mutation, so a failure means `onComplete` never fires -- and a promise waiting on it alone never
 * settles, holding the wallet's lock and every call behind it. The error store catches the failure
 * Evolu does report; the timeout bounds the one it does not.
 *
 * ANY error while pending rejects, not only "ours": the store does not say which mutation failed,
 * and rejecting a write that in fact landed costs nothing here -- the log is append-only, so it is a
 * row no WM head points at, exactly what a lost race leaves.
 */
export const settled = (
    start: (done: () => void) => void,
    opts: { errors: ErrorStore; timeoutMs: number },
): Promise<void> =>
    new Promise<void>((resolve, reject) => {
        const before = opts.errors.get();
        let finished = false;
        // the two handles to release, set once the write is under way
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
                finish(new AppendFailed(`Evolu reported an error: ${JSON.stringify(error)}`));
            }
        });
        held.timer = setTimeout(
            () => finish(new AppendFailed(`the write did not settle within ${opts.timeoutMs} ms`)),
            opts.timeoutMs,
        );
        try {
            start(() => finish());
        } catch (e) {
            finish(e instanceof Error ? e : new AppendFailed(String(e)));
        }
    });

export interface EvoluBackendOptions {
    wardId: Uint8Array;
    wardOwnerSecret: string;
    /** where the SQLite file lives; null keeps it in memory (tests) */
    dataDir: string | null;
    /** an Evolu relay to replicate through; none keeps the replica local */
    relayUrl?: string;
    /** how long an append may take before it is failed; see `settled` */
    appendTimeoutMs?: number;
}

const DEFAULT_APPEND_TIMEOUT_MS = 30_000;

export class EvoluWardBackend implements WardBackend {
    private readonly pending = new Map<string, { body: string; done: Promise<void> }>();

    private constructor(
        private readonly evolu: Evolu<typeof WardSchema>,
        private readonly wardId: string,
        private readonly query: ReturnType<typeof createQuery>,
        private readonly attestationQuery: ReturnType<typeof createQuery>,
        private readonly unsubscribe: () => void,
        private readonly run: ReturnType<typeof createNodeRun>['run'],
        private readonly errors: ErrorStore,
        private readonly appendTimeoutMs: number,
    ) {}

    static async open(opts: EvoluBackendOptions): Promise<EvoluWardBackend> {
        const owner = wardOwner(toBytes(opts.wardOwnerSecret));
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
        const wardId = toHex(opts.wardId);
        const query = createQuery(db =>
            db.selectFrom('wardLink').selectAll().where('wardId', '=', wardId),
        );
        const attestationQuery = createQuery(db =>
            db.selectFrom('wardAttestation').selectAll().where('wardId', '=', wardId),
        );
        // SUBSCRIBED, so rows another host replicates in are in `getQueryRows` without a reload,
        // and a local append's rows are there by the time its `onComplete` fires.
        const unsubscribeLinks = evolu.subscribeQuery(query)(() => {});
        const unsubscribeAttestations = evolu.subscribeQuery(attestationQuery)(() => {});
        await evolu.loadQuery(query);
        await evolu.loadQuery(attestationQuery);

        return new EvoluWardBackend(
            evolu,
            wardId,
            query,
            attestationQuery,
            () => {
                unsubscribeLinks();
                unsubscribeAttestations();
            },
            run,
            evoluError,
            opts.appendTimeoutMs ?? DEFAULT_APPEND_TIMEOUT_MS,
        );
    }

    load(): Promise<StoredLink[]> {
        return Promise.resolve(
            this.evolu
                .getQueryRows(this.query)
                .filter(row => !row.isDeleted && typeof row.body === 'string')
                .map(row => JSON.parse(row.body as string) as StoredLink),
        );
    }

    append(link: StoredLink): Promise<void> {
        return this.appendRow('wardLink', linkId(link), link.toCounter, JSON.stringify(link));
    }

    loadAttestations(): Promise<StoredAttestation[]> {
        return Promise.resolve(
            this.evolu
                .getQueryRows(this.attestationQuery)
                .filter(row => !row.isDeleted && typeof row.body === 'string')
                .flatMap(row => {
                    try {
                        return [JSON.parse(row.body as string) as StoredAttestation];
                    } catch {
                        return [];
                    }
                }),
        );
    }

    appendAttestation(attestation: StoredAttestation): Promise<void> {
        return this.appendRow(
            'wardAttestation',
            attestationId(attestation),
            attestation.toCounter,
            JSON.stringify(attestation),
        );
    }

    private appendRow(
        table: 'wardLink' | 'wardAttestation',
        rowKey: string,
        toCounter: number,
        body: string,
    ): Promise<void> {
        const rowId =
            table === 'wardLink'
                ? createIdFromString<'WardLinkId'>(rowKey)
                : createIdFromString<'WardAttestationId'>(rowKey);
        const key = `${table}/${rowId}`;
        const previous = this.pending.get(key);
        if (previous?.body === body) return previous.done;

        const write = () => {
            const query = table === 'wardLink' ? this.query : this.attestationQuery;
            // Evolu records a new history entry for every upsert. Compare the whole row so an
            // identical append is free and a changed body can repair a damaged row.
            const held = this.evolu.getQueryRows(query).find(row => row.id === rowId);
            if (held && !held.isDeleted && held.toCounter === toCounter && held.body === body) {
                return Promise.resolve();
            }

            return settled(
                done => {
                    this.evolu.upsert(
                        table,
                        {
                            id: rowId,
                            wardId: this.wardId,
                            toCounter: getOrThrow(NonNegativeInt.from(toCounter)),
                            body,
                            ...(held?.isDeleted ? { isDeleted: 0 as const } : {}),
                        },
                        { onComplete: done },
                    );
                },
                { errors: this.errors, timeoutMs: this.appendTimeoutMs },
            );
        };
        const done = (
            previous ? previous.done.then(write, write) : Promise.resolve().then(write)
        ).finally(() => {
            if (this.pending.get(key)?.done === done) this.pending.delete(key);
        });
        this.pending.set(key, { body, done });

        return done;
    }

    async close(): Promise<void> {
        this.unsubscribe();
        await this.evolu[Symbol.asyncDispose]();
        await this.run[Symbol.asyncDispose]();
    }
}
