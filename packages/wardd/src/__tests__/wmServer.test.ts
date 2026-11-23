/**
 * The WARD Manager as its own process: `HttpWm` against `startWmServer` behaves as the in-process
 * WM does, its state survives a restart, and wardd keeps serving -- and says so -- while it is down.
 */
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { HttpWm, WmConflict, WmUnavailable, toHex } from '@trezor/ward-core';

import { InMemoryWardBackend, type StoredAttestation } from '../backend';
import { RelayFailure, WardHost } from '../host';
import { Wardd } from '../service';
import { startWmServer } from '../wmServer';
import { FakeDevice, newWallet } from './fakeDevice';

const withWm = async (dataDir: string | null = null) => {
    const lines: string[] = [];
    const server = await startWmServer({ port: 0, dataDir, log: line => lines.push(line) });

    return { server, lines, wm: new HttpWm(`http://127.0.0.1:${server.port}`) };
};

const setup = async (wm: HttpWm) => {
    const wardd = await Wardd.create({ dataDir: null, memory: true, wm });
    const a = new FakeDevice(newWallet());
    const host = await wardd.openStore({ wardId: toHex(a.wardId) });

    return { a, host };
};

describe('the WARD Manager over HTTP', () => {
    it('enrols, attests and advances for wardd as the in-process WM does', async () => {
        const { server, wm, lines } = await withWm();
        try {
            const { a, host } = await setup(wm);
            a.enqueue('alice', 'bc1q-alice');
            await expect(host.flush(a.call)).resolves.toMatchObject({ counter: 1, published: 1 });
            expect(a.online).toBe(true);
            expect(await wm.head(a.wardId)).toMatchObject({ counter: 1 });
            expect(await host.status()).toMatchObject({ wmCounter: 1, wmAvailable: true });
            // it logs its decisions, never an entry
            expect(lines.some(l => l.startsWith('[enrol]'))).toBe(true);
            expect(lines.some(l => /\[advance\].*#0 -> #1 accepted/.test(l))).toBe(true);
            expect(lines.join('\n')).not.toContain('alice');
        } finally {
            await server.close();
        }
    });

    it('refuses a stale advance as a conflict', async () => {
        const { server, wm, lines } = await withWm();
        try {
            const { a, host } = await setup(wm);
            a.enqueue('alice', 'v1');
            await host.flush(a.call);
            await expect(
                wm.advance({
                    wardId: a.wardId,
                    fromCounter: 0,
                    fromRoot: null,
                    toCounter: 1,
                    toRoot: null,
                    wmSig: new Uint8Array(64),
                }),
            ).rejects.toEqual(new WmConflict(1));
            expect(lines.some(l => l.includes('CONFLICT'))).toBe(true);
        } finally {
            await server.close();
        }
    });

    it('keeps its heads and retired nonces across a restart', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ward-wm-'));
        try {
            const first = await withWm(dir);
            const { a, host } = await setup(first.wm);
            await host.sync(a.call);
            const nonce = await first.wm.headNonce(a.wardId);
            await first.server.close();

            const second = await withWm(dir);
            try {
                expect(await second.wm.headNonce(a.wardId)).toEqual(nonce);
                expect(second.lines.some(l => l.includes('restored 1 ward'))).toBe(true);
            } finally {
                await second.server.close();
            }
        } finally {
            await fs.rm(dir, { recursive: true, force: true });
        }
    });

    it('rejects malformed requests without touching the state', async () => {
        const { server } = await withWm();
        try {
            const base = `http://127.0.0.1:${server.port}/v1/wards/${'00'.repeat(32)}`;
            const post = (op: string, body: unknown) =>
                fetch(`${base}/${op}`, { method: 'POST', body: JSON.stringify(body) });
            expect((await post('attest', { nonce: 'xx' })).status).toBe(400);
            expect((await post('attest', { nonce: '11'.repeat(32) })).status).toBe(404);
            expect((await post('advance', { fromCounter: -1 })).status).toBe(400);
            expect((await fetch(`${base}/head`)).status).toBe(200);
            expect(server.wm.snapshot().heads).toEqual({});
        } finally {
            await server.close();
        }
    });
});

describe('wardd while the WARD Manager is down', () => {
    it('reports it, fails a sync as wm_unavailable, and still serves its last head', async () => {
        const { server, wm } = await withWm();
        const { a, host } = await setup(wm);
        a.enqueue('alice', 'bc1q-alice');
        await host.flush(a.call);
        const before = await host.status();
        await server.close();

        await expect(wm.head(a.wardId)).rejects.toBeInstanceOf(WmUnavailable);
        expect(await host.status()).toMatchObject({
            counter: before.counter,
            root: before.root,
            wmCounter: null,
            wmAvailable: false,
        });
        await expect(host.sync(a.call)).rejects.toEqual(
            expect.objectContaining({ code: 'wm_unavailable' }),
        );
        await expect(host.sync(a.call)).rejects.toBeInstanceOf(RelayFailure);
        // the replica still answers pulls, from the highest head its rows build
        const { trie } = await host.replica();
        expect(trie.size).toBe(1);
    });

    it('walks a device that never synced up to its head, without the WM', async () => {
        const { server, wm } = await withWm();
        const keys = newWallet();
        const first = new FakeDevice(keys);
        const wardd = await Wardd.create({ dataDir: null, memory: true, wm });
        const host = await wardd.openStore({ wardId: toHex(first.wardId) });
        first.enqueue('alice', 'v1');
        first.enqueue('bob', 'v2');
        await host.flush(first.call);
        await server.close();

        // a second device of the same wallet, never synced, while the WM is down
        const second = new FakeDevice(keys);
        await expect(host.sync(second.call)).rejects.toEqual(
            expect.objectContaining({ code: 'wm_unavailable' }),
        );
        await expect(host.catchUp(second.call)).resolves.toMatchObject({ counter: 2 });
        expect(second.provisional?.counter).toBe(2);
        expect(second.provisional?.timestamp).toEqual(expect.any(Number));
        expect(second.head.counter).toBe(0); // nothing persisted
        expect(second.online).toBe(false);
    });

    /** A replica that keeps the rows but not the WM's attestations from `from` up. */
    class ForgetfulBackend extends InMemoryWardBackend {
        constructor(private readonly from: number) {
            super();
        }

        appendAttestation(attestation: StoredAttestation) {
            return attestation.toCounter >= this.from
                ? Promise.resolve()
                : super.appendAttestation(attestation);
        }
    }

    it('stops at the newest head a kept WM attestation names, below the replica head', async () => {
        const { server, wm } = await withWm();
        const keys = newWallet();
        const first = new FakeDevice(keys);
        // the attestation of #2 never reached this replica: the WM went down after the advance
        const host = new WardHost(first.wardId, new ForgetfulBackend(2), wm);
        first.enqueue('alice', 'v1');
        first.enqueue('bob', 'v2');
        await host.flush(first.call);
        await server.close();

        const second = new FakeDevice(keys);
        await expect(host.catchUp(second.call)).resolves.toMatchObject({
            counter: 1,
            replicaCounter: 2,
        });
        expect(second.provisional?.counter).toBe(1);
        expect(second.head.counter).toBe(0);
    });

    it('with no kept attestation, offers the head bare, which a WM device refuses', async () => {
        const { server, wm } = await withWm();
        const keys = newWallet();
        const first = new FakeDevice(keys);
        const host = new WardHost(first.wardId, new ForgetfulBackend(0), wm);
        first.enqueue('alice', 'v1');
        await host.flush(first.call);
        await server.close();

        const second = new FakeDevice(keys);
        await expect(host.catchUp(second.call)).rejects.toEqual(
            expect.objectContaining({ code: 'device_failure' }),
        );
        expect(second.provisional).toBeNull();
    });

    it('with no kept attestation, moves a device built without a WM, which persists', async () => {
        const { server, wm } = await withWm();
        const keys = newWallet();
        const first = new FakeDevice(keys);
        const host = new WardHost(first.wardId, new ForgetfulBackend(0), wm);
        first.enqueue('alice', 'v1');
        await host.flush(first.call);
        await server.close();

        const mvp = new FakeDevice(keys, { wm: false });
        await expect(host.catchUp(mvp.call)).resolves.toMatchObject({
            counter: 1,
            persisted: true,
            timestamp: null,
        });
        expect(mvp.head.counter).toBe(1);
        expect(mvp.provisional).toBeNull();
    });
});
