/**
 * WARD records on Suite Sync: a relay that admits only funded owners, the Quota Manager that funds
 * them, two hosts of one wallet. The owner starts unregistered, is funded from the device's quota,
 * fills its storage, is funded again, and every record reaches the other host in the end -- while
 * every local write succeeds throughout.
 */
import { type CreateSqliteDriver, createConsole } from '@evolu/common';
import { createBetterSqliteDriver, createRelayDeps, createRun, startRelay } from '@evolu/nodejs';
import { p256 } from '@noble/curves/nist.js';
import { bytesToHex, randomBytes } from '@noble/hashes/utils.js';
import { createServer } from 'net';

import {
    QuotaManagerError,
    allocateOwnerStorage,
    delegatedPublicKey,
    ensureOwnerStorage,
    toHex,
} from '@trezor/ward-core';

import { type StoredLink } from '../backend';
import { EvoluWardBackend } from '../evoluBackend';
import { type ReplicationStatus } from '../replication';
import { DevQuotaManager } from '../suiteSyncDev';

jest.setTimeout(60_000);

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const freePort = () =>
    new Promise<number>((resolve, reject) => {
        const server = createServer();
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            server.close(() => resolve(typeof address === 'object' && address ? address.port : 0));
        });
    });

const link = (toCounter: number, padding = 0): StoredLink => ({
    fromCounter: toCounter - 1,
    fromRoot: null,
    toCounter,
    toRoot: toHex(randomBytes(32)),
    authCommit: toHex(randomBytes(32)) + 'ab'.repeat(padding),
    operation: 'commit',
    wmSig: toHex(randomBytes(64)),
    changes: [],
});

/** Poll until `done` holds, or fail with the last value. */
const until = async <T>(read: () => Promise<T>, done: (value: T) => boolean, ms = 20_000) => {
    const end = Date.now() + ms;
    let value = await read();
    while (!done(value)) {
        if (Date.now() > end) throw new Error(`gave up waiting; last: ${JSON.stringify(value)}`);
        await wait(250);
        value = await read();
    }

    return value;
};

const replicated = (status: ReplicationStatus) =>
    status.state === 'replicating' && status.waiting === 0;

describe('WARD storage on Suite Sync', () => {
    const memory: CreateSqliteDriver = name => createBetterSqliteDriver(name, { mode: 'memory' });
    const delegatedKey = bytesToHex(p256.utils.randomSecretKey());
    const wardId = randomBytes(32);
    const wardOwnerSecret = toHex(randomBytes(32));
    let qm: DevQuotaManager;
    let quotaManagerUrl: string;
    let relayUrl: string;
    const stops: (() => Promise<void>)[] = [];

    const startSuiteSync = async (port: number) => {
        // silent: the relay logs each refusal it sends as an error, and refusals are the point here
        const run = createRun({
            ...createRelayDeps(),
            console: createConsole({ level: 'silent' }),
            createSqliteDriver: memory,
        });
        const relay = await run.orThrow(
            startRelay({
                port,
                isOwnerAllowed: qm.isOwnerAllowed,
                isOwnerWithinQuota: qm.isOwnerWithinQuota,
            }),
        );

        return async () => {
            await relay[Symbol.asyncDispose]();
            await run[Symbol.asyncDispose]();
        };
    };

    const open = async () => {
        const backend = await EvoluWardBackend.open({
            wardId,
            wardOwnerSecret,
            dataDir: null,
            relayUrl,
            quotaManagerUrl,
            appendTimeoutMs: 5_000,
        });
        stops.push(() => backend.close());

        return backend;
    };

    beforeAll(async () => {
        qm = await DevQuotaManager.create();
        const served = await qm.listen(0);
        stops.push(served.close);
        quotaManagerUrl = `http://127.0.0.1:${served.port}/`;
        const port = await freePort();
        relayUrl = `http://127.0.0.1:${port}/evolu/`;
        stops.push(await startSuiteSync(port));
        await qm.grant(delegatedPublicKey(delegatedKey), 1024 * 1024);
    });

    afterAll(async () => {
        for (const stop of stops.reverse()) await stop().catch(() => {});
    });

    it('stores, funds, fills, funds again, and every record arrives', async () => {
        const a = await open();

        // An unregistered owner: the write is stored, the relay does not take it.
        await a.append(link(1));
        const unregistered = await until(
            () => a.replication(),
            s => s.reason === 'no_registration',
        );
        expect(unregistered).toMatchObject({ state: 'not_replicating', waiting: 1 });
        expect(unregistered.needBytes).toBeGreaterThan(0);

        // Funded from the device's quota: the relay admits the owner and takes the record.
        const first = await ensureOwnerStorage({
            quotaManagerUrl,
            delegatedKey,
            ownerId: unregistered.ownerId,
            needBytes: unregistered.needBytes,
        });
        expect(first.kind).toBe('allocated');
        await until(() => a.replication(), replicated);

        const b = await open();
        await until(
            () => b.load(),
            links => links.length === 1,
        );

        // Storage used up: writes still succeed here, and wait.
        const { storedBytes } = await a.replication();
        await qm.setOwnerLimit(unregistered.ownerId, storedBytes + 2_000);
        for (let n = 2; n <= 5; n += 1) await a.append(link(n, 1_000));
        const full = await until(
            () => a.replication(),
            s => s.reason === 'quota_full',
        );
        expect(full.waiting).toBeGreaterThan(0);
        expect(full.needBytes).toBeGreaterThan(0);
        expect((await b.load()).length).toBeLessThan(5);

        // Funded again: wardd sees the larger limit, resynchronizes, and nothing waits.
        await ensureOwnerStorage({
            quotaManagerUrl,
            delegatedKey,
            ownerId: full.ownerId,
            needBytes: full.needBytes,
        });
        await until(() => a.replication(), replicated);
        await until(
            () => b.load(),
            links => links.length === 5,
        );
    });

    it('refuses an allocation the device cannot fund, and loses nothing', async () => {
        const poor = bytesToHex(p256.utils.randomSecretKey());
        await expect(
            allocateOwnerStorage({ quotaManagerUrl, delegatedKey: poor, ownerId: 'x', size: 1 }),
        ).rejects.toMatchObject({ kind: 'no_device_quota' });
        await expect(
            ensureOwnerStorage({ quotaManagerUrl, delegatedKey: poor, ownerId: 'x', needBytes: 1 }),
        ).rejects.toBeInstanceOf(QuotaManagerError);
    });
});

