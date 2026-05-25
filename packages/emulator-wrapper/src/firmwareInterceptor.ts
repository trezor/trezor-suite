import { createHash } from 'node:crypto';

import { createChunks } from '@trezor/transport-common';

import { FrameReassembler } from './frameReassembler';
import type {
    RecordedEvent,
    RecordedFrameEvent,
    RecordedMarkerEvent,
    RecordingFixture,
} from './recordedFrame';

/**
 * Throws if `binary` doesn't match the binary that was used while the fixture
 * was recorded. Replay reuses the recorded `FirmwareUpload` payloads verbatim;
 * if the client sends a different binary, the interceptor cursor still advances
 * (it matches by `messageType`, not by payload), but Connect later compares
 * `parseFirmwareHeaders(binary).version` against the `Features` payload from
 * the fixture and fails with an opaque `versionCheck === false` deep into the
 * flow. Failing early here gives a clear, actionable error at test setup time.
 */
const toBuffer = (binary: Buffer | ArrayBuffer | ArrayBufferView): Buffer => {
    if (Buffer.isBuffer(binary)) return binary;
    if (ArrayBuffer.isView(binary)) {
        return Buffer.from(binary.buffer, binary.byteOffset, binary.byteLength);
    }

    return Buffer.from(binary);
};

export const assertFixtureMatchesBinary = (
    fixture: RecordingFixture,
    binary: Buffer | ArrayBuffer | ArrayBufferView,
): void => {
    const buf = toBuffer(binary);
    const actual = createHash('sha256').update(buf).digest('hex');
    if (actual !== fixture.meta.firmwareSha256) {
        throw new Error(
            `Firmware binary does not match fixture: expected sha256=${fixture.meta.firmwareSha256} (${fixture.meta.firmwareSize} B), got sha256=${actual} (${buf.byteLength} B). The fixture was recorded against a specific .bin — replay only works with that exact binary.`,
        );
    }
};

const PROTOCOL_V1_CHUNK_HEADER = Buffer.from([0x3f]);
const CHUNK_SIZE = 64;
const PING = Buffer.from('PINGPING');

export interface FirmwareInterceptorConfig {
    fixture: RecordingFixture;
    logger?: (message: string) => void;
}

export type ClientChunkHandling = { handled: false } | { handled: true; replyChunks: Buffer[] };

export class FirmwareInterceptor {
    private cursor = 0;
    private readonly reassembler = new FrameReassembler('out');
    private pingDropUntil: number | null = null;

    constructor(private readonly config: FirmwareInterceptorConfig) {}

    get events(): RecordedEvent[] {
        return this.config.fixture.events;
    }

    get cursorIndex(): number {
        return this.cursor;
    }

    get isDroppingPings(): boolean {
        return this.pingDropUntil !== null;
    }

    isExhausted(): boolean {
        return this.findNextOutEventIndex() === -1;
    }

    handleClientChunk(chunk: Buffer, now: number = Date.now()): ClientChunkHandling {
        if (this.pingDropUntil !== null && now >= this.pingDropUntil) {
            this.log(`PING drop window expired`);
            this.pingDropUntil = null;
        }

        if (chunk.length >= PING.length && chunk.subarray(0, PING.length).equals(PING)) {
            if (this.pingDropUntil !== null) {
                return { handled: true, replyChunks: [] };
            }

            return { handled: false };
        }

        if (this.isExhausted()) {
            return { handled: false };
        }

        const wholeFrame = this.reassembler.addChunk(chunk, now);
        if (!wholeFrame) {
            return { handled: true, replyChunks: [] };
        }

        const nextOutIdx = this.findNextOutEventIndex();
        if (nextOutIdx === -1) {
            this.log(`cursor exhausted after reassembly; pass-through ${wholeFrame.name}`);

            return { handled: false };
        }

        const expectedEvent = this.events[nextOutIdx] as RecordedFrameEvent;
        if (expectedEvent.messageType !== wholeFrame.messageType) {
            this.log(
                `WARN expected ${expectedEvent.name}(${expectedEvent.messageType}), got ${wholeFrame.name}(${wholeFrame.messageType}); pass-through`,
            );

            return { handled: false };
        }

        this.cursor = nextOutIdx + 1;
        this.log(`matched out ${expectedEvent.name} -> cursor=${this.cursor}`);

        const replyChunks: Buffer[] = [];
        while (this.cursor < this.events.length) {
            const event = this.events[this.cursor];
            if (!event) break;
            if (event.kind === 'frame' && event.dir === 'in') {
                const frameBytes = Buffer.from(event.hex, 'hex');
                const chunks = createChunks(frameBytes, PROTOCOL_V1_CHUNK_HEADER, CHUNK_SIZE);
                for (const c of chunks) replyChunks.push(Buffer.from(c));
                this.log(`emit in ${event.name} as ${chunks.length} chunks`);
                this.cursor += 1;
                continue;
            }
            if (event.kind === 'marker' && event.type === 'device-disconnect') {
                const reconnectIdx = this.findMarkerIndexAfter(this.cursor + 1, 'device-reconnect');
                if (reconnectIdx !== -1) {
                    const reconnect = this.events[reconnectIdx] as RecordedMarkerEvent;
                    const delta = reconnect.ts - event.ts;
                    this.pingDropUntil = now + delta;
                    this.log(`simulated disconnect — PING drop window ${delta}ms`);
                }
                this.cursor += 1;
                break;
            }
            if (event.kind === 'marker' && event.type === 'device-reconnect') {
                this.cursor += 1;
                continue;
            }
            if (event.kind === 'frame' && event.dir === 'out') {
                break;
            }
            this.cursor += 1;
        }

        return { handled: true, replyChunks };
    }

    private findNextOutEventIndex(): number {
        for (let i = this.cursor; i < this.events.length; i += 1) {
            const e = this.events[i];
            if (e?.kind === 'frame' && e.dir === 'out') return i;
        }

        return -1;
    }

    private findMarkerIndexAfter(
        startIdx: number,
        type: 'device-disconnect' | 'device-reconnect',
    ): number {
        for (let i = startIdx; i < this.events.length; i += 1) {
            const e = this.events[i];
            if (e?.kind === 'marker' && e.type === type) return i;
        }

        return -1;
    }

    private log(message: string) {
        this.config.logger?.(`[firmware-interceptor] ${message}`);
    }
}
