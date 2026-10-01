/**
 * wardd serving a SERVICE build: the responder against a fake device that checks what the firmware
 * checks, the codec framing, the state file across a restart -- and the whole daemon over real UDP.
 */
import { createSocket } from 'dgram';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { DevWm, type RelayMessage, toHex } from '@trezor/ward-core';

import { WardHost } from '../host';
import { FakeDevice, newWallet } from './fakeDevice';
import {
    Reassembly,
    chunks,
    decodeMessage,
    encodeMessage,
    failureCode,
    normalise,
} from '../serviceMode/codec';
import { runServiceDaemon } from '../serviceMode/daemon';
import { ServiceStateFile } from '../serviceMode/stateFile';

/** What a service build's WARD operation does: sync, fetch the leaf, publish. */
const publishNext = async (device: FakeDevice, host: WardHost) => {
    device.onServiceSyncResponse(
        (await host.serviceSync(device.serviceSyncRequest().message)).message,
    );
    const fetched = await host.serviceFetch(device.serviceFetchRequest().message);
    expect(fetched.name).toBe('WardEntryAck');
    const reply = await host.servicePublish(device.servicePublishRequest(fetched.message).message);
    if (reply.name === 'WardPublishAck') device.onServicePublishAck(reply.message);

    return reply;
};

const fresh = async (stateFile: string | null = null) => {
    const state = await ServiceStateFile.open(stateFile);
    const wm = new DevWm();
    if (state.wm) wm.restore(state.wm);

    return { state, wm };
};

describe('the service responder', () => {
    it('enrols at genesis, then publishes, with the device adopting each attested step', async () => {
        const device = new FakeDevice();
        const { state, wm } = await fresh();
        const host = new WardHost(device.wardId, state, wm);
        device.enqueue('alice', 'bc1q-alice');
        device.enqueue('bob', 'bc1q-bob');
        expect((await publishNext(device, host)).name).toBe('WardPublishAck');
        expect((await publishNext(device, host)).name).toBe('WardPublishAck');
        expect(device.head.counter).toBe(2);
        const { head } = await host.replica();
        expect(head.counter).toBe(2);
        expect(toHex(head.root!)).toBe(toHex(device.head.root));
    });

    it('answers a fetch from a head it does not hold with WardSyncRequired', async () => {
        const device = new FakeDevice();
        const { state, wm } = await fresh();
        const host = new WardHost(device.wardId, state, wm);
        device.enqueue('alice', '1');
        await publishNext(device, host);
        const stale = new FakeDevice(); // at genesis, the replica is at 1
        stale.enqueue('x', 'y');
        expect((await host.serviceFetch(stale.serviceFetchRequest().message)).name).toBe(
            'WardSyncRequired',
        );
    });

    it('refuses a publish built on a head the WM has moved past, as a definitive conflict', async () => {
        const keys = newWallet();
        const a = new FakeDevice(keys);
        const b = new FakeDevice(keys);
        const { state, wm } = await fresh();
        const host = new WardHost(a.wardId, state, wm);
        // both sync at genesis, both fetch; a publishes first
        a.enqueue('a', '1');
        b.enqueue('b', '2');
        a.onServiceSyncResponse((await host.serviceSync(a.serviceSyncRequest().message)).message);
        b.onServiceSyncResponse((await host.serviceSync(b.serviceSyncRequest().message)).message);
        const fa = await host.serviceFetch(a.serviceFetchRequest().message);
        const fb = await host.serviceFetch(b.serviceFetchRequest().message);
        const pb = b.servicePublishRequest(fb.message);
        a.onServicePublishAck(
            (await host.servicePublish(a.servicePublishRequest(fa.message).message)).message,
        );
        const conflict = await host.servicePublish(pb.message);
        expect(conflict).toEqual({ name: 'WardPublishConflict', message: { head_counter: 1 } });
        // nothing of b's landed: the replica is at a's head
        expect(toHex((await host.replica()).head.root!)).toBe(toHex(a.head.root));
        // b syncs and its change goes through on top
        expect((await publishNext(b, host)).name).toBe('WardPublishAck');
        expect(b.head.counter).toBe(2);
    });

    it('resumes from its state file: the same replica, the same WM head nonce', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wardd-service-'));
        const file = path.join(dir, 'state');
        const device = new FakeDevice();
        const first = await fresh(file);
        const host = new WardHost(device.wardId, first.state, first.wm, () =>
            first.state.setWm(first.wm.snapshot()),
        );
        device.enqueue('alice', '1');
        await publishNext(device, host);

        const second = await fresh(file);
        expect(await second.wm.headNonce(device.wardId)).toEqual(
            await first.wm.headNonce(device.wardId),
        );
        const resumed = new WardHost(device.wardId, second.state, second.wm);
        device.enqueue('bob', '2');
        // the device, at 1, syncs against the restarted daemon and publishes 2
        expect((await publishNext(device, resumed)).name).toBe('WardPublishAck');
        expect(device.head.counter).toBe(2);
    });
});

