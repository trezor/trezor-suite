/**
 * A `WardRelay` over the WebSocket: the same endpoints `Wardd` hands out in-process, reached in a
 * running wardd. One socket per endpoint.
 *
 * EVERY deviceCall GETS A deviceReply, even when the device could not be reached: a thrown error
 * goes back as a `Failure`, so wardd ends the conversation -- and releases its lock -- instead of
 * waiting on a reply that will never come.
 */
import {
    RELAY_PROTOCOL_VERSION,
    type RelayDevice,
    type RelayErrorCode,
    RelayFailure,
    type RelayMessage,
    type RelayServerFrame,
    type WardRelay,
    type WardRelayEndpoint,
} from '@trezor/ward';

export const WARDD_DEFAULT_URL = 'ws://127.0.0.1:21329';

export type WarddClientOptions = {
    url?: string;
    /** the pairing token wardd was started with */
    token: string;
    /** a WebSocket constructor, where the global one is missing or must not be used */
    WebSocket?: typeof globalThis.WebSocket;
};

type Pending = {
    resolve: (result: Record<string, unknown>) => void;
    reject: (error: Error) => void;
    device?: RelayDevice;
};

class SocketEndpoint implements WardRelayEndpoint {
    private nextId = 1;
    private readonly pending = new Map<number, Pending>();
    private closed?: Error;

    constructor(private readonly socket: WebSocket) {
        socket.onmessage = event => this.onFrame(String(event.data));
        socket.onclose = () =>
            this.fail(new RelayFailure('internal', 'wardd closed the connection'));
    }

    call(method: string, params: Record<string, unknown> = {}, device?: RelayDevice) {
        if (this.closed) return Promise.reject(this.closed);
        const id = this.nextId++;

        return new Promise<Record<string, unknown>>((resolve, reject) => {
            this.pending.set(id, { resolve, reject, device });
            this.socket.send(JSON.stringify({ id, method, params }));
        });
    }

    close() {
        this.socket.close();
        this.fail(new RelayFailure('internal', 'the client closed the connection'));
    }

    private fail(error: Error) {
        this.closed ??= error;
        for (const { reject } of this.pending.values()) reject(error);
        this.pending.clear();
    }

    private onFrame(data: string) {
        let frame: RelayServerFrame;
        try {
            frame = JSON.parse(data);
        } catch {
            return;
        }
        const waiting = this.pending.get(frame.id);
        if (!waiting) return;
        if ('deviceCall' in frame) {
            // KNOWN DEFICIENCY: the server is untrusted, yet any deviceCall is forwarded to the
            // caller's device -- no allowlist, unlike the Python and Rust adapters.
            // FIXME(ward): allow per method only the messages that method's flow sends.
            void this.answer(frame.id, frame.deviceCall, waiting.device);

            return;
        }
        this.pending.delete(frame.id);
        if ('error' in frame) {
            waiting.reject(
                new RelayFailure(frame.error.code as RelayErrorCode, frame.error.message),
            );
        } else {
            waiting.resolve(frame.result);
        }
    }

    private async answer(id: number, message: RelayMessage, device?: RelayDevice) {
        let reply: RelayMessage;
        try {
            if (!device) throw new Error(`no device to answer ${message.name}`);
            reply = await device(message);
        } catch (error) {
            reply = {
                name: 'Failure',
                message: { message: error instanceof Error ? error.message : String(error) },
            };
        }
        if (!this.closed) this.socket.send(JSON.stringify({ id, deviceReply: reply }));
    }
}

export class WarddClient implements WardRelay {
    constructor(private readonly options: WarddClientOptions) {}

    /** Open a socket and say hello; resolves once wardd has accepted the token. */
    async connect(): Promise<WardRelayEndpoint> {
        const url = this.options.url ?? WARDD_DEFAULT_URL;
        const Ctor = this.options.WebSocket ?? globalThis.WebSocket;
        if (!Ctor) throw new Error('no WebSocket implementation available to reach wardd');
        const socket = new Ctor(url);
        await new Promise<void>((resolve, reject) => {
            socket.onopen = () => resolve();
            socket.onerror = () =>
                reject(new RelayFailure('internal', `wardd is not reachable at ${url}`));
        });
        const endpoint = new SocketEndpoint(socket);
        try {
            await endpoint.call('hello', {
                version: RELAY_PROTOCOL_VERSION,
                token: this.options.token,
            });
        } catch (error) {
            // a refused hello must not leave a socket open behind it
            endpoint.close();
            throw error;
        }

        return endpoint;
    }
}
