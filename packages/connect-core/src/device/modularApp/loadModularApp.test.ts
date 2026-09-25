import { createHash } from 'crypto';

import { computeChunks, parseAppImage } from './appImage';
import { loadModularApp } from './loadModularApp';
import type { ModularAppDefinition } from './types';

const HEADER_SIZE = 512;
const CHUNK_SIZE = 8;

// Builds a valid app image, deriving the header chunk hash with the same reverse hash chain the
// device verifies (the chunk-hash region starts zeroed).
const buildBinary = (payload: Buffer) => {
    const header = Buffer.alloc(HEADER_SIZE);
    header.write('TRZA', 0, 'ascii');
    header.writeUInt32LE(HEADER_SIZE, 4);
    header.write('test.app', 8, 'utf-8');
    header.writeUInt8(1, 108);
    header.writeUInt16LE(CHUNK_SIZE, 160);

    const chunks: Buffer[] = [];
    for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
        chunks.push(payload.subarray(i, i + CHUNK_SIZE));
    }
    let hash: Buffer = Buffer.alloc(32);
    for (let i = chunks.length - 1; i >= 0; i--) {
        hash = createHash('sha256')
            .update(Buffer.concat([hash, chunks[i] as Buffer]))
            .digest();
    }
    hash.copy(header, 128);

    return Buffer.concat([header, payload]);
};

const rootPacket = () => {
    const rp = Buffer.alloc(64);
    rp.write('TRRP', 0, 'ascii');
    rp.writeUInt32LE(1_700_000_000, 8);

    return rp;
};

const makeApp = (binary: Buffer): ModularAppDefinition => ({
    id: 'test.app',
    binary,
    proof: Buffer.from('deadbeef', 'hex'),
    rootPacket: rootPacket(),
    messageIds: {},
});

describe('modularApp/loadModularApp', () => {
    const payload = Buffer.from(Array.from({ length: 20 }, (_, i) => i + 1)); // -> 3 chunks

    it('returns the instance id on a cache hit without uploading', async () => {
        const typedCall = jest.fn().mockResolvedValue({
            type: 'ExtAppLoaded',
            message: { instance_id: 5 },
        });

        const instanceId = await loadModularApp({
            typedCall: typedCall as never,
            appDef: makeApp(buildBinary(payload)),
        });

        expect(instanceId).toBe(5);
        expect(typedCall).toHaveBeenCalledTimes(1);
        expect(typedCall.mock.calls[0][0]).toBe('ExtAppLoad');
        // No force reload -> empty fingerprint.
        expect(typedCall.mock.calls[0][2].fingerprint).toBe('');
    });

    it('drives header, root packet and chunk upload to completion', async () => {
        const binary = buildBinary(payload);
        const image = parseAppImage(binary);
        const chunks = computeChunks(image.payload, image.chunkSize, image.chunkHash);

        const sentChunks: { data: string; hash: string }[] = [];
        const typedCall = jest.fn((type: string, _expected: unknown, msg: any) => {
            switch (type) {
                case 'ExtAppLoad':
                    return { type: 'ExtAppHeaderRequest', message: {} };
                case 'ExtAppHeaderAck':
                    return {
                        type: 'ExtAppRootPacketRequest',
                        message: { app_ring: 1, host_timestamp_stale: false },
                    };
                case 'ExtAppRootPacketAck':
                    return { type: 'ExtAppDataChunkRequest', message: { index: 0 } };
                case 'ExtAppDataChunkAck': {
                    sentChunks.push({ data: msg.data, hash: msg.hash });
                    const next = sentChunks.length;

                    return next < chunks.length
                        ? { type: 'ExtAppDataChunkRequest', message: { index: next } }
                        : { type: 'ExtAppLoaded', message: { instance_id: 9 } };
                }
                default:
                    throw new Error(`unexpected call ${type}`);
            }
        });

        const instanceId = await loadModularApp({
            typedCall: typedCall as never,
            appDef: makeApp(binary),
        });

        expect(instanceId).toBe(9);
        // Header ack carried the header bytes, proof and root packet timestamp.
        const headerAck = typedCall.mock.calls.find(c => c[0] === 'ExtAppHeaderAck')?.[2];
        expect(headerAck.header).toBe(image.headerBytes.toString('hex'));
        expect(headerAck.proof).toBe('deadbeef');
        expect(headerAck.root_packet_timestamp).toBe(1_700_000_000);
        // All chunks were sent in order with the expected hash chain.
        expect(sentChunks).toEqual(
            chunks.map(c => ({ data: c.data.toString('hex'), hash: c.hash.toString('hex') })),
        );
    });

    it('sends the header fingerprint when force reloading', async () => {
        const typedCall = jest.fn().mockResolvedValue({
            type: 'ExtAppLoaded',
            message: { instance_id: 1 },
        });

        await loadModularApp({
            typedCall: typedCall as never,
            appDef: makeApp(buildBinary(payload)),
            forceReload: true,
        });

        expect(typedCall.mock.calls[0][2].fingerprint).toMatch(/^[0-9a-f]{64}$/);
    });
});
