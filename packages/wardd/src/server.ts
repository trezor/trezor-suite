/**
 * The relay endpoint: `relay.md` over a WebSocket on 127.0.0.1.
 *
 * TWO GATES. A browser page can open a socket to localhost, so an Origin header -- which only a
 * browser sends, and which page script cannot forge -- must be on the allow-list, as for Trezor
 * Bridge. And EVERY client must present the pairing token in `hello` before anything else, which
 * is what keeps out another local process or an allowed origin's page without the token.
 */
import { createHash, timingSafeEqual } from 'crypto';
import { type AddressInfo } from 'net';
import { WebSocketServer } from 'ws';

import {
    type ClientFrame,
    RELAY_PROTOCOL_VERSION,
    type RelayCall,
    type RelayErrorCode,
    type RelayMessage,
    type WarddFrame,
} from '@trezor/ward-core';

import { type Device, RelayFailure, type WardHost } from './host';
import { type Wardd } from './service';

export const DEFAULT_PORT = 21329;

export const DEFAULT_ORIGINS = [
    'https://suite.trezor.io',
    'https://connect.trezor.io',
    'http://localhost:8000',
    'http://localhost:8088',
];

export interface ServerOptions {
    wardd: Wardd;
    token: string;
    port?: number;
    allowedOrigins?: readonly string[];
}

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
        let host: WardHost | null = null;
        const pending = new Map<
            number,
            { resolve: (reply: RelayMessage) => void; reject: (e: Error) => void }
        >();
        const send = (frame: WarddFrame) => socket.send(JSON.stringify(frame));
        const fail = (id: number, code: RelayErrorCode, message: string) =>
            send({ id, error: { code, message } });

        // A CLIENT THAT GOES AWAY MID-CONVERSATION must end it, or the wallet's lock is held forever.
        socket.on('close', () => {
            for (const { reject } of pending.values()) {
                reject(new RelayFailure('device_failure', 'the client went away'));
            }
            pending.clear();
        });

        const handle = async (call: RelayCall): Promise<Record<string, unknown>> => {
            const p = (call.params ?? {}) as Record<string, any>;
            if (call.method === 'hello') {
                if (
                    typeof p.version !== 'string' ||
                    major(p.version) !== major(RELAY_PROTOCOL_VERSION)
                ) {
                    throw new RelayFailure(
                        'version_mismatch',
                        `wardd speaks ${RELAY_PROTOCOL_VERSION}`,
                    );
                }
                if (!tokenMatches(p.token, opts.token)) {
                    throw new RelayFailure('unauthorised', 'wrong pairing token');
                }
                authed = true;

                return { version: RELAY_PROTOCOL_VERSION, wardd: 'wardd/1.0.0' };
            }
            if (!authed) throw new RelayFailure('unauthorised', 'hello first');
            if (call.method === 'openStore') {
                if (typeof p.wardId !== 'string') throw new RelayFailure('bad_request', 'wardId');
                host = await opts.wardd.openStore({ wardId: p.wardId, evoluNode: p.evoluNode });
                const { counter, root } = await host.status();

                return { counter, root };
            }
            if (!host) throw new RelayFailure('no_store', 'openStore first');
            const device: Device = message =>
                new Promise((resolve, reject) => {
                    pending.set(call.id, { resolve, reject });
                    send({ id: call.id, deviceCall: message });
                });
            switch (call.method) {
                case 'serveEntry':
                    return { ...(await host.serveEntry(p.request ?? {}, p.staged ?? [])) };
                case 'applyResult':
                    return host.applyResult(p);
                case 'sync':
                    return { ...(await host.sync(device, { rejoin: !!p.rejoin })) };
                case 'flush':
                    return { ...(await host.flush(device, { maxBatch: p.maxBatch })) };
                case 'status':
                    return host.status();
                default:
                    throw new RelayFailure('bad_request', `unknown method ${String(call.method)}`);
            }
        };

        socket.on('message', data => {
            let frame: ClientFrame;
            try {
                frame = JSON.parse(String(data));
            } catch {
                return fail(0, 'bad_request', 'not JSON');
            }
            if (typeof frame?.id !== 'number') return fail(0, 'bad_request', 'no id');
            if ('deviceReply' in frame) {
                const waiting = pending.get(frame.id);
                if (!waiting) return fail(frame.id, 'bad_request', 'no deviceCall is waiting');
                pending.delete(frame.id);

                return waiting.resolve(frame.deviceReply);
            }
            const { id } = frame;
            handle(frame).then(
                result => send({ id, result }),
                (e: unknown) => {
                    pending.delete(id);
                    if (e instanceof RelayFailure) fail(id, e.code, e.message);
                    else fail(id, 'internal', e instanceof Error ? e.message : String(e));
                    // a wrong token ends the socket; "hello first" leaves it to say hello
                    if (frame.method === 'hello' && e instanceof RelayFailure) socket.close();
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
