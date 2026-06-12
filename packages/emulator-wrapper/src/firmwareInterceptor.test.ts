import * as fs from 'node:fs';
import * as path from 'node:path';

import { createChunks } from '@trezor/transport-common';

import { FirmwareInterceptor, assertFixtureMatchesBinary } from './firmwareInterceptor';
import { reconstructBinaryFromFixture } from './fixtureBinary';
import { FrameReassembler } from './frameReassembler';
import type { RecordedFrameEvent, RecordedMarkerEvent, RecordingFixture } from './recordedFrame';

const CHUNK_HEADER = Buffer.from([0x3f]);
const CHUNK_SIZE = 64;
const PING = Buffer.from('PINGPING');

const loadFixture = (): RecordingFixture => {
    const fixturePath = path.resolve(
        __dirname,
        '../fixtures/firmware-update-T2T1-trezor-t2t1-2.9.1.json',
    );

    return JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as RecordingFixture;
};

const chunkifyFrame = (hex: string): Buffer[] => {
    const wholeFrame = Buffer.from(hex, 'hex');

    return createChunks(wholeFrame, CHUNK_HEADER, CHUNK_SIZE).map(c => Buffer.from(c));
};

const collectReplyFrames = (chunks: Buffer[]): RecordedFrameEvent[] => {
    const reassembler = new FrameReassembler('in');
    const frames: RecordedFrameEvent[] = [];
    for (const chunk of chunks) {
        const frame = reassembler.addChunk(chunk, Date.now());
        if (frame) frames.push(frame);
    }

    return frames;
};