describe('DevQuotaManager', () => {
    const delegatedKey = bytesToHex(p256.utils.randomSecretKey());

    const served = async () => {
        const qm = await DevQuotaManager.create();
        const server = await qm.listen(0);
        await qm.grant(delegatedPublicKey(delegatedKey), 10_000);

        return { qm, server, quotaManagerUrl: `http://127.0.0.1:${server.port}/` };
    };

    it('refuses a proof from another key', async () => {
        const { qm, server, quotaManagerUrl } = await served();
        try {
            const { challenge } = (await qm.handle('/challenge', { sessionId: 's' })).body;
            const reply = await qm.handle('/storage/add', {
                publicKey: delegatedPublicKey(delegatedKey),
                ownerId: 'o',
                size: 100,
                challenge,
                sessionId: 's',
                proof: bytesToHex(p256.sign(new Uint8Array(1), p256.utils.randomSecretKey())),
            });
            expect(reply.body).toEqual({ error: 'ProofValidationFailed' });
            // the client's own signature passes
            await expect(
                allocateOwnerStorage({ quotaManagerUrl, delegatedKey, ownerId: 'o', size: 100 }),
            ).resolves.toMatchObject({ ownerTotalSpace: 100, deviceUnspentSpace: 9_900 });
        } finally {
            await server.close();
        }
    });

    it('takes a challenge once', async () => {
        const { qm, server } = await served();
        try {
            await qm.handle('/challenge', { sessionId: 's' });
            const reused = await qm.handle('/storage/add', {
                publicKey: delegatedPublicKey(delegatedKey),
                ownerId: 'o',
                size: 1,
                challenge: 'wrong',
                sessionId: 's',
                proof: '00',
            });
            expect(reused.body).toEqual({ error: 'ChallengeValidationFailed' });
            expect(qm.isOwnerAllowed('o')).toBe(false);
        } finally {
            await server.close();
        }
    });

    it('admits an owner only within its limit', async () => {
        const qm = await DevQuotaManager.create();
        expect(qm.isOwnerAllowed('o')).toBe(false);
        await qm.setOwnerLimit('o', 100);
        expect(qm.isOwnerAllowed('o')).toBe(true);
        expect(qm.isOwnerWithinQuota('o', 100)).toBe(true);
        expect(qm.isOwnerWithinQuota('o', 101)).toBe(false);
    });
});
