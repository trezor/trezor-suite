/**
 * A client of `wardd`, the local WARD service, speaking the relay contract
 * (`packages/ward-core/relay.md`, version 1.x).
 *
 * THE FRAMES ARE RESTATED HERE rather than imported, because `@trezor/connect` is published and the
 * contract's types live in a private package. They are four shapes and a version string; a binding
 * in any other language restates them the same way.
 *
 * A call is a CONVERSATION: wardd may answer with any number of `deviceCall`s before its result,
 * and each must be answered with exactly one `deviceReply` -- the device's response, pulls and
 * `Failure` included. `call` runs that loop with whatever `onDeviceCall` the caller supplies.
 */

export const WARDD_DEFAULT_URL = 'ws://127.0.0.1:21329';
export const WARDD_RELAY_VERSION = '1.0';

/** A protobuf message by name, JSON body, bytes as hex. */
export type WarddMessage = { name: string; message: Record<string, unknown> };

type WarddFrame =
    | { id: number; deviceCall: WarddMessage }
    | { id: number; result: Record<string, unknown> }
    | { id: number; error: { code: string; message: string } };

/** wardd's refusal; `code` is the contract's error code (`wm_conflict`, `needs_rejoin`, ...). */
export class WarddError extends Error {
    constructor(
        readonly code: string,
        message: string,
    ) {
        super(`${code}: ${message}`);
        this.name = 'WarddError';
    }
}

export type OnDeviceCall = (message: WarddMessage) => Promise<WarddMessage>;

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
    onDeviceCall?: OnDeviceCall;
};

/**
 * Connect's decoder reports an absent field as `null`, and its encoder refuses `null` for a scalar.
 * Anything that came back from a device and is about to go back to one -- a stored leaf, served by
 * wardd -- must lose its nulls first, or the call fails on framing rather than on its merits.
 */
export const stripNulls = (value: unknown): any => {
    if (Array.isArray(value)) return value.map(stripNulls);
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([, v]) => v !== null && v !== undefined)
                .map(([k, v]) => [k, stripNulls(v)]),
        );
    }

    return value;
};

export class WarddClient {
    private nextId = 1;
    private readonly pending = new Map<number, Pending>();
    private closed?: Error;

    private constructor(private readonly socket: WebSocket) {
        socket.onmessage = event => this.onFrame(String(event.data));
        socket.onclose = () => this.fail(new WarddError('closed', 'wardd closed the connection'));
    }

    /** Open a socket and say hello; resolves once wardd has accepted the token. */
    static async connect(options: WarddClientOptions): Promise<WarddClient> {
        const Ctor = options.WebSocket ?? globalThis.WebSocket;
        if (!Ctor) throw new Error('no WebSocket implementation available to reach wardd');
        const socket = new Ctor(options.url ?? WARDD_DEFAULT_URL);
        await new Promise<void>((resolve, reject) => {
            socket.onopen = () => resolve();
            socket.onerror = () =>
                reject(
                    new WarddError(
                        'unreachable',
                        `wardd is not reachable at ${options.url ?? WARDD_DEFAULT_URL}`,
                    ),
                );
        });
        const client = new WarddClient(socket);
        try {
            await client.call('hello', { version: WARDD_RELAY_VERSION, token: options.token });
        } catch (error) {
            // a refused hello must not leave a socket open behind it
            client.close();
            throw error;
        }

        return client;
    }

    /** One call -- a conversation if wardd needs the device, answered through `onDeviceCall`. */
    call(
        method: string,
        params: Record<string, unknown> = {},
        onDeviceCall?: OnDeviceCall,
    ): Promise<Record<string, unknown>> {
        if (this.closed) return Promise.reject(this.closed);
        const id = this.nextId++;

        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject, onDeviceCall });
            this.socket.send(JSON.stringify({ id, method, params }));
        });
    }

    close() {
        this.socket.close();
        this.fail(new WarddError('closed', 'the client closed the connection'));
    }

    private fail(error: Error) {
        this.closed ??= error;
        for (const { reject } of this.pending.values()) reject(error);
        this.pending.clear();
    }

    private onFrame(data: string) {
        let frame: WarddFrame;
        try {
            frame = JSON.parse(data);
        } catch {
            return;
        }
        const waiting = this.pending.get(frame.id);
        if (!waiting) return;
        if ('deviceCall' in frame) {
            this.answer(frame.id, frame.deviceCall, waiting.onDeviceCall);

            return;
        }
        this.pending.delete(frame.id);
        if ('error' in frame) waiting.reject(new WarddError(frame.error.code, frame.error.message));
        else waiting.resolve(frame.result);
    }

    /**
     * EVERY deviceCall GETS A deviceReply, even when the device could not be reached: a thrown
     * error goes back as a `Failure`, so wardd ends the conversation -- and releases the wallet --
     * instead of waiting on a reply that will never come.
     */
    private async answer(id: number, message: WarddMessage, onDeviceCall?: OnDeviceCall) {
        let reply: WarddMessage;
        try {
            if (!onDeviceCall) throw new Error(`no device to answer ${message.name}`);
            reply = await onDeviceCall(message);
        } catch (error) {
            reply = {
                name: 'Failure',
                message: { message: error instanceof Error ? error.message : String(error) },
            };
        }
        if (!this.closed) this.socket.send(JSON.stringify({ id, deviceReply: reply }));
    }
}
