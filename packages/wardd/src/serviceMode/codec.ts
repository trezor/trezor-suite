/**
 * The WARD SERVICE INTERFACE's transport: codec v1 over the emulator's UDP port (wire + 7), and the
 * protobuf messages it carries -- by name, decoded into the relay's JSON form.
 *
 * CODEC V1 ONLY. The service interface speaks codec v1 on every build by default, the THP-wallet
 * T3W1 included; THP exists only behind `ward_service_thp`, and a build like that is detected by
 * `probe` and refused by the daemon with that said. A port of trezorlib's
 * `ward_service.WardServiceClientV1` and `service_speaks_codec`.
 */
import { type Socket, createSocket } from 'dgram';

import { protobufManager } from '@trezor/protobuf';
import * as commonProto from '@trezor/protobuf/src/definitions/messages-common_pb';
import * as wardConnectProto from '@trezor/protobuf/src/definitions/messages-ward-connect_pb';
import * as wardServiceProto from '@trezor/protobuf/src/definitions/messages-ward-service_pb';
import * as wardProto from '@trezor/protobuf/src/definitions/messages-ward_pb';
import * as messagesProto from '@trezor/protobuf/src/definitions/messages_pb';
import * as optionsProto from '@trezor/protobuf/src/definitions/options_pb';

/** Where the interface is on the emulator: 21324 + 7 (4 and 5 are BLE's, 6 the Tropic model's). */
export const WARD_PORT_OFFSET = 7;
export const SERVICE_PROTOCOL_VERSION = 1;

const CHUNK = 64;
const PROBE_WIRE_TYPE = 0xfefe;
/** FailureType.InvalidProtocol: how a THP endpoint answers codec framing. */
const INVALID_PROTOCOL = 17;

let loaded = false;
const protos = () => {
    if (!loaded) {
        protobufManager.load([
            wardServiceProto,
            wardConnectProto,
            wardProto,
            commonProto,
            messagesProto,
            optionsProto,
        ] as never);
        loaded = true;
    }

    return protobufManager;
};

/**
 * The relay's form of a decoded message: absent is OMITTED. The decoder materialises an absent
 * submessage as `{}` and an absent scalar as `null`, and a leaf part read with a phantom
 * `plaintext: {}` beside its `encrypted` arm is two arms -- refused, rightly, by the trie code.
 * Empty lists stay (Connect's schemas require them); the top level stays even when empty.
 */
export const normalise = (value: unknown): any => {
    const strip = (v: unknown, nested: boolean): unknown => {
        if (Array.isArray(v)) return v.map(i => strip(i, false)).filter(i => i !== undefined);
        if (v && typeof v === 'object') {
            const entries = Object.entries(v)
                .map(([k, inner]) => [k, strip(inner, true)] as const)
                .filter(([, inner]) => inner !== undefined);

            return entries.length || !nested ? Object.fromEntries(entries) : undefined;
        }

        return v === null ? undefined : v;
    };

    return strip(value, false);
};

export interface ServiceMessage {
    name: string;
    message: Record<string, any>;
}

export const encodeMessage = ({ name, message }: ServiceMessage) => {
    const { messageType, message: bytes } = protos().encode(name, message);

    return { id: Number(messageType), bytes: new Uint8Array(bytes) };
};

export const decodeMessage = (id: number, bytes: Uint8Array): ServiceMessage => {
    const { type, message } = protos().decode(id, bytes);

    return { name: type, message: normalise(message) };
};

/** Codec v1 as 64-byte chunks: `?##` + `>HL` header first, `?` on each following chunk. */
export const chunks = (id: number, payload: Uint8Array): Uint8Array[] => {
    const stream = new Uint8Array(8 + payload.length);
    stream.set([0x23, 0x23, id >> 8, id & 0xff]);
    new DataView(stream.buffer).setUint32(4, payload.length);
    stream.set(payload, 8);
    const out: Uint8Array[] = [];
    for (let i = 0; i < stream.length; i += CHUNK - 1) {
        const chunk = new Uint8Array(CHUNK);
        chunk[0] = 0x3f;
        chunk.set(stream.subarray(i, i + CHUNK - 1), 1);
        out.push(chunk);
    }

    return out;
};

/** Reassembles a message from chunks pushed one at a time. */
export class Reassembly {
    private header: { id: number; length: number } | null = null;
    private buffer: number[] = [];

    push(chunk: Uint8Array): { id: number; payload: Uint8Array } | null {
        if (!this.header) {
            if (chunk.length < 9 || chunk[0] !== 0x3f || chunk[1] !== 0x23 || chunk[2] !== 0x23) {
                return null; // not a first chunk: a stray, ignored as trezorlib's reader does
            }
            const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
            this.header = { id: view.getUint16(3), length: view.getUint32(5) };
            this.buffer.push(...chunk.subarray(9));
        } else {
            if (chunk[0] !== 0x3f) throw new Error('missing chunk magic');
            this.buffer.push(...chunk.subarray(1));
        }
        if (this.buffer.length < this.header.length) return null;
        const done = {
            id: this.header.id,
            payload: Uint8Array.from(this.buffer.slice(0, this.header.length)),
        };
        this.header = null;
        this.buffer = [];

        return done;
    }
}

