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
import { hmac } from '@noble/hashes/hmac.js';
import { sha512 } from '@noble/hashes/sha2.js';
import path from 'path';
import { WebSocket } from 'ws';

import { concatBytes, toBytes, toHex } from '@trezor/ward-core';

import { type StoredLink, type WardBackend, linkId } from './backend';

/**
 * The WARD owner secret: the SLIP-21 child `WARD` of the node the device returns for
 * `['TREZOR', 'Evolu']` -- i.e. `['TREZOR', 'Evolu', 'WARD']`. `evoluNode` is that node's 64
 * bytes; a child is HMAC-SHA512 keyed by the parent's first half, and its key is the second half.
 */
export const wardOwnerSecret = (evoluNode: string): Uint8Array => {
    const node = toBytes(evoluNode);
    if (node.length !== 64) throw new Error('evoluNode must be the 64-byte SLIP-21 node');
    const child = hmac(
        sha512,
        node.slice(0, 32),
        concatBytes(Uint8Array.of(0), new TextEncoder().encode('WARD')),
    );

    return child.slice(32, 64);
};

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

/** One row per transition; `body` is the whole `StoredLink`, written once and never updated. */
export const WardSchema = {
    wardLink: {
        id: WardLinkId,
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

    return run;
};

export interface EvoluBackendOptions {
    wardId: Uint8Array;
    evoluNode: string;
    /** where the SQLite file lives; null keeps it in memory (tests) */
    dataDir: string | null;
    /** an Evolu relay to replicate through; none keeps the replica local */
    relayUrl?: string;
}

export class EvoluWardBackend implements WardBackend {
    private constructor(
        private readonly evolu: Evolu<typeof WardSchema>,
        private readonly wardId: string,
        private readonly query: ReturnType<typeof createQuery>,
        private readonly unsubscribe: () => void,
        private readonly run: ReturnType<typeof createNodeRun>,
    ) {}

    static async open(opts: EvoluBackendOptions): Promise<EvoluWardBackend> {
        const owner = wardOwner(wardOwnerSecret(opts.evoluNode));
        const run = createNodeRun(opts.dataDir);
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
        // SUBSCRIBED, so rows another host replicates in are in `getQueryRows` without a reload,
        // and a local append's rows are there by the time its `onComplete` fires.
        const unsubscribe = evolu.subscribeQuery(query)(() => {});
        await evolu.loadQuery(query);

        return new EvoluWardBackend(evolu, wardId, query, unsubscribe, run);
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
        // ONE MUTATION: Evolu applies a microtask's mutations in one SQLite transaction, and this
        // is the only one -- the whole transition, batch included, or nothing.
        return new Promise(resolve => {
            this.evolu.upsert(
                'wardLink',
                {
                    id: createIdFromString(linkId(link)),
                    wardId: this.wardId,
                    toCounter: getOrThrow(NonNegativeInt.from(link.toCounter)),
                    body: JSON.stringify(link),
                },
                { onComplete: resolve },
            );
        });
    }

    async close(): Promise<void> {
        this.unsubscribe();
        await this.evolu[Symbol.asyncDispose]();
        await this.run[Symbol.asyncDispose]();
    }
}
