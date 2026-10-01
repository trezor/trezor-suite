/**
 * THE CONNECT BINDING END TO END, minus only the transport: Connect's `wardRelay` method and its
 * wardd client, against the real wardd socket and host, with the fake device standing behind
 * `relayCall` where Connect's device session would be.
 *
 * What it pins is the seam itself -- the frames Connect puts on the wire, the device replies it
 * carries back (pulls and Failures included), wardd's error codes surviving into Connect's error.
 */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- the wardd binding is not public API yet: the barrel takes no code exports (#27376)
import WardRelay from '@trezor/connect/src/api/ward/wardRelay';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- the wardd binding is not public API yet: the barrel takes no code exports (#27376)
import { createWarddProvider } from '@trezor/connect/src/ward/createWarddProvider';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- the wardd binding is not public API yet: the barrel takes no code exports (#27376)
import { stripAbsent } from '@trezor/connect/src/ward/warddClient';
import { protobufManager } from '@trezor/protobuf';
import * as commonProto from '@trezor/protobuf/src/definitions/messages-common_pb';
import * as wardConnectProto from '@trezor/protobuf/src/definitions/messages-ward-connect_pb';
import * as wardProto from '@trezor/protobuf/src/definitions/messages-ward_pb';
import * as messagesProto from '@trezor/protobuf/src/definitions/messages_pb';
import * as optionsProto from '@trezor/protobuf/src/definitions/options_pb';
import { toHex } from '@trezor/ward-core';

import { startServer } from '../server';
import { Wardd } from '../service';
import { FakeDevice, newWallet } from './fakeDevice';

const TOKEN = 'connect-test';

protobufManager.load([
    wardConnectProto,
    wardProto,
    commonProto,
    messagesProto,
    optionsProto,
] as never);

/**
 * THROUGH CONNECT'S REAL CODEC, both ways, as the device session does. Going out, Connect must be
 * able to encode what wardd sent, and the device sees the wire -- absent is absent. Coming back,
 * the reply is exactly what Connect's decoder makes of it: absent submessages as `{}`, absent
 * scalars as `null`, absent lists as `[]`. A mock that skipped this hid a real-device failure.
 */
const throughCodec = (name: string, message: Record<string, unknown>) => {
    const { message: wire } = protobufManager.encode(name, message);

    return protobufManager.decode(name, wire).message as Record<string, unknown>;
};

/** A WardRelay method whose device session is the fake device. */
const relay = (device: FakeDevice, url: string, payload: Record<string, unknown>) => {
    const method = new WardRelay({
        id: 1,
        payload: { method: 'wardRelay', token: TOKEN, url, ...payload },
    } as never);
    const relayCall = jest.fn(async (name: string, message: Record<string, unknown>) => {
        const reply = await device.call({
            name,
            message: stripAbsent(throughCodec(name, message)),
        });
        if (reply.name === 'Failure') {
            // as the session does: a device Failure throws a TrezorError
            const { ERRORS } = await import('@trezor/connect-common/src/constants');
            throw new ERRORS.TrezorError('Failure_DataError', String(reply.message.message));
        }

        return { type: reply.name, message: throughCodec(reply.name, reply.message as never) };
    });
    method.getDevice = () => ({ getCommands: () => ({ relayCall }) }) as never;

    return { run: () => method.run(), relayCall };
};

describe('Connect wardRelay against wardd', () => {
    let server: Awaited<ReturnType<typeof startServer>>;
    let url: string;

    beforeEach(async () => {
        const wardd = await Wardd.create({ dataDir: null, memory: true });
        server = await startServer({ wardd, token: TOKEN, port: 0 });
        url = `ws://127.0.0.1:${server.port}`;
    });
    afterEach(() => server.close());

    it('syncs a fresh wallet, asking the device for its ward_id', async () => {
        const device = new FakeDevice();
        const { run, relayCall } = relay(device, url, { op: 'sync' });
        await expect(run()).resolves.toMatchObject({ counter: 0, how: 'reconcile' });
        // WardSync once to name the wallet, then the conversation's own round
        expect(relayCall.mock.calls.map(([name]) => name)).toEqual([
            'WardSync',
            'WardSync',
            'WardIngestAttestation',
            'WardReconcile',
        ]);
        expect(device.online).toBe(true);
    });

    it('flushes a batch in one session, pulls carried back to wardd', async () => {
        const device = new FakeDevice();
        for (const name of ['a', 'b', 'c']) device.enqueue(name, `addr-${name}`);
        const { run, relayCall } = relay(device, url, {
            op: 'flush',
            maxBatch: 8,
            wardId: toHex(device.wardId),
        });
        await expect(run()).resolves.toMatchObject({ counter: 3, published: 1, remaining: 0 });
        expect(relayCall.mock.calls.filter(([name]) => name === 'WardEntryAck')).toHaveLength(3);
        expect(device.queue).toHaveLength(0);
    });

    it('brings a second device up along the chain, then reports both heads', async () => {
        const keys = newWallet();
        const a = new FakeDevice(keys);
        a.enqueue('x', '1');
        a.enqueue('y', '2');
        await relay(a, url, { op: 'flush' }).run();
        const b = new FakeDevice(keys);
        await expect(relay(b, url, { op: 'sync' }).run()).resolves.toMatchObject({
            counter: 2,
            how: 'verifyChain',
        });
        await expect(
            relay(b, url, { op: 'status', wardId: toHex(b.wardId) }).run(),
        ).resolves.toMatchObject({ counter: 2, wmCounter: 2 });
    });

    it("keeps wardd's refusal code in Connect's error", async () => {
        const device = new FakeDevice();
        const other = new FakeDevice();
        // the store opened is another wallet's, so the device's WardSync does not match it
        const { run } = relay(device, url, { op: 'sync', wardId: toHex(other.wardId) });
        await expect(run()).rejects.toThrow('wardd bad_request');
    });

    it('carries a device Failure back to wardd, which ends the call as device_failure', async () => {
        const device = new FakeDevice();
        await relay(device, url, { op: 'sync' }).run();
        const refusing = relay(device, url, { op: 'sync' });
        refusing.relayCall.mockImplementation(async (name: string, message: any) => {
            if (name === 'WardReconcile') {
                const { ERRORS } = await import('@trezor/connect-common/src/constants');
                throw new ERRORS.TrezorError('Failure_DataError', 'refused');
            }
            const reply = await device.call({ name, message });

            return { type: reply.name, message: reply.message };
        });
        await expect(refusing.run()).rejects.toThrow('wardd device_failure: refused');
    });
});

describe('createWarddProvider against wardd', () => {
    it("answers a device's pulls from wardd's replica", async () => {
        const wardd = await Wardd.create({ dataDir: null, memory: true });
        const server = await startServer({ wardd, token: TOKEN, port: 0 });
        const url = `ws://127.0.0.1:${server.port}`;
        const device = new FakeDevice();
        device.enqueue('alice', 'bc1q-alice');
        await relay(device, url, { op: 'flush' }).run();

        const provider = createWarddProvider({ url, token: TOKEN });
        try {
            await provider.openStore({ wardId: toHex(device.wardId) });
            // the device asks for a second change's path; wardd proves its absence from the replica
            device.enqueue('bob', 'bc1q-bob');
            const ack = await provider.serveEntry({ entry_key: toHex(device.queue[0]!.entryKey) });
            expect(ack.proof ?? []).toEqual([]); // empty and absent are one thing on the wire
            expect(ack.witness_entry_key).toBeDefined();
        } finally {
            // a failed assertion must not leave the socket open, or the run never exits
            await provider.dispose?.();
            await server.close();
        }
    });
});