/** The `code` of a codec-framed `Failure`, parsed by hand (no session is needed to ask). */
export const failureCode = (chunk: Uint8Array): number | null => {
    if (chunk.length < 9 || chunk[0] !== 0x3f || chunk[1] !== 0x23 || chunk[2] !== 0x23)
        return null;
    const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
    if (view.getUint16(3) !== 3 /* Failure */) return null;
    const length = view.getUint32(5);
    const payload = chunk.subarray(9, 9 + length);
    if (!payload.length || payload[0] !== 0x08) return null;
    let code = 0;
    for (let i = 1; i < payload.length; i++) {
        code |= (payload[i]! & 0x7f) << (7 * (i - 1));
        if (!(payload[i]! & 0x80)) return code;
    }

    return null;
};

/** One UDP endpoint, chunks in and out; whole messages via `read` / `write`. */
export class UdpCodec {
    private queue: Uint8Array[] = [];
    private waiting: ((chunk: Uint8Array | null) => void) | null = null;
    private reassembly = new Reassembly();
    /** a socket error other than an absent peer, for the daemon to report */
    lastError: Error | null = null;

    private constructor(private readonly socket: Socket) {
        // A CONNECTED UDP SOCKET REPORTS AN ABSENT PEER as an 'error' (ECONNREFUSED, from the
        // ICMP port-unreachable); unhandled, that kills the daemon. For this transport it means
        // "no answer", exactly what a timeout means -- the probe then says it cannot tell, and a
        // device that went away mid-run is simply not heard from until the daemon is stopped.
        socket.on('error', e => {
            if ((e as NodeJS.ErrnoException).code !== 'ECONNREFUSED') this.lastError = e;
        });
        socket.on('message', data => {
            const chunk = new Uint8Array(data);
            if (this.waiting) {
                const resolve = this.waiting;
                this.waiting = null;
                resolve(chunk);
            } else {
                this.queue.push(chunk);
            }
        });
    }

    static open(port: number, host = '127.0.0.1'): Promise<UdpCodec> {
        const socket = createSocket('udp4');

        return new Promise((resolve, reject) => {
            socket.once('error', reject);
            socket.connect(port, host, () => {
                socket.off('error', reject);
                resolve(new UdpCodec(socket));
            });
        });
    }

    private sendChunk(chunk: Uint8Array): Promise<void> {
        return new Promise((resolve, reject) =>
            this.socket.send(chunk, e =>
                // an absent peer is not a send failure here: see the constructor
                e && (e as NodeJS.ErrnoException).code !== 'ECONNREFUSED' ? reject(e) : resolve(),
            ),
        );
    }

    /** The next chunk, or null after `timeoutMs`. */
    readChunk(timeoutMs: number): Promise<Uint8Array | null> {
        const queued = this.queue.shift();
        if (queued) return Promise.resolve(queued);

        return new Promise(resolve => {
            const timer = setTimeout(() => {
                this.waiting = null;
                resolve(null);
            }, timeoutMs);
            this.waiting = chunk => {
                clearTimeout(timer);
                resolve(chunk);
            };
        });
    }

    async write(message: ServiceMessage): Promise<void> {
        const { id, bytes } = encodeMessage(message);
        for (const chunk of chunks(id, bytes)) await this.sendChunk(chunk);
    }

    /** One whole message, or null if nothing (complete) arrived within `timeoutMs`. */
    async read(timeoutMs: number): Promise<ServiceMessage | null> {
        const deadline = Date.now() + timeoutMs;
        for (;;) {
            const chunk = await this.readChunk(Math.max(1, deadline - Date.now()));
            if (!chunk) return null;
            const done = this.reassembly.push(chunk);
            if (done) return decodeMessage(done.id, done.payload);
        }
    }

    /**
     * WHICH TRANSPORT THE ENDPOINT SPEAKS, asked rather than assumed: an unknown wire type in codec
     * framing is refused with `DataError` by a codec endpoint and with `InvalidProtocol` by a THP
     * one. The framing of the reply is not the answer -- both reply with `?##`. Three answers:
     * true (codec), false (THP), null (said nothing readable).
     */
    async probe(attempts = 3): Promise<boolean | null> {
        const report = new Uint8Array(CHUNK);
        report.set([0x3f, 0x23, 0x23, PROBE_WIRE_TYPE >> 8, PROBE_WIRE_TYPE & 0xff, 0, 0, 0, 0]);
        for (let i = 0; i < attempts; i++) {
            await this.sendChunk(report);
            const deadline = Date.now() + 1000;
            while (Date.now() < deadline) {
                const reply = await this.readChunk(Math.max(1, deadline - Date.now()));
                if (!reply) break;
                const code = failureCode(reply);
                if (code !== null) return code !== INVALID_PROTOCOL;
            }
        }

        return null;
    }

    close() {
        this.socket.close();
    }
}