describe('the service codec', () => {
    it('chunks and reassembles a message spanning several packets', () => {
        const payload = Uint8Array.from({ length: 200 }, (_, i) => i);
        const packets = chunks(2307, payload);
        expect(packets.length).toBeGreaterThan(3);
        expect(packets.every(p => p.length === 64 && p[0] === 0x3f)).toBe(true);
        const r = new Reassembly();
        let out = null;
        for (const p of packets) out = r.push(p);
        expect(out).toEqual({ id: 2307, payload });
    });

    it("reads a probe's Failure code, and refuses what is not one", () => {
        const { id, bytes } = encodeMessage({
            name: 'Failure',
            message: { code: 'Failure_DataError' },
        });
        expect(failureCode(chunks(id, bytes)[0]!)).toBe(3);
        const thp = encodeMessage({
            name: 'Failure',
            message: { code: 'Failure_InvalidProtocol' },
        });
        expect(failureCode(chunks(thp.id, thp.bytes)[0]!)).toBe(17);
        expect(failureCode(new Uint8Array(64))).toBeNull();
    });

    it("decodes a sealed publish without the decoder's phantom arms", () => {
        const publish = {
            entry_key: '11'.repeat(32),
            content: {
                encoding: 0,
                encrypted: { nonce: '22'.repeat(12), tag: '33'.repeat(16), ct: '44' },
            },
            counter: 1,
        };
        const { id, bytes } = encodeMessage({ name: 'WardPublish', message: publish });
        expect(decodeMessage(id, bytes)).toEqual({ name: 'WardPublish', message: publish });
        expect(normalise({ a: {}, b: [], c: null })).toEqual({ b: [] });
    });
});

/**
 * THE WHOLE DAEMON over UDP: a fake device endpoint at wire+7 that answers the probe as a codec
 * endpoint, acks WardServiceOpen, then -- device-initiated, as the firmware does -- syncs, fetches
 * and publishes, checking every reply.
 */
describe('wardd --service over UDP', () => {
    it('binds, serves sync / fetch / publish, logs every exchange, and stops', async () => {
        const device = new FakeDevice();
        device.enqueue('alice', 'bc1q-alice');
        const endpoint = createSocket('udp4');
        await new Promise<void>(resolve => endpoint.bind(0, '127.0.0.1', () => resolve()));
        const wardPort = endpoint.address().port;
        let peer: { port: number; address: string } | null = null;
        const inbox: Uint8Array[] = [];
        let notify: (() => void) | null = null;
        endpoint.on('message', (data, rinfo) => {
            peer = rinfo;
            inbox.push(new Uint8Array(data));
            notify?.();
        });
        const nextChunk = async () => {
            while (!inbox.length) await new Promise<void>(resolve => (notify = resolve));

            return inbox.shift()!;
        };
        const send = async (m: RelayMessage) => {
            const { id, bytes } = encodeMessage(m);
            for (const c of chunks(id, bytes)) {
                await new Promise<void>(resolve =>
                    endpoint.send(c, peer!.port, peer!.address, () => resolve()),
                );
            }
        };
        const receive = async () => {
            const r = new Reassembly();
            for (;;) {
                const c = await nextChunk();
                if (c[3] === 0xfe && c[4] === 0xfe) {
                    // the probe: answer as a codec endpoint does, with DataError
                    const f = encodeMessage({
                        name: 'Failure',
                        message: { code: 'Failure_DataError' },
                    });
                    for (const fc of chunks(f.id, f.bytes)) {
                        await new Promise<void>(resolve =>
                            endpoint.send(fc, peer!.port, peer!.address, () => resolve()),
                        );
                    }
                    continue;
                }
                const done = r.push(c);
                if (done) return decodeMessage(done.id, done.payload);
            }
        };

        const lines: string[] = [];
        let stop: () => void = () => {};
        const stopped = new Promise<void>(resolve => (stop = resolve));
        const daemon = runServiceDaemon({
            port: wardPort - 7,
            stateFile: null,
            log: l => lines.push(l),
            stopped,
        });

        expect((await receive()).name).toBe('WardServiceOpen');
        await send({ name: 'WardServiceOpenAck', message: {} });
        await send(device.serviceSyncRequest());
        const sync = await receive();
        expect(sync.name).toBe('WardSyncResponse');
        device.onServiceSyncResponse(sync.message);
        await send(device.serviceFetchRequest());
        const fetched = await receive();
        expect(fetched.name).toBe('WardEntryAck');
        await send(device.servicePublishRequest(fetched.message));
        const ack = await receive();
        expect(ack.name).toBe('WardPublishAck');
        device.onServicePublishAck(ack.message);
        expect(device.head.counter).toBe(1);

        stop();
        await expect(daemon).resolves.toBe(0);
        endpoint.close();
        expect(lines.some(l => l.startsWith('BOUND '))).toBe(true);
        expect(
            lines.filter(l => l.startsWith('SERVED ')).map(l => l.split(' ').slice(1, 5).join(' ')),
        ).toEqual([
            '1 WardSyncRequest -> WardSyncResponse',
            '2 WardServiceFetch -> WardEntryAck',
            '3 WardPublish -> WardPublishAck',
        ]);
        expect(lines).toContain('STOPPED 3');
        expect(lines.find(l => l.includes('WardSyncRequest'))).toMatch(/from counter=0$/);
    });
});
