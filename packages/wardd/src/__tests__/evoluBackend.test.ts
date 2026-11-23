/**
 * The Evolu backend for real (in-memory SQLite): a link round-trips whole, the same link stored
 * twice is one row, and the WARD owner is its own -- not Suite's, and not another wallet's.
 */
import { randomBytes } from '@noble/hashes/utils.js';
import { promises as fs } from 'fs';
import { DatabaseSync } from 'node:sqlite';
import os from 'os';
import path from 'path';

import { toHex } from '@trezor/ward-core';

import { type StoredAttestation, type StoredLink } from '../backend';
import {
    AppendFailed,
    type ErrorStore,
    EvoluWardBackend,
    settled,
    wardOwner,
    wardOwnerSecret,
} from '../evoluBackend';

const link = (toCounter: number): StoredLink => ({
    fromCounter: toCounter - 1,
    fromRoot: null,
    toCounter,
    toRoot: toHex(randomBytes(32)),
    authCommit: toHex(randomBytes(32)),
    operation: 'commit',
    wmSig: toHex(randomBytes(64)),
    changes: [
        {
            entryKey: toHex(randomBytes(32)),
            leaf: { identity: `01${'00'.repeat(28)}bb`, content: `01${'00'.repeat(28)}aa` },
        },
        { entryKey: toHex(randomBytes(32)), leaf: null },
    ],
});

const attestation = (toCounter: number): StoredAttestation => ({
    fromCounter: toCounter - 1,
    fromRoot: null,
    fromHeadNonce: toHex(randomBytes(32)),
    toCounter,
    toRoot: toHex(randomBytes(32)),
    toHeadNonce: toHex(randomBytes(32)),
    timestamp: 1_700_000_000 + toCounter,
    nonce: toHex(randomBytes(32)),
    signature: toHex(randomBytes(64)),
});

describe('EvoluWardBackend', () => {
    it('stores a link whole, once', async () => {
        const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ward-history-'));
        try {
            const backend = await EvoluWardBackend.open({
                wardId: randomBytes(32),
                evoluNode: toHex(randomBytes(64)),
                dataDir,
            });
            try {
                const one = link(1);
                const two = link(2);
                await Promise.all([backend.append(one), backend.append(one)]);
                await backend.append(two);
                await backend.append(one);
                const repaired = { ...one, changes: [] };
                await backend.append(repaired);
                await backend.append(repaired);
                const loaded = await backend.load();
                expect(loaded).toHaveLength(2);
                expect(loaded).toEqual(expect.arrayContaining([repaired, two]));
            } finally {
                await backend.close();
            }
            const files = await fs.readdir(dataDir);
            const file = files.find(name => name.endsWith('.db') || name.endsWith('.sqlite'));
            expect(file).toBeDefined();
            const db = new DatabaseSync(path.join(dataDir, file!), { readOnly: true });
            try {
                const row = db
                    .prepare(
                        `select count(*) as copies from evolu_history
                        where "table" = 'wardLink' and "column" = 'body'`,
                    )
                    .get();
                expect(row).toEqual({ copies: 3 });
            } finally {
                db.close();
            }
        } finally {
            await fs.rm(dataDir, { recursive: true, force: true });
        }
    });

    it('keeps a WM attestation whole, once, apart from the links', async () => {
        const backend = await EvoluWardBackend.open({
            wardId: randomBytes(32),
            evoluNode: toHex(randomBytes(64)),
            dataDir: null,
        });
        try {
            const one = attestation(1);
            await backend.appendAttestation(one);
            await backend.appendAttestation(one);
            const revisited = { ...one, toHeadNonce: toHex(randomBytes(32)) };
            await backend.appendAttestation(revisited);
            await backend.append(link(1));
            expect(await backend.loadAttestations()).toHaveLength(2);
            expect(await backend.loadAttestations()).toEqual(
                expect.arrayContaining([one, revisited]),
            );
            expect(await backend.load()).toHaveLength(1);
        } finally {
            await backend.close();
        }
    });

    it("derives the WARD owner as a child of the wallet's Evolu node", () => {
        const node = randomBytes(64);
        const secret = wardOwnerSecret(toHex(node));
        expect(secret).toHaveLength(32);
        // not Suite's owner secret (the node's first half), and stable
        expect(toHex(secret)).not.toBe(toHex(node.slice(0, 32)));
        expect(wardOwnerSecret(toHex(node))).toEqual(secret);
        expect(wardOwner(secret).id).not.toBe(wardOwner(node.slice(0, 32)).id);
        expect(() => wardOwnerSecret(toHex(randomBytes(32)))).toThrow('64-byte');
    });
});

/** A stand-in for Evolu's shared error store. */
const errorStore = () => {
    let value: unknown = null;
    const listeners = new Set<() => void>();
    const store: ErrorStore & { set(v: unknown): void; listeners: number } = {
        get: () => value,
        subscribe: listener => {
            listeners.add(listener);

            return () => listeners.delete(listener);
        },
        set: v => {
            value = v;
            listeners.forEach(l => l());
        },
        get listeners() {
            return listeners.size;
        },
    };

    return store;
};

describe('settled: an append that always settles', () => {
    it('resolves when the write completes, and stops listening', async () => {
        const errors = errorStore();
        await expect(
            settled(done => setTimeout(done, 5), { errors, timeoutMs: 1000 }),
        ).resolves.toBe(undefined);
        expect(errors.listeners).toBe(0);
    });

    it('rejects when Evolu reports an error while the write is pending', async () => {
        const errors = errorStore();
        const pending = settled(() => {}, { errors, timeoutMs: 1000 });
        errors.set({ type: 'SqliteError' });
        await expect(pending).rejects.toBeInstanceOf(AppendFailed);
        expect(errors.listeners).toBe(0);
    });

    it('ignores an error that was already there before the write began', async () => {
        const errors = errorStore();
        errors.set({ type: 'Old' });
        const pending = settled(done => setTimeout(done, 5), { errors, timeoutMs: 1000 });
        errors.set(errors.get()); // the same error, re-announced
        await expect(pending).resolves.toBe(undefined);
    });

    it('rejects a write that never settles, after the timeout', async () => {
        await expect(settled(() => {}, { errors: errorStore(), timeoutMs: 20 })).rejects.toThrow(
            'did not settle within 20 ms',
        );
    });

    it('rejects when starting the write throws, and a late completion changes nothing', async () => {
        await expect(
            settled(
                () => {
                    throw new Error('boom');
                },
                { errors: errorStore(), timeoutMs: 1000 },
            ),
        ).rejects.toThrow('boom');
        let late: () => void = () => {};
        const pending = settled(done => (late = done), { errors: errorStore(), timeoutMs: 10 });
        await expect(pending).rejects.toBeInstanceOf(AppendFailed);
        expect(() => late()).not.toThrow();
    });
});

describe('EvoluWardBackend.append when Evolu never completes', () => {
    it('rejects instead of hanging', async () => {
        const backend = await EvoluWardBackend.open({
            wardId: randomBytes(32),
            evoluNode: toHex(randomBytes(64)),
            dataDir: null,
            appendTimeoutMs: 50,
        });
        try {
            // a mutation whose onComplete never fires -- what a failed transaction looks like
            (backend as unknown as { evolu: { upsert: () => unknown } }).evolu.upsert = () => ({});
            await expect(backend.append(link(1))).rejects.toBeInstanceOf(AppendFailed);
        } finally {
            await backend.close();
        }
    });
});
