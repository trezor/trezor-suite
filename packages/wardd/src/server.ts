/**
 * The relay over a WebSocket on 127.0.0.1, for host libraries that run in another process (HWI).
 * Connect calls `Wardd` in-process instead; both reach the same endpoints.
 *
 * TWO GATES. A browser page can open a socket to localhost, so an Origin header -- which only a
 * browser sends, and which page script cannot forge -- must be on the allow-list, as for Trezor
 * Bridge. And EVERY client must present the pairing token in `hello` before anything else, which
 * keeps out another local process, or an allowed origin's page, without the token.
 *
 * One socket is one endpoint. Its calls may overlap: a conversation waits on a `deviceReply` while
 * the same client's `answerProofRequest` (the device's pull, raised inside that very reply) is answered.
 */
import { createHash, timingSafeEqual } from 'crypto';
import { type AddressInfo } from 'net';
import { WebSocketServer } from 'ws';

import {
    RELAY_PROTOCOL_VERSION,
    type RelayCallFrame,
    type RelayClientFrame,
    RelayFailure,
    type RelayMessage,
    type RelayServerFrame,
    type WardRelay,
} from '@trezor/ward';

export const DEFAULT_PORT = 21329;

export const DEFAULT_ORIGINS = [
    'https://suite.trezor.io',
    'https://connect.trezor.io',
    'http://localhost:8000',
    'http://localhost:8088',
];

export type ServerOptions = {
    wardd: WardRelay;
    token: string;
    port?: number;
    allowedOrigins?: readonly string[];
};

const digest = (s: string) => createHash('sha256').update(s).digest();
const tokenMatches = (given: unknown, token: string) =>
    typeof given === 'string' && timingSafeEqual(digest(given), digest(token));
const major = (v: string) => v.split('.')[0];

export const startServer = async (opts: ServerOptions) => {
    const allowed = new Set(opts.allowedOrigins ?? DEFAULT_ORIGINS);
    const wss = new WebSocketServer({
        host: '127.0.0.1',
        port: opts.port ?? DEFAULT_PORT,
        verifyClient: ({ origin }: { origin?: string }) => !origin || allowed.has(origin),
    });
    await new Promise<void>((resolve, reject) => {
        wss.once('listening', resolve);
        wss.once('error', reject);
    });

    wss.on('connection', socket => {
        let authed = false;
        const endpoint = opts.wardd.connect();
        const pending = new Map<
            number,
            { resolve: (reply: RelayMessage) => void; reject: (e: Error) => void }
        >();
        const send = (frame: RelayServerFrame) => socket.send(JSON.stringify(frame));

        // A CLIENT THAT GOES AWAY MID-CONVERSATION must end it, or the conversation lock is
        // held forever.
        socket.on('close', () => {
            for (const { reject } of pending.values()) {
                reject(new RelayFailure('device_failure', 'the client went away'));
            }
            pending.clear();
            void endpoint.then(e => e.close());
        });

        const handle = async (call: RelayCallFrame): Promise<Record<string, unknown>> => {
            const params = (call.params ?? {}) as Record<string, unknown>;
            if (call.method === 'hello') {
                if (
                    typeof params.version !== 'string' ||
                    major(params.version) !== major(RELAY_PROTOCOL_VERSION)
                ) {
                    throw new RelayFailure(
                        'version_mismatch',
                        `wardd speaks ${RELAY_PROTOCOL_VERSION}`,
                    );
                }
                if (!tokenMatches(params.token, opts.token)) {
                    throw new RelayFailure('unauthorised', 'wrong pairing token');
                }
                authed = true;

                return { version: RELAY_PROTOCOL_VERSION, wardd: 'wardd/1.0.0' };
            }
            if (!authed) throw new RelayFailure('unauthorised', 'hello first');
            const device = (message: RelayMessage) =>
                new Promise<RelayMessage>((resolve, reject) => {
                    pending.set(call.id, { resolve, reject });
                    send({ id: call.id, deviceCall: message });
                });

            return (await endpoint).call(call.method, params, device);
        };

        socket.on('message', data => {
            let frame: RelayClientFrame;
            try {
                frame = JSON.parse(String(data));
            } catch {
                return send({ id: 0, error: { code: 'bad_request', message: 'not JSON' } });
            }
            if (typeof frame?.id !== 'number') {
                return send({ id: 0, error: { code: 'bad_request', message: 'no id' } });
            }
            if ('deviceReply' in frame) {
                const waiting = pending.get(frame.id);
                if (!waiting) {
                    return send({
                        id: frame.id,
                        error: { code: 'bad_request', message: 'no deviceCall is waiting' },
                    });
                }
                pending.delete(frame.id);

                return waiting.resolve(frame.deviceReply);
            }
            const call = frame;
            const { id } = call;
            handle(call).then(
                result => send({ id, result }),
                (e: unknown) => {
                    pending.delete(id);
                    const code = e instanceof RelayFailure ? e.code : 'internal';
                    send({
                        id,
                        error: { code, message: e instanceof Error ? e.message : String(e) },
                    });
                    // a refused hello ends the socket; "hello first" leaves it to say hello
                    if (call.method === 'hello' && e instanceof RelayFailure) socket.close();
                },
            );
        });
    });

    return {
        port: (wss.address() as AddressInfo).port,
        close: () =>
            new Promise<void>(resolve => {
                for (const client of wss.clients) client.terminate();
                wss.close(() => resolve());
            }),
    };
};
