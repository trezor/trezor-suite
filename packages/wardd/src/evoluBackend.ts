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

import { askOwnerStorage, toBytes, toHex } from '@trezor/ward-core';

import {
    type StoredAttestation,
    type StoredLink,
    type WardBackend,
    attestationId,
    linkId,
} from './backend';
import { RelayLink, type ReplicationStatus } from './replication';

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

/** What the relay connection reports, for `RelayLink`. Set once the backend exists. */
interface RelayEvents {
    opened(): void;
    disconnected(): void;
    answered(): void;
}

/** Evolu's platform deps for Node, with the SQLite files under `dataDir` (null: in memory). */
const createNodeRun = (dataDir: string | null, events: Partial<RelayEvents> = {}) => {
    const consoleStoreOutput = createConsoleStoreOutput();
    const console = createConsole({ output: consoleStoreOutput });
    const lockManager = testCreateLockManager();
    // The relay connection, watched: it is how wardd knows whether records leave this host.
    const nodeCreateWebSocket: CreateWebSocket = (url, options) =>
        createWebSocket(url, {
            ...options,
            onOpen: () => {
                events.opened?.();
                options?.onOpen?.();
            },
            onClose: event => {
                events.disconnected?.();
                options?.onClose?.(event);
            },
            onError: error => {
                events.disconnected?.();
                options?.onError?.(error);
            },
            onMessage: data => {
                events.answered?.();
                options?.onMessage?.(data);
            },
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
    // The main side's console is NOT the workers' one. The shared worker forwards every entry of the
    // workers' console to the main side, which writes it to its own console and logs each error it
    // receives; with one console for both, an error is forwarded back as a new entry, forever. In a
    // browser the two run in separate contexts, each with its own console. Errors reach wardd
    // through `evoluError`, so this one writes to an output nothing reads (forwarded entries are
    // written whatever the console's level).
    const platformDeps: EvoluPlatformDeps = {
        console: createConsole({ output: createConsoleStoreOutput() }),
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

interface ProtocolError {
    type: string;
    ownerId?: string;
}

const asProtocolError = (value: unknown): ProtocolError | null =>
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { type?: unknown }).type === 'string' &&
    (value as { type: string }).type.startsWith('Protocol')
        ? (value as ProtocolError)
        : null;

/**
 * The error the RELAY reported (Evolu's `Protocol*` errors), if `error` is one: about replication,
 * never about the local write. A refused or failed synchronization leaves the record stored here.
 * Evolu's shared worker passes it on as a logged error, so it arrives wrapped in an `UnknownError`
 * whose `error` holds the logged arguments.
 */
export const relayErrorOf = (error: unknown): ProtocolError | null => {
    const direct = asProtocolError(error);
    if (direct) return direct;
    const wrapped = (error as { type?: unknown; error?: unknown } | null)?.error;
    if ((error as { type?: unknown } | null)?.type !== 'UnknownError') return null;
    const args = Array.isArray(wrapped) ? wrapped : [wrapped];

    return args.map(asProtocolError).find(e => e !== null) ?? null;
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
 * A RELAY error does not reject: it concerns replication (`RelayLink`), and the record is stored
 * here whatever the relay does.
 *
 * ANY OTHER error while pending rejects, not only "ours": the store does not say which mutation failed,
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
            if (error && error !== before && !relayErrorOf(error)) {
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
    /** the Quota Manager that funds the owner on that relay, to report why records do not leave */
    quotaManagerUrl?: string;
    /** how long an append may take before it is failed; see `settled` */
    appendTimeoutMs?: number;
}

const DEFAULT_APPEND_TIMEOUT_MS = 30_000;

/**
 * What a row costs on the relay beyond its body: the encrypted CRDT messages of its other columns
 * (id, wardId, toCounter) and their timestamps. Measured against the relay's own count, rounded up.
 */
export const RECORD_OVERHEAD_BYTES = 256;

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
        private readonly relay: RelayLink,
        private readonly stopSync: () => void,
    ) {}

    static async open(opts: EvoluBackendOptions): Promise<EvoluWardBackend> {
        const owner = wardOwner(toBytes(opts.wardOwnerSecret));
        // set once Evolu is open; the link asks for them only after that
        let storedBytes = () => 0;
        let startSync = () => {};
        let resync = () => {};
        const { quotaManagerUrl } = opts;
        const link = new RelayLink({
            ownerId: owner.id,
            hasRelay: !!opts.relayUrl,
            askLimit: quotaManagerUrl
                ? () => askOwnerStorage({ quotaManagerUrl, timeoutMs: 5_000 }, owner.id)
                : undefined,
            start: () => startSync(),
            resync: () => resync(),
            storedBytes: () => storedBytes(),
        });
        const { run, evoluError } = createNodeRun(opts.dataDir, {
            opened: () => link.opened(),
            disconnected: () => link.disconnected(),
            answered: () => link.answered(),
        });
        // No transport here: the owner is synchronized through `useOwner` below, which can be
        // withdrawn and given again -- the one way to have Evolu synchronize everything once more.
        const evolu = getOrThrow(
            await run(
                createEvolu(WardSchema, {
                    appName: AppName.orThrow(`trezor-ward-${owner.id.replaceAll('_', '-')}`),
                    transports: [],
                    appOwner: owner,
                }),
            ),
        );
        const unsubscribeErrors = evoluError.subscribe(() => {
            const error = relayErrorOf(evoluError.get());
            if (error?.type === 'ProtocolQuotaError' && (error.ownerId ?? owner.id) === owner.id) {
                link.refusedForQuota();
            }
        });
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
        storedBytes = () =>
            [...evolu.getQueryRows(query), ...evolu.getQueryRows(attestationQuery)].reduce(
                (sum, row) =>
                    sum +
                    (typeof row.body === 'string' ? row.body.length : 0) +
                    RECORD_OVERHEAD_BYTES,
                0,
            );
        let stopSync = () => {};
        if (opts.relayUrl) {
            const transport = createOwnerWebSocketTransport({
                url: opts.relayUrl,
                ownerId: owner.id,
            });
            startSync = () => {
                stopSync = evolu.useOwner(owner, [transport]);
            };
            resync = () => {
                stopSync();
                stopSync = evolu.useOwner(owner, [transport]);
            };
        }
        link.begin();

        return new EvoluWardBackend(
            evolu,
            wardId,
            query,
            attestationQuery,
            () => {
                unsubscribeLinks();
                unsubscribeAttestations();
                unsubscribeErrors();
            },
            run,
            evoluError,
            opts.appendTimeoutMs ?? DEFAULT_APPEND_TIMEOUT_MS,
            link,
            () => stopSync(),
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
                    // counted before Evolu sends it, so a refusal that follows finds it
                    this.relay.stored(key);
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

    /** Whether the records reach other hosts; see replication.ts. */
    replication(): Promise<ReplicationStatus> {
        return this.relay.status();
    }

    /** Synchronize everything with the relay again, e.g. after the owner got more storage. */
    resync(): void {
        this.relay.resync();
    }

    async close(): Promise<void> {
        this.relay.close();
        this.stopSync();
        this.unsubscribe();
        await this.evolu[Symbol.asyncDispose]();
        await this.run[Symbol.asyncDispose]();
    }
}
