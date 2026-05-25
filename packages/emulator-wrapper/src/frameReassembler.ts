import type { Direction, RecordedFrameEvent } from './recordedFrame';

const MAGIC = 0x3f;
const SHARP = 0x23;
const HEADER_SIZE = 9;

interface ReassemblerState {
    expectedPayloadLength: number;
    collectedPayloadLength: number;
    headerBytes: Buffer;
    payloadChunks: Buffer[];
    messageType: number;
    firstChunkTs: number;
}

const resolveMessageName = (messageType: number, lookup?: (id: number) => string | undefined) => {
    if (!lookup) {
        return `Unknown_${messageType}`;
    }
    try {
        return lookup(messageType) ?? `Unknown_${messageType}`;
    } catch {
        return `Unknown_${messageType}`;
    }
};

export class FrameReassembler {
    private state: ReassemblerState | null = null;

    constructor(
        private readonly direction: Direction,
        private readonly lookupMessageName?: (id: number) => string | undefined,
    ) {}

    addChunk(chunk: Buffer, ts: number): RecordedFrameEvent | null {
        if (this.state === null) {
            return this.startNewFrame(chunk, ts);
        }

        return this.appendContinuationChunk(chunk);
    }

    reset() {
        this.state = null;
    }

    private startNewFrame(chunk: Buffer, ts: number): RecordedFrameEvent | null {
        if (chunk.length < HEADER_SIZE) {
            return null;
        }
        if (chunk[0] !== MAGIC || chunk[1] !== SHARP || chunk[2] !== SHARP) {
            return null;
        }

        const messageType = chunk.readUInt16BE(3);
        const length = chunk.readUInt32BE(5);
        const headerBytes = Buffer.from(chunk.subarray(0, HEADER_SIZE));
        const initialPayload = Buffer.from(
            chunk.subarray(HEADER_SIZE, HEADER_SIZE + Math.min(length, chunk.length - HEADER_SIZE)),
        );

        this.state = {
            expectedPayloadLength: length,
            collectedPayloadLength: initialPayload.length,
            headerBytes,
            payloadChunks: [initialPayload],
            messageType,
            firstChunkTs: ts,
        };

        return this.maybeEmit();
    }

    private appendContinuationChunk(chunk: Buffer): RecordedFrameEvent | null {
        if (!this.state) {
            return null;
        }
        if (chunk.length === 0 || chunk[0] !== MAGIC) {
            return null;
        }
        const remaining = this.state.expectedPayloadLength - this.state.collectedPayloadLength;
        const payloadSlice = Buffer.from(
            chunk.subarray(1, 1 + Math.min(remaining, chunk.length - 1)),
        );
        this.state.payloadChunks.push(payloadSlice);
        this.state.collectedPayloadLength += payloadSlice.length;

        return this.maybeEmit();
    }

    private maybeEmit(): RecordedFrameEvent | null {
        if (!this.state) {
            return null;
        }
        if (this.state.collectedPayloadLength < this.state.expectedPayloadLength) {
            return null;
        }
        const wholeFrame = Buffer.concat([this.state.headerBytes, ...this.state.payloadChunks]);
        const event: RecordedFrameEvent = {
            kind: 'frame',
            ts: this.state.firstChunkTs,
            dir: this.direction,
            messageType: this.state.messageType,
            name: resolveMessageName(this.state.messageType, this.lookupMessageName),
            hex: wholeFrame.toString('hex'),
        };
        this.state = null;

        return event;
    }
}