describe('FirmwareInterceptor', () => {
    let fixture: RecordingFixture;

    beforeAll(() => {
        fixture = loadFixture();
    });

    it('loads fixture with expected event counts', () => {
        expect(fixture.events.length).toBeGreaterThan(0);
        expect(fixture.meta.model).toBe('T2T1');
        expect(fixture.meta.protocol).toBe('v1');
    });

    it('replays full T2T1 firmware update flow when client sends out events in order', () => {
        const interceptor = new FirmwareInterceptor({ fixture });
        const collectedReplies: Buffer[] = [];
        const expectedInFrames = fixture.events.filter(
            (e): e is RecordedFrameEvent => e.kind === 'frame' && e.dir === 'in',
        );

        for (const event of fixture.events) {
            if (event.kind !== 'frame' || event.dir !== 'out') continue;
            const chunks = chunkifyFrame(event.hex);
            for (const chunk of chunks) {
                const result = interceptor.handleClientChunk(chunk, Date.now());
                expect(result.handled).toBe(true);
                if (result.handled) {
                    collectedReplies.push(...result.replyChunks);
                }
            }
        }

        const replyFrames = collectReplyFrames(collectedReplies);
        expect(replyFrames).toHaveLength(expectedInFrames.length);
        for (let i = 0; i < replyFrames.length; i += 1) {
            expect(replyFrames[i]!.messageType).toBe(expectedInFrames[i]!.messageType);
            expect(replyFrames[i]!.hex).toBe(expectedInFrames[i]!.hex);
        }
        expect(interceptor.isExhausted()).toBe(true);
    });

    it('drops PING frames during simulated disconnect window', () => {
        const interceptor = new FirmwareInterceptor({ fixture });

        const replayUntilFirstDisconnect = () => {
            for (const event of fixture.events) {
                if (event.kind === 'marker' && event.type === 'device-disconnect') return;
                if (event.kind !== 'frame' || event.dir !== 'out') continue;
                for (const chunk of chunkifyFrame(event.hex)) {
                    interceptor.handleClientChunk(chunk, Date.now());
                }
            }
        };
        replayUntilFirstDisconnect();

        expect(interceptor.isDroppingPings).toBe(true);
        const pingResult = interceptor.handleClientChunk(PING, Date.now());
        expect(pingResult).toEqual({ handled: true, replyChunks: [] });

        const disconnect = fixture.events.find(
            (e): e is RecordedMarkerEvent => e.kind === 'marker' && e.type === 'device-disconnect',
        )!;
        const reconnect = fixture.events.find(
            (e): e is RecordedMarkerEvent => e.kind === 'marker' && e.type === 'device-reconnect',
        )!;
        const futureMs = Date.now() + (reconnect.ts - disconnect.ts) + 100;
        const pingAfter = interceptor.handleClientChunk(PING, futureMs);
        expect(pingAfter.handled).toBe(false);
        expect(interceptor.isDroppingPings).toBe(false);
    });

    it('passes PING through when not in drop window', () => {
        const interceptor = new FirmwareInterceptor({ fixture });
        const result = interceptor.handleClientChunk(PING, Date.now());
        expect(result.handled).toBe(false);
    });

    it('passes unknown messageType through with WARN', () => {
        const interceptor = new FirmwareInterceptor({ fixture });
        const warnings: string[] = [];
        const withLogger = new FirmwareInterceptor({
            fixture,
            logger: msg => {
                warnings.push(msg);
            },
        });

        const fakeFrame = Buffer.concat([
            Buffer.from([0x3f, 0x23, 0x23]),
            Buffer.from([0xff, 0xff]),
            Buffer.from([0, 0, 0, 0]),
        ]);
        const chunk = Buffer.alloc(CHUNK_SIZE);
        fakeFrame.copy(chunk);

        const result = withLogger.handleClientChunk(chunk, Date.now());
        expect(result.handled).toBe(false);
        expect(warnings.some(w => w.includes('WARN'))).toBe(true);
        expect(interceptor).toBeDefined();
    });

    it('reconstructBinaryFromFixture rebuilds the exact binary the fixture was recorded against', () => {
        const binary = reconstructBinaryFromFixture(fixture);
        expect(binary.byteLength).toBe(fixture.meta.firmwareSize);
        // round-trips through the sha256 guard
        expect(() => assertFixtureMatchesBinary(fixture, binary)).not.toThrow();
        // T2T1 firmware starts with the TRZV vendor header
        expect(binary.subarray(0, 4).toString('utf8')).toBe('TRZV');
    });

    it('assertFixtureMatchesBinary throws on mismatched binary', () => {
        const wrongBinary = Buffer.from('not the recorded firmware');
        expect(() => assertFixtureMatchesBinary(fixture, wrongBinary)).toThrow(
            /Firmware binary does not match fixture/,
        );
    });

    it('assertFixtureMatchesBinary accepts matching binary across Buffer/ArrayBuffer/Uint8Array', () => {
        const matchingFixture: RecordingFixture = {
            meta: {
                ...fixture.meta,
                firmwareSha256: '6dd05fbb3bc35e1bd1c8c2e3e0fa6e7d8d65c6a2e9b9f1a3d8e5c0b7d3f1a2b3',
                firmwareSize: 5,
            },
            events: [],
        };
        const buf = Buffer.from('hello');
        const crypto = require('node:crypto');
        const realHash = crypto.createHash('sha256').update(buf).digest('hex');
        matchingFixture.meta.firmwareSha256 = realHash;

        expect(() => assertFixtureMatchesBinary(matchingFixture, buf)).not.toThrow();
        expect(() =>
            assertFixtureMatchesBinary(
                matchingFixture,
                buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
            ),
        ).not.toThrow();
        expect(() =>
            assertFixtureMatchesBinary(matchingFixture, new Uint8Array(buf)),
        ).not.toThrow();
    });

    it('passes through after cursor exhausted', () => {
        const interceptor = new FirmwareInterceptor({ fixture });
        for (const event of fixture.events) {
            if (event.kind !== 'frame' || event.dir !== 'out') continue;
            for (const chunk of chunkifyFrame(event.hex)) {
                interceptor.handleClientChunk(chunk, Date.now());
            }
        }
        expect(interceptor.isExhausted()).toBe(true);

        const extraFrame = chunkifyFrame(
            fixture.events.find(
                (e): e is RecordedFrameEvent => e.kind === 'frame' && e.dir === 'out',
            )!.hex,
        );
        const result = interceptor.handleClientChunk(extraFrame[0]!, Date.now());
        expect(result.handled).toBe(false);
    });
});
